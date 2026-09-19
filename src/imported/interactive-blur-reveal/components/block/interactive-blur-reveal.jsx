"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const MAX_TRAIL_POINTS = 240;
const FULLSCREEN_TRIANGLE_VERTICES = new Float32Array([
  -1, -1,
  1, -1,
  -1, 1,
  -1, 1,
  1, -1,
  1, 1,
]);
const TEXTURE_UNIT_BASE = 0;
const TEXTURE_UNIT_NOISE = 1;
const DEFAULT_POINTER_POSITION = 0.5;
const DEFAULT_FRAME_TIME_MS = 16.67;
const MAX_FRAME_DELTA_MS = 64;
const POINTER_LERP_FACTOR = 0.001;
const POINTER_LEAVE_DURATION_MS = 180;
const TRAIL_LIFETIME_MS = 650;
const MIN_POINTER_DISTANCE_INSIDE = 0.0022;
const MIN_POINTER_DISTANCE_LEAVING = 0.0013;

const BLUR_REVEAL_VERT = /* glsl */ `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const BLUR_REVEAL_FRAG = /* glsl */ `#version 300 es
precision highp float;

#define MAX_TRAIL_POINTS 240

uniform vec2      iResolution;
uniform float     iTime;
uniform vec2      iTrail[MAX_TRAIL_POINTS];
uniform float     iTrailAlpha[MAX_TRAIL_POINTS];
uniform int       iTrailCount;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

out vec4 fragColor;

vec2 distortUv(vec2 uv) {
  vec2 noiseUv = uv * 2.2;
  vec2 noiseOffset = texture(iChannel1, noiseUv).xy - 0.5;

  return uv + noiseOffset * 0.012;
}

vec4 blur21(sampler2D tex, vec2 uv, float radiusPx) {
  vec2 px = radiusPx / iResolution;
  vec4 color = vec4(0.0);

  color += texture(tex, uv) * 0.12;

  color += texture(tex, uv + px * vec2(1.0, 0.0)) * 0.08;
  color += texture(tex, uv + px * vec2(-1.0, 0.0)) * 0.08;
  color += texture(tex, uv + px * vec2(0.0, 1.0)) * 0.08;
  color += texture(tex, uv + px * vec2(0.0, -1.0)) * 0.08;

  color += texture(tex, uv + px * vec2(1.0, 1.0)) * 0.065;
  color += texture(tex, uv + px * vec2(-1.0, 1.0)) * 0.065;
  color += texture(tex, uv + px * vec2(1.0, -1.0)) * 0.065;
  color += texture(tex, uv + px * vec2(-1.0, -1.0)) * 0.065;

  color += texture(tex, uv + px * vec2(2.0, 0.0)) * 0.045;
  color += texture(tex, uv + px * vec2(-2.0, 0.0)) * 0.045;
  color += texture(tex, uv + px * vec2(0.0, 2.0)) * 0.045;
  color += texture(tex, uv + px * vec2(0.0, -2.0)) * 0.045;

  color += texture(tex, uv + px * vec2(3.0, 1.0)) * 0.025;
  color += texture(tex, uv + px * vec2(-3.0, 1.0)) * 0.025;
  color += texture(tex, uv + px * vec2(3.0, -1.0)) * 0.025;
  color += texture(tex, uv + px * vec2(-3.0, -1.0)) * 0.025;

  return color;
}

float sdSegment(vec2 point, vec2 start, vec2 end) {
  vec2 pointDelta = point - start;
  vec2 segmentDelta = end - start;
  float segmentProjection = clamp(
    dot(pointDelta, segmentDelta) / max(dot(segmentDelta, segmentDelta), 0.00001),
    0.0,
    1.0
  );

  return length(pointDelta - segmentDelta * segmentProjection);
}

