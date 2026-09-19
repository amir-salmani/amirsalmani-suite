"use client";

import React, { useEffect, useRef, useState } from"react";
import { cn } from "@/lib/utils";
import { tokenColour } from "@lib/token-colour";
import { useEffectReducedMotion } from "@/lib/effects/shared/webgl-surface";

const lerp = (start, end, amount) => start + (end - start) * amount;

/** @param {{ text?: string, imageSrc?: string, showControls?: boolean, className?: string, style?: import("react").CSSProperties }} props */
export function GridLift({ text = "OBSIDIANUI", imageSrc = "/cdn/effects/grid-lift/obsidianui-wordmark.svg?v=3", showControls = false, className, style } = {}) {
 const reducedMotion = useEffectReducedMotion();
 const canvasRef = useRef(null);
 const fileInputRef = useRef(null);
 const uploadRef = useRef(null);
 useEffect(() => () => {
   const upload = uploadRef.current;
   if (!upload) return;
   if (upload.reader.readyState === 1) upload.reader.abort();
   if (upload.image) { upload.image.onload = null; upload.image.onerror = null; }
   if (upload.url) URL.revokeObjectURL(upload.url);
 }, []);

 const mouseRef = useRef({ x: -9999, y: -9999, active: false });
 const cellsRef = useRef([]);
 const svgImageRef = useRef(null);

 const [svgName, setSvgName] = useState("obsidianui-wordmark.svg");
 const [svgVersion, setSvgVersion] = useState(0);
 const [maskSourceState, setMaskSourceState] = useState("SVG");
 const [maskText, setMaskText] = useState(text);

 const handleSetMask = setMaskSourceState;
 const maskSource = maskSourceState;
 const fontSize = 350, fontWeight = 200, maskScale = 1.08;
 const gridSpacing = 13, strokeSize = 1.15, hoverRadius = 550, hoverFalloff = 1.55;
 const interactionRange = 120, liftHeight = 58, liftRotation = -88, liftSmoothness = 0.08;
 const baseOpacity = 1, hoverOpacity = 0.6;
 const backgroundColor = tokenColour("--bg", "#000"), gridColor = tokenColour("--rule", "#272727"), hoverColor = tokenColour("--fg", "#fff");
 const safeText =
 typeof maskText ==="string" && maskText.trim().length > 0 ? maskText :"OBSIDIANUI";

 const handleSVGUpload = (event) => {
 const file = event.target.files?.[0];
 if (!file) return;
 if (file.type !=="image/svg+xml" && !file.name.endsWith(".svg")) {
 alert("Please upload an SVG file.");
 return;
 }
 const reader = new FileReader();
 const previous = uploadRef.current;
 if (previous?.reader.readyState === 1) previous.reader.abort();
 if (previous?.url) URL.revokeObjectURL(previous.url);
 uploadRef.current = { reader, image: null, url: null };
 reader.onload = () => {
 let svgText = typeof reader.result ==="string" ? reader.result :"";
 // Some SVGs have no intrinsic size, which results in `naturalWidth/Height` being 0
 // and the canvas draw being invisible. Ensure a width/height based on viewBox.
 if (svgText) {
 const hasWidth = /\bwidth\s*=/.test(svgText);
 const hasHeight = /\bheight\s*=/.test(svgText);
 if (!hasWidth || !hasHeight) {
 const viewBoxMatch = svgText.match(/\bviewBox\s*=\s*["']([^"']+)["']/i);
 let vw = 512;
 let vh = 512;
 if (viewBoxMatch) {
 const parts = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number);
 if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
 vw = Math.max(1, parts[2]);
 vh = Math.max(1, parts[3]);
 }
 }
 svgText = svgText.replace(
 /<svg\b([^>]*)>/i,
 (_match, attrs) =>
 `<svg${attrs}${hasWidth ?"" : ` width="${vw}"`}${hasHeight ?"" : ` height="${vh}"`}>`,
 );
 }
 }

 const blob = new Blob([svgText || reader.result], { type:"image/svg+xml" });
 const url = URL.createObjectURL(blob);
 const image = new Image();
 uploadRef.current = { reader, image, url };
 image.onload = () => {
 svgImageRef.current = image;
 setSvgName(file.name);
 setSvgVersion((v) => v + 1);
 URL.revokeObjectURL(url);
 };
 image.onerror = () => URL.revokeObjectURL(url);
 image.src = url;
 };
 reader.readAsText(file);
 // allow re-uploading the same file (fires `change` again)
 event.target.value ="";
 };

 // Default SVG mask (ObsidianUI wordmark)
 useEffect(() => {
 const image = new Image();
 image.onload = () => {
 svgImageRef.current = image;
 setSvgVersion((v) => v + 1);
 };
 image.src = imageSrc;
 return () => { image.onload = null; image.onerror = null; };
 }, [imageSrc]);

 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;
 const ctx = canvas.getContext("2d", { alpha: false });
 const maskCanvas = document.createElement("canvas");
 const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
 if (!ctx || !maskCtx) return;
 const surface = canvas.parentElement;

 let width = 0, height = 0, dpr = 1, animationFrame;

 const createTextMask = () => {
 maskCtx.clearRect(0, 0, width, height);
 maskCtx.save();
 maskCtx.fillStyle ="#ffffff";
 maskCtx.textAlign ="center";
 maskCtx.textBaseline ="middle";

 const lines = safeText.split("\n").filter(Boolean);
 const safeLines = lines.length > 0 ? lines : ["OBSIDIANUI"];
 const maxTextWidth = width * 0.72 * maskScale;
 const maxTextHeight = height * 0.48 * maskScale;
 let fittedFontSize = fontSize || 230;

 for (let size = fittedFontSize; size > 10; size -= 2) {
 maskCtx.font = `${fontWeight || 900} ${size}px Anton, Impact, Haettenschweiler,"Arial Black", sans-serif`;
 const widestLine = Math.max(...safeLines.map((l) => maskCtx.measureText(l).width));
 const totalHeight = safeLines.length * size * 0.9;
 if (widestLine <= maxTextWidth && totalHeight <= maxTextHeight) { fittedFontSize = size; break; }
 }

 maskCtx.font = `${fontWeight || 900} ${fittedFontSize}px Anton, Impact, Haettenschweiler,"Arial Black", sans-serif`;
 const lineHeight = fittedFontSize * 0.9;
 const startY = height / 2 - ((safeLines.length - 1) * lineHeight) / 2;
 safeLines.forEach((line, i) => maskCtx.fillText(line, width / 2, startY + i * lineHeight));
 maskCtx.restore();
 };

 const createSVGMask = () => {
 maskCtx.clearRect(0, 0, width, height);
 const image = svgImageRef.current;
 if (!image) return;
 const iw = image.naturalWidth || image.width || 1;
 const ih = image.naturalHeight || image.height || 1;
 const imageRatio = iw / ih;
 const screenRatio = width / height;
 let drawWidth, drawHeight;
 if (imageRatio > screenRatio) { drawWidth = width * 0.62 * maskScale; drawHeight = drawWidth / imageRatio; }
 else { drawHeight = height * 0.5 * maskScale; drawWidth = drawHeight * imageRatio; }
 maskCtx.save();
 maskCtx.drawImage(image, width / 2 - drawWidth / 2, height / 2 - drawHeight / 2, drawWidth, drawHeight);
 maskCtx.restore();
 };

 const createMask = () => {
 maskCtx.clearRect(0, 0, width, height);
 if (maskSource === "Text") createTextMask();
 else createSVGMask();
 };

 const isInsideMask = (x, y) => {
 if (x < 0 || y < 0 || x >= width || y >= height) return false;
 const pixel = maskCtx.getImageData(Math.floor(x * dpr), Math.floor(y * dpr), 1, 1).data;
 return pixel[3] > 20 || pixel[0] > 20 || pixel[1] > 20 || pixel[2] > 20;
 };

 const buildCells = () => {
 const cells = [];
 for (let x = 0; x <= width; x += gridSpacing) {
 for (let y = 0; y <= height; y += gridSpacing) {
 const cx = x + gridSpacing / 2;
 const cy = y + gridSpacing / 2;
 if (!isInsideMask(cx, cy)) continue;
 cells.push({
 x, y, cx, cy, lift: 0, targetLift: 0,
 topInside: isInsideMask(cx, y),
 leftInside: isInsideMask(x, cy),
 rightInside: isInsideMask(x + gridSpacing, cy),
 bottomInside: isInsideMask(cx, y + gridSpacing),
 });
 }
 }
 cellsRef.current = cells;
 };

 const resize = () => {
 dpr = Math.min(window.devicePixelRatio || 1, 2);
 width = Math.max(1, surface.clientWidth);
 height = Math.max(1, surface.clientHeight);
 canvas.width = width * dpr; canvas.height = height * dpr;

 maskCanvas.width = width * dpr; maskCanvas.height = height * dpr;
 ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
 maskCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
 createMask(); buildCells();
 };

 const getNearestMaskDistance = (mouseX, mouseY) => {
 let nearest = Infinity;
 for (const cell of cellsRef.current) {
 const dx = cell.cx - mouseX, dy = cell.cy - mouseY;
 const d = Math.sqrt(dx * dx + dy * dy);
 if (d < nearest) nearest = d;
 }
 return nearest;
 };

 const getHoverInfluence = (x, y) => {
 const mouse = mouseRef.current;
 if (!mouse.active) return 0;
 if (getNearestMaskDistance(mouse.x, mouse.y) > interactionRange) return 0;
 const dx = x - mouse.x, dy = y - mouse.y;
 const distance = Math.sqrt(dx * dx + dy * dy);
 if (distance > hoverRadius) return 0;
 return Math.pow(1 - distance / hoverRadius, hoverFalloff);
 };

 const updateCells = () => {
 for (const cell of cellsRef.current) {
 cell.targetLift = getHoverInfluence(cell.cx, cell.cy);
 cell.lift = reducedMotion ? cell.targetLift : lerp(cell.lift, cell.targetLift, liftSmoothness);
 if (cell.lift < 0.001) cell.lift = 0;
 }
 };

 const drawBaseGrid = () => {
 ctx.save();
 ctx.strokeStyle = gridColor; ctx.globalAlpha = baseOpacity; ctx.lineWidth = strokeSize;
 ctx.beginPath();
 for (let x = 0; x <= width; x += gridSpacing) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
 for (let y = 0; y <= height; y += gridSpacing) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
 ctx.stroke(); ctx.restore();
 };

 const drawCellEdges = (cell, ox, oy, alpha, lw, color) => {
 const x1 = cell.x + ox, y1 = cell.y + oy;
 const x2 = cell.x + gridSpacing + ox, y2 = cell.y + gridSpacing + oy;
 ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = lw;
 ctx.beginPath();
 if (cell.topInside) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y1); }
 if (cell.leftInside) { ctx.moveTo(x1, y1); ctx.lineTo(x1, y2); }
 if (cell.rightInside) { ctx.moveTo(x2, y1); ctx.lineTo(x2, y2); }
 if (cell.bottomInside) { ctx.moveTo(x1, y2); ctx.lineTo(x2, y2); }
 ctx.stroke();
 };

 const drawRaisedMaskGrid = () => {
 const angle = (liftRotation * Math.PI) / 180;
 const liftX = Math.cos(angle) * liftHeight;
 const liftY = Math.sin(angle) * liftHeight;
 ctx.save(); ctx.lineCap ="square"; ctx.lineJoin ="miter";

 for (const cell of cellsRef.current) {
 const influence = cell.lift;
 if (influence <= 0.001) continue;
 const ox = liftX * influence, oy = liftY * influence;
 const x1 = cell.x, y1 = cell.y, x2 = cell.x + gridSpacing, y2 = cell.y + gridSpacing;
 const alpha = hoverOpacity * influence;

 for (let i = 0; i < 30; i++) {
 const t = i / 30;
 drawCellEdges(cell, ox * t, oy * t, alpha * (0.025 + t * 0.075), strokeSize * 0.8, hoverColor);
 }

 ctx.globalAlpha = alpha * 0.34; ctx.strokeStyle = hoverColor;
 ctx.lineWidth = Math.max(0.6, strokeSize * 0.7); ctx.beginPath();
 if (cell.topInside) { ctx.moveTo(x1,y1); ctx.lineTo(x1+ox,y1+oy); ctx.moveTo(x2,y1); ctx.lineTo(x2+ox,y1+oy); }
 if (cell.leftInside) { ctx.moveTo(x1,y1); ctx.lineTo(x1+ox,y1+oy); ctx.moveTo(x1,y2); ctx.lineTo(x1+ox,y2+oy); }
 if (cell.rightInside) { ctx.moveTo(x2,y1); ctx.lineTo(x2+ox,y1+oy); ctx.moveTo(x2,y2); ctx.lineTo(x2+ox,y2+oy); }
 if (cell.bottomInside) { ctx.moveTo(x1,y2); ctx.lineTo(x1+ox,y2+oy); ctx.moveTo(x2,y2); ctx.lineTo(x2+ox,y2+oy); }
 ctx.stroke();
 drawCellEdges(cell, ox, oy, alpha, strokeSize + influence * 0.8, hoverColor);
 }
 ctx.restore();
 };

 const render = () => {
 updateCells();
 ctx.fillStyle = backgroundColor; ctx.fillRect(0, 0, width, height);
 drawBaseGrid(); drawRaisedMaskGrid();
 if (!reducedMotion) animationFrame = requestAnimationFrame(render);
 };

 const onPointerMove = (e) => {
 const rect = canvas.getBoundingClientRect();
 mouseRef.current.x = e.clientX - rect.left;
 mouseRef.current.y = e.clientY - rect.top;
 mouseRef.current.active = true;
 if (reducedMotion) render();
 };
 const onPointerLeave = () => { mouseRef.current.active = false; if (reducedMotion) render(); };

 resize(); render();
 const observer = new ResizeObserver(() => { resize(); if (reducedMotion) render(); });
 observer.observe(surface);
 canvas.addEventListener("pointermove", onPointerMove);
 canvas.addEventListener("pointerleave", onPointerLeave);

 return () => {
 cancelAnimationFrame(animationFrame);
 observer.disconnect();
 canvas.removeEventListener("pointermove", onPointerMove);
 canvas.removeEventListener("pointerleave", onPointerLeave);
 };
 }, [
 maskSource, safeText, fontSize, fontWeight, maskScale,
 gridSpacing, strokeSize, hoverRadius, hoverFalloff, interactionRange,
 liftHeight, liftRotation, liftSmoothness, baseOpacity, hoverOpacity,
 backgroundColor, gridColor, hoverColor, svgVersion, reducedMotion,
 ]);

 return (
 <>
 <div className={cn("relative h-[28rem] w-full overflow-hidden bg-[var(--bg)]", className)} style={style} data-mask-source={maskSourceState}>
 {showControls && <div className="absolute left-4 top-4 z-50 pointer-events-auto max-sm:bottom-3 max-sm:left-3 max-sm:right-3 max-sm:top-auto">
 <div className="flex flex-col items-stretch gap-2 rounded-[12px] border border-[var(--rule)] bg-[var(--bg-alt)] p-[10px] max-sm:w-full max-sm:rounded-[16px]">
 <div className="flex items-center justify-between gap-[10px]">
 <div className="text-[12px] font-black tracking-[0.18em] text-[var(--fg)]">OBSIDIANUI</div>
 <div className="inline-flex gap-[6px] rounded-[10px] border border-[var(--rule)] bg-[var(--bg-alt)] p-1">
 <button
 type="button"
 className={`h-[26px] cursor-pointer rounded-[8px] border px-[10px] text-[12px] font-semibold ${
 maskSourceState ==="Text"
 ? "border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)]"
 : "border-transparent bg-transparent text-[var(--fg-muted)] hover:bg-[var(--glass)] hover:text-[var(--fg)]"
 }`}
 onClick={() => handleSetMask("Text")}
 >
 Text
 </button>
 <button
 type="button"
 className={`h-6.5 cursor-pointer rounded-md border px-2.5 text-[12px] font-semibold ${
 maskSourceState ==="SVG"
 ? "border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)]"
 : "border-transparent bg-transparent text-[var(--fg-muted)] hover:bg-[var(--glass)] hover:text-[var(--fg)]"
 }`}
 onClick={() => handleSetMask("SVG")}
 >
 SVG
 </button>
 </div>
 </div>

 <div className="flex items-center gap-2.5 max-sm:w-full">
 {maskSourceState ==="Text" && (
 <input
 className="h-7.5 w-full rounded-md border border-[var(--rule)] bg-[var(--bg-alt)] px-2.5 text-[12px] font-bold tracking-[0.04em] text-[var(--fg)] outline-none focus:border-[var(--fg)] max-sm:min-w-0 max-sm:flex-1"
 value={maskText}
 onChange={(e) => setMaskText(e.target.value)}
 aria-label="Grid mask text"
 placeholder="Text…"
 />
 )}
 {maskSourceState ==="SVG" && (
 <button
 type="button"
 className="h-7.5 cursor-pointer rounded-md border border-[var(--rule)] bg-[var(--bg-alt)] px-2.5 text-[12px] font-bold text-[var(--fg)] hover:border-[var(--fg)] hover:bg-[var(--glass)]"
 onClick={() => fileInputRef.current?.click()}
 title={svgName}
 >
 Upload
 </button>
 )}
 </div>
 <div className="mt-0.5 hidden text-[3.5vw] font-semibold tracking-[0.02em] text-[var(--fg)]/70 pointer-events-none max-sm:block">
 Best on desktop: hover and drift through the grid - mobile shows a preview.
 </div>
 </div>
 </div>}
 <canvas
 ref={canvasRef}
 aria-label="Interactive raised ObsidianUI grid"
 role="img"
 className="absolute inset-0 block h-full w-full cursor-crosshair"
 style={{ background: backgroundColor }}
 />
 <input
 ref={fileInputRef}
 type="file"
 accept=".svg,image/svg+xml"
 onChange={handleSVGUpload}
 style={{ display:"none" }}
 />
 </div>
 </>
 );
}
