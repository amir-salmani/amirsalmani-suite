"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Experience } from "@/lib/effects/book-flip/Experience";
import { PageProvider, usePage } from "@/lib/effects/book-flip/PageContext";
import { WebGLSurface, useEffectReducedMotion } from "@/lib/effects/shared/webgl-surface";

const defaultPageColors = [
  "#1e1b4b",
  "#7c3aed",
  "#7c3aed",
  "#0ea5e9",
  "#0ea5e9",
  "#10b981",
  "#10b981",
  "#f59e0b",
  "#f59e0b",
  "#ef4444",
  "#ef4444",
  "#ec4899",
  "#ec4899",
  "#0f172a",
];
const defaultCameraDistance = { mobile: 5.5, desktop: 4 };

function CameraFit({ cameraDistance }) {
  const { camera, size } = useThree();
  useEffect(() => {
    camera.position.set(-0.5, 1, size.width < 480 ? cameraDistance.mobile : cameraDistance.desktop);
    camera.updateProjectionMatrix();
  }, [camera, size.width, cameraDistance]);
  return null;
}

function BookNavigation({ pageCount }) {
  const { page, setPage } = usePage();
  const count = pageCount;
  return <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-3">
    <div role="group" aria-label="Book pages" className="pointer-events-auto flex max-w-full gap-2 overflow-x-auto rounded-full bg-[var(--bg)]/20 p-1">
      {Array.from({ length: count + 1 }, (_, index) => <button
        key={index}
        type="button"
        aria-pressed={index === page}
        onClick={() => setPage(index)}
        className={`shrink-0 rounded-full px-3 py-2 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fg)] ${index === page ? "bg-[var(--fg)]/90 text-[var(--bg)]" : "bg-[var(--bg)]/30 text-[var(--fg)]"}`}
      >{index === 0 ? "Cover" : index === count ? "Back cover" : `Page ${index}`}</button>)}
    </div>
  </div>;
}

function BookScene({ images, pageColors, pageCount, pathPattern, bgColor, cameraDistance, showUI }) {
  const reducedMotion = useEffectReducedMotion();
  return <PageProvider>
    <Canvas
      frameloop={reducedMotion ? "demand" : "always"}
      dpr={[1, 2]}
      style={{ position: "absolute", inset: 0, background: bgColor }}
      camera={{ position: [-0.5, 1, cameraDistance.desktop], fov: 45 }}
    >
      <CameraFit cameraDistance={cameraDistance} />
      <Suspense fallback={null}>
        <Experience images={images} pageColors={pageColors} pathPattern={pathPattern} orbitControls={{ minAzimuthAngle: -Math.PI * 0.06, maxAzimuthAngle: Math.PI * 0.06, minPolarAngle: 1.07, maxPolarAngle: 1.58, rotateSpeed: 0.2, enableDamping: !reducedMotion }} />
      </Suspense>
    </Canvas>
    {showUI && <BookNavigation pageCount={pageCount} />}
  </PageProvider>;
}

/**
 * Colour pages render by default with zero network requests. Pass images plus pathPattern for textured pages.
 * @param {{ images?: string[], pageColors?: string[], pathPattern?: string, bgColor?: string, cameraDistance?: { mobile: number, desktop: number }, showUI?: boolean, className?: string, style?: import("react").CSSProperties }} props
 */
export function BookFlip({ images, pageColors = defaultPageColors, pathPattern = "/cdn/effects/book-flip", bgColor = "#000000", cameraDistance = defaultCameraDistance, showUI = true, className, style } = {}) {
  const sourceLength = images && images.length > 0 ? images.length : pageColors.length;
  const pageCount = Math.ceil(sourceLength / 2);
  return <WebGLSurface className={className} style={style} label="ObsidianUI interactive nature book">
    <BookScene images={images} pageColors={pageColors} pageCount={pageCount} pathPattern={pathPattern} bgColor={bgColor} cameraDistance={cameraDistance} showUI={showUI} />
  </WebGLSurface>;
}