float fluidTrailRevealMask(vec2 uv) {
  float aspect = iResolution.x / iResolution.y;
  vec2 point = vec2(uv.x * aspect, uv.y);
  float mask = 0.0;

  for (int i = 0; i < MAX_TRAIL_POINTS - 1; i++) {
    if (i >= iTrailCount - 1) {
      break;
    }

    vec2 start = vec2(iTrail[i].x * aspect, iTrail[i].y);
    vec2 end = vec2(iTrail[i + 1].x * aspect, iTrail[i + 1].y);
    float alpha = min(iTrailAlpha[i], iTrailAlpha[i + 1]);
    float distance = sdSegment(point, start, end);

    float noiseA = texture(iChannel1, uv * 4.0 + float(i) * 0.018).r;
    float noiseB = texture(iChannel1, uv * 10.0 + vec2(noiseA * 0.4, float(i) * 0.01)).r;
    float noiseC = texture(iChannel1, uv * 24.0 - float(i) * 0.006).r;
    float fluidNoise = noiseA * 0.45 + noiseB * 0.35 + noiseC * 0.20;

    float radius = 0.095 + (fluidNoise - 0.5) * 0.055;
    float softness = 0.09;
    float localMask = 1.0 - smoothstep(radius, radius + softness, distance);

    mask = max(mask, localMask * alpha);
  }

  float cloudNoise = texture(iChannel1, uv * 7.0).r;
  float fineNoise = texture(iChannel1, uv * 22.0).r;

  mask *= smoothstep(0.12, 0.95, mask + cloudNoise * 0.25 + fineNoise * 0.12);

  return clamp(mask, 0.0, 1.0);
}

vec3 filmGrain(vec2 uv) {
  // Layered grain keeps the frosted area from feeling digitally flat.
  vec2 coarseUv = uv * (iResolution.xy / 260.0) + vec2(iTime * 0.035, -iTime * 0.028);
  vec2 fineUv = uv * (iResolution.xy / 120.0) + vec2(-iTime * 0.055, iTime * 0.041);
  vec3 coarse = texture(iChannel1, coarseUv).rgb - 0.5;
  float fine = texture(iChannel1, fineUv).r - 0.5;
  vec3 chroma = vec3(coarse.r, coarse.g * 0.9, coarse.b * 1.1);

  return chroma * 0.95 + fine * 0.65;
}

void main() {
  vec2 screenUv = gl_FragCoord.xy / iResolution.xy;
  screenUv.y = 1.0 - screenUv.y;

  vec2 imageUv = screenUv;
  vec4 frostedImage = blur21(iChannel0, distortUv(imageUv), 42.0);
  vec4 clearImage = texture(iChannel0, imageUv);
  float revealMask = fluidTrailRevealMask(screenUv);
  float grain = texture(iChannel1, screenUv * iResolution.xy / 180.0).r;

  frostedImage.rgb = mix(frostedImage.rgb, vec3(0.70, 0.76, 0.78), 0.18);
  frostedImage.rgb += (grain - 0.5) * 0.045;
  frostedImage.rgb *= 0.96;

  vec4 mixed = mix(frostedImage, clearImage, revealMask);

  // Grain stays stronger in the frosted region so the reveal feels tactile.
  float grainAmount = mix(0.24, 0.12, revealMask);
  mixed.rgb += filmGrain(screenUv) * grainAmount;

  // A soft vignette keeps the edges from competing with the reveal path.
  vec2 vignetteDelta = screenUv - 0.5;
  float vignette = smoothstep(0.85, 0.25, dot(vignetteDelta, vignetteDelta) * 1.35);
  mixed.rgb *= mix(0.96, 1.0, vignette);

  fragColor = vec4(clamp(mixed.rgb, 0.0, 1.0), 1.0);
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Shader allocation failed.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    throw new Error("Shader compilation failed.");
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  let vertexShader;
  let fragmentShader;
  let program;
  try {
    vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    program = gl.createProgram();
    if (!program) throw new Error("Program allocation failed.");
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error("Program linking failed.");
    }
    return program;
  } catch (error) {
    if (program) gl.deleteProgram(program);
    throw error;
  } finally {
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
  }
}

function loadImage(source, signal) {
  return new Promise((resolve, reject) => {
    const image = source instanceof HTMLImageElement ? source : new Image();
    const removeListeners = () => {
      image.removeEventListener("load", onLoad);
      image.removeEventListener("error", onError);
      signal.removeEventListener("abort", onAbort);
    };
    const onLoad = () => { removeListeners(); resolve(image); };
    const onError = () => { removeListeners(); reject(new Error("Image unavailable.")); };
    const onAbort = () => { removeListeners(); reject(new Error("Image loading cancelled.")); };
    if (signal.aborted) { onAbort(); return; }
    image.addEventListener("load", onLoad);
    image.addEventListener("error", onError);
    signal.addEventListener("abort", onAbort, { once: true });
    if (!(source instanceof HTMLImageElement)) {
      image.crossOrigin = "anonymous";
      image.src = source;
    }
    if (image.complete && image.naturalWidth > 0) onLoad();
  });
}

function createTexture(gl, image, unit, shouldRepeat = false) {
  const texture = gl.createTexture();
  if (!texture) throw new Error("Texture allocation failed.");
  try {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, shouldRepeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, shouldRepeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  } catch (error) {
    gl.deleteTexture(texture);
    throw error;
  }
}

/**
 * @param {{ imageSrc?: string, noiseSrc?: string, iChannel0?: string | HTMLImageElement, iChannel1?: string | HTMLImageElement, className?: string, style?: import("react").CSSProperties, paused?: boolean, alt?: string }} props
 */
export function InteractiveBlurReveal({
  imageSrc = "/cdn/effects/interactive-blur-reveal/interactive-blur-reveal-img01.webp?v=3",
  noiseSrc = "/cdn/effects/interactive-blur-reveal/interactive-blur-reveal-noise.png?v=3",
  iChannel0 = imageSrc,
  iChannel1 = noiseSrc,
  className,
  style,
  paused = false,
  alt = "ObsidianUI frosted image with a fluid cursor reveal",
} = {}) {
  const canvasRef = useRef(null);
  const trailRef = useRef([]);
  const pointerRef = useRef({
    isInside: false,
    targetX: DEFAULT_POINTER_POSITION,
    targetY: DEFAULT_POINTER_POSITION,
    x: DEFAULT_POINTER_POSITION,
    y: DEFAULT_POINTER_POSITION,
    lastTime: 0,
    isLeaving: false,
    leaveAt: 0,
  });

  useEffect(() => {
    let isDisposed = false;
    let animationFrameId = 0;
    const controller = new AbortController();
    const disposeResources = [];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isStatic = () => paused || motion.matches;
    trailRef.current = [];
    const cleanup = () => {
      if (isDisposed) return;
      isDisposed = true;
      controller.abort();
      cancelAnimationFrame(animationFrameId);
      disposeResources.reverse().forEach((dispose) => dispose());
    };

    // ─── WebGL Setup ───────────────────────────────────────────────────────
    async function init() {
      const canvas = canvasRef.current;

      if (!canvas) return;

      const gl = canvas.getContext("webgl2");

      if (!gl) {
        return;
      }

      const program = createProgram(gl, BLUR_REVEAL_VERT, BLUR_REVEAL_FRAG);
      disposeResources.push(() => gl.deleteProgram(program));
      const positionBuffer = gl.createBuffer();
      if (!positionBuffer) throw new Error("Buffer allocation failed.");
      disposeResources.push(() => gl.deleteBuffer(positionBuffer));
      const onContextLost = (event) => {
        event.preventDefault();
        canvas.style.opacity = "0";
        cleanup();
      };
      canvas.addEventListener("webglcontextlost", onContextLost);
      disposeResources.push(() => canvas.removeEventListener("webglcontextlost", onContextLost));
      const positionLocation = gl.getAttribLocation(program, "position");
      const resolutionLocation = gl.getUniformLocation(program, "iResolution");
      const timeLocation = gl.getUniformLocation(program, "iTime");
      const trailLocation = gl.getUniformLocation(program, "iTrail[0]");
      const trailAlphaLocation = gl.getUniformLocation(program, "iTrailAlpha[0]");
      const trailCountLocation = gl.getUniformLocation(program, "iTrailCount");
      const channel0Location = gl.getUniformLocation(program, "iChannel0");
      const channel1Location = gl.getUniformLocation(program, "iChannel1");

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_TRIANGLE_VERTICES, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const [baseImage, noiseImage] = await Promise.all([
        loadImage(iChannel0, controller.signal),
        loadImage(iChannel1, controller.signal),
      ]);

      if (isDisposed) return;

      const baseTexture = createTexture(gl, baseImage, TEXTURE_UNIT_BASE);
      disposeResources.push(() => gl.deleteTexture(baseTexture));
      const noiseTexture = createTexture(gl, noiseImage, TEXTURE_UNIT_NOISE, true);
      disposeResources.push(() => gl.deleteTexture(noiseTexture));

      gl.uniform1i(channel0Location, TEXTURE_UNIT_BASE);
      gl.uniform1i(channel1Location, TEXTURE_UNIT_NOISE);

      // ─── Canvas Resize
      function onResize() {
        const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        const nextWidth = Math.max(1, Math.floor(rect.width * devicePixelRatio));
        const nextHeight = Math.max(1, Math.floor(rect.height * devicePixelRatio));

        if (canvas.width === nextWidth && canvas.height === nextHeight) return;

        canvas.width = nextWidth;
        canvas.height = nextHeight;

        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      // ─── Animation Loop
      const trailData = new Float32Array(MAX_TRAIL_POINTS * 2);
      const trailAlphaData = new Float32Array(MAX_TRAIL_POINTS);
      function render() {
        if (isDisposed) return;

        const now = performance.now();

        gl.uniform1f(timeLocation, isStatic() ? 0 : now / 1000);

        const pointer = pointerRef.current;
        const frameDelta = pointer.lastTime
          ? Math.min(MAX_FRAME_DELTA_MS, now - pointer.lastTime)
          : DEFAULT_FRAME_TIME_MS;

        pointer.lastTime = now;

        // Exponential smoothing keeps the cursor feel consistent across frame rates.
        const smoothing = 1.0 - Math.pow(POINTER_LERP_FACTOR, frameDelta / 1000);

        pointer.x += (pointer.targetX - pointer.x) * smoothing;
        pointer.y += (pointer.targetY - pointer.y) * smoothing;

        const leavingAge = pointer.isLeaving ? now - pointer.leaveAt : 0;
        const isLeavingActive =
          pointer.isLeaving && leavingAge < POINTER_LEAVE_DURATION_MS;
        const pushStrength = isStatic() ? 0 : pointer.isInside
          ? 1
          : isLeavingActive
            ? 1 - leavingAge / POINTER_LEAVE_DURATION_MS
            : 0;

        if (pushStrength > 0) {
          const trail = trailRef.current;
          const lastPoint = trail[trail.length - 1];
          const deltaX = lastPoint ? pointer.x - lastPoint.x : 1;
          const deltaY = lastPoint ? pointer.y - lastPoint.y : 1;
          const distance = Math.hypot(deltaX, deltaY);
          const minPointerDistance = pointer.isInside
            ? MIN_POINTER_DISTANCE_INSIDE
            : MIN_POINTER_DISTANCE_LEAVING;

          if (!lastPoint || distance > minPointerDistance) {
            trail.push({
              x: pointer.x,
              y: pointer.y,
              time: now,
              strength: pushStrength,
            });
          }
        }

        let trail = trailRef.current.filter(
          (point) => now - point.time < TRAIL_LIFETIME_MS
        );

        if (trail.length > MAX_TRAIL_POINTS) {
          trail = trail.slice(trail.length - MAX_TRAIL_POINTS);
        }

        trailRef.current = trail;

        trailData.fill(0);
        trailAlphaData.fill(0);

        trail.forEach((point, index) => {
          const age = now - point.time;
          const life = Math.max(0, 1 - age / TRAIL_LIFETIME_MS);

          // Smooth alpha easing avoids a visible cutoff at the end of the trail.
          const baseAlpha = life * life * (3 - 2 * life);

          trailData[index * 2] = point.x;
          trailData[index * 2 + 1] = point.y;
          trailAlphaData[index] = baseAlpha * (point.strength ?? 1);
        });

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        gl.uniform2fv(trailLocation, trailData);
        gl.uniform1fv(trailAlphaLocation, trailAlphaData);
        gl.uniform1i(trailCountLocation, trail.length);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        canvas.style.opacity = "1";
        if (!isStatic()) animationFrameId = requestAnimationFrame(render);
      }

      const observer = new ResizeObserver(() => { onResize(); if (isStatic()) render(); });
      observer.observe(canvas.parentElement);
      disposeResources.push(() => observer.disconnect());
      const onMotionChange = () => {
        cancelAnimationFrame(animationFrameId);
        trailRef.current = [];
        render();
      };
      motion.addEventListener("change", onMotionChange);
      disposeResources.push(() => motion.removeEventListener("change", onMotionChange));
      onResize();
      render();

    }

    init().catch(() => {
      if (isDisposed) return;
      if (canvasRef.current) canvasRef.current.style.opacity = "0";
      cleanup();
    });
    return cleanup;
  }, [iChannel0, iChannel1, paused]);

  function updatePointerFromEvent(event) {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const pointer = pointerRef.current;

    pointer.targetX = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
    pointer.targetY = Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height)));
  }

  function onPointerEnter(event) {
    const pointer = pointerRef.current;

    pointer.isInside = true;
    pointer.isLeaving = false;
    updatePointerFromEvent(event);
  }

  function onPointerMove(event) {
    updatePointerFromEvent(event);
  }

  function onPointerLeave() {
    const pointer = pointerRef.current;

    pointer.isInside = false;
    pointer.isLeaving = true;
    pointer.leaveAt = performance.now();
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn("relative h-[28rem] w-full overflow-hidden bg-[var(--bg)]", className)}
      style={style}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 scale-110 bg-cover bg-center blur-xl"
        style={{ backgroundImage: typeof iChannel0 === "string" ? `url(${JSON.stringify(iChannel0)})` : undefined }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerLeave}
        className="absolute inset-0 block h-full w-full opacity-0"
      />
    </div>
  );
}
