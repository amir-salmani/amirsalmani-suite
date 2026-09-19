'use client'
import { useTexture } from"@react-three/drei";
import { useFrame } from"@react-three/fiber";
import { useEffectReducedMotion } from "@/lib/effects/shared/webgl-surface";
import { easing } from"maath";
import { usePage } from"./PageContext";
import { useEffect, useMemo, useRef, useState } from"react";
import {
 Bone,
 BoxGeometry,
 Color,
 Float32BufferAttribute,
 MeshStandardMaterial,
 Skeleton,
 SkinnedMesh,
 SRGBColorSpace,
 Uint16BufferAttribute,
 Vector3,
} from"three";
import { degToRad } from"three/src/math/MathUtils.js";

/**
 * CONFIG CONSTANTS - Adjust these to customize the book appearance and animation
 */
const EASING_FACTOR = 0.5; // Controls the speed of page rotation easing (lower = slower)
const EASING_FACTOR_FOLD = 0.3; // Controls the speed of page fold animation
const INSIDE_CURVE_STRENGTH = 0.18; // How much the inside of the page curves when opened
const OUTSIDE_CURVE_STRENGTH = 0.05; // How much the outside edges curve
const TURNING_CURVE_STRENGTH = 0.09; // Curve strength during page turning animation

const PAGE_WIDTH = 1.28; // Width of a single page
const PAGE_HEIGHT = 1.71; // Height of a single page (4:3 aspect ratio)
const PAGE_DEPTH = 0.003; // Thickness of paper
const PAGE_SEGMENTS = 30; // Number of bone segments (more = more flexible, but slower)
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

/**
 * GEOMETRY SETUP
 * Creates a segmented geometry that can be deformed by skeleton bones
 * Each segment is controlled by 2 bones for smooth deformation
 */
const pageGeometry = new BoxGeometry(
 PAGE_WIDTH,
 PAGE_HEIGHT,
 PAGE_DEPTH,
 PAGE_SEGMENTS,
 2
);

// Translate geometry so rotation happens from the left edge
pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);

// Setup skin weights and indices for skeletal animation
const position = pageGeometry.attributes.position;
const vertex = new Vector3();
const skinIndexes = [];
const skinWeights = [];

for (let i = 0; i < position.count; i++) {
 vertex.fromBufferAttribute(position, i);
 const x = vertex.x;

 // Each vertex is influenced by 2 adjacent bones
 const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH));
 const skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH;

 // Store bone influences (up to 4 per vertex, we use 2)
 skinIndexes.push(skinIndex, skinIndex + 1, 0, 0);
 skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
}

pageGeometry.setAttribute(
"skinIndex",
 new Uint16BufferAttribute(skinIndexes, 4)
);
pageGeometry.setAttribute(
"skinWeight",
 new Float32BufferAttribute(skinWeights, 4)
);

// Base materials for pages
const whiteColor = new Color("white");
const emissiveColor = new Color("orange");

const pageMaterials = [
 new MeshStandardMaterial({ color: whiteColor }),
 new MeshStandardMaterial({ color:"#111" }),
 new MeshStandardMaterial({ color: whiteColor }),
 new MeshStandardMaterial({ color: whiteColor }),
];

/**
 * Helper function to generate page pairs from image array
 * Creates front/back pairs: [0,1], [2,3], [4,5], etc.
 */
const BLANK_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const colorTextureCache = new Map();
function shadeHex(hex, amount) {
 const n = String(hex).replace("#", "");
 const full = n.length === 3 ? n.split("").map((c) => c + c).join("") : n;
 const num = parseInt(full, 16);
 const cl = (v) => Math.max(0, Math.min(255, v + amount));
 const r = cl((num >> 16) & 255);
 const g = cl((num >> 8) & 255);
 const b = cl(num & 255);
 return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}
function colorToDataURL(hex) {
 const hit = colorTextureCache.get(hex);
 if (hit) return hit;
 if (typeof document === "undefined") return BLANK_PIXEL;
 const canvas = document.createElement("canvas");
 canvas.width = 4;
 canvas.height = 256;
 const ctx = canvas.getContext("2d");
 if (!ctx) return BLANK_PIXEL;
 const grad = ctx.createLinearGradient(0, 0, 0, 256);
 grad.addColorStop(0, hex);
 grad.addColorStop(1, shadeHex(hex, -28));
 ctx.fillStyle = grad;
 ctx.fillRect(0, 0, 4, 256);
 const url = canvas.toDataURL("image/png");
 colorTextureCache.set(hex, url);
 return url;
}
const generatePages = (imageArray, colorArray) => {
 const names = imageArray && imageArray.length > 0 ? imageArray : null;
 const colors = colorArray && colorArray.length > 0 ? colorArray : null;
 const total = Math.max(names ? names.length : 0, colors ? colors.length : 0);
 if (total === 0) {
 return [];
 }
 const pages = [];
 for (let i = 0; i < total; i += 2) {
 pages.push({
 front: names ? names[i % names.length] : undefined,
 back: names ? names[(i + 1) % names.length] : undefined,
 frontColor: colors ? colors[i % colors.length] : undefined,
 backColor: colors ? colors[(i + 1) % colors.length] : undefined,
 });
 }
 return pages;
};

/**
 * Preload textures for better performance
 */
const preloadTextures = (pages, pathPattern) => {
 pages.forEach((page) => {
 if (page.front && !page.frontColor) {
 useTexture.preload(`${pathPattern}/${page.front}.png?v=3`);
 }
 if (page.back && !page.backColor) {
 useTexture.preload(`${pathPattern}/${page.back}.png?v=3`);
 }
 });
};

/**
 * PAGE COMPONENT
 * Represents a single page in the book with skinned mesh deformation
 *  * ANIMATION LOGIC:
 * - Uses skeleton with 31 bones along the page width
 * - Each bone rotates based on whether the page is opened
 * - Inner bones curve more (3D effect), outer bones curve less
 * - During turning, bones follow a sine wave for smooth animation
 */
const Page = ({  number,  front,  back,  frontColor,  backColor,  page,  opened,  bookClosed,
 pathPattern,
 ...props }) => {
 const frontSrc = frontColor ? colorToDataURL(frontColor) : `${pathPattern}/${front}.png?v=3`;
 const backSrc = backColor ? colorToDataURL(backColor) : `${pathPattern}/${back}.png?v=3`;

 const pictures = useTexture([frontSrc, backSrc]);
 const [picture, picture2] = useMemo(() => pictures.map((original) => {
   const texture = original.clone();
   texture.colorSpace = SRGBColorSpace;
   return texture;
 }), [pictures]);
 const reducedMotion = useEffectReducedMotion();

 const group = useRef();
 const turnedAt = useRef(0);
 const lastOpened = useRef(opened);
 const skinnedMeshRef = useRef();

 /**
 * Create the skeletal mesh for this page
 * - Creates 31 bones in a chain
 * - Attaches them hierarchically so rotation cascades
 * - Wraps geometry in skeleton for deformation
 */
 const manualSkinnedMesh = useMemo(() => {
 const bones = [];
  // Create bone chain
 for (let i = 0; i <= PAGE_SEGMENTS; i++) {
 const bone = new Bone();
 bones.push(bone);
  if (i === 0) {
 bone.position.x = 0; // Root bone at spine
 } else {
 bone.position.x = SEGMENT_WIDTH; // Each subsequent bone positioned relative to parent
 }
  if (i > 0) {
 bones[i - 1].add(bone); // Attach to parent bone
 }
 }

 const skeleton = new Skeleton(bones);

 // Materials: 4 base materials + 2 textured materials (front and back)
 const materials = [
 ...pageMaterials.map((material) => material.clone()),
 new MeshStandardMaterial({
 color: whiteColor,
 map: picture,
 roughness: 0.1,
 emissive: emissiveColor,
 emissiveIntensity: 0,
 }),
 new MeshStandardMaterial({
 color: whiteColor,
 map: picture2,
 roughness: 0.1,
 emissive: emissiveColor,
 emissiveIntensity: 0,
 }),
 ];

 const mesh = new SkinnedMesh(pageGeometry.clone(), materials);
 mesh.frustumCulled = false;
 mesh.add(skeleton.bones[0]);
 mesh.bind(skeleton); // Bind skeleton to mesh
  return mesh;
 }, [picture, picture2]);
 useEffect(() => () => {
   manualSkinnedMesh.geometry.dispose();
   manualSkinnedMesh.material.forEach((material) => material.dispose());
   manualSkinnedMesh.skeleton.dispose();
   picture.dispose();
   picture2.dispose();
 }, [manualSkinnedMesh, picture, picture2]);

 /**
 * ANIMATION LOOP
 * Updates bone rotations each frame to create page flip effect
 */
 useFrame((_, delta) => {
 if (!skinnedMeshRef.current) return;

 // Highlight page on hover by increasing emissive intensity
 // const emissiveIntensity = highlighted ? 0.22 : 0;
 // skinnedMeshRef.current.material[4].emissiveIntensity =
 // skinnedMeshRef.current.material[5].emissiveIntensity = MathUtils.lerp(
 // skinnedMeshRef.current.material[4].emissiveIntensity,
 // emissiveIntensity,
 // 0.1
 // );

 // Track when page opened state changed for animation timing
 if (lastOpened.current !== opened) {
 turnedAt.current = +new Date();
 lastOpened.current = opened;
 }

 // Calculate animation progress (0 to 1, then sin for smooth curve)
 let turningTime = Math.min(400, new Date() - turnedAt.current) / 400;
 turningTime = reducedMotion ? 0 : Math.sin(turningTime * Math.PI);

 // Target rotation: opened = -90°, closed = +90°
 let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
  // Add slight extra rotation based on page number (pages fan out slightly)
 if (!bookClosed) {
 targetRotation += degToRad(number * 0.8);
 }

 /**
 * BONE ANIMATION CALCULATION
 * Each bone along the page rotates differently:
 * - Inside bones (0-8): Follow sin curve for inside curl effect
 * - Outside bones (8+): Follow cos curve for outside edge effect
 * - All bones smoothly interpolate to target rotation using dampAngle
 */
 const bones = skinnedMeshRef.current.skeleton.bones;
 for (let i = 0; i < bones.length; i++) {
 const target = i === 0 ? group.current : bones[i];

 // Inner curve: creates 3D curl effect on the inside
 const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0;
  // Outer curve: pages don't rotate as much at the edges
 const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0;
  // Turning animation: smooth wave during the page turn
 const turningIntensity =
 Math.sin(i * Math.PI * (1 / bones.length)) * turningTime;

 // Combine all rotation influences
 let rotationAngle =
 INSIDE_CURVE_STRENGTH * insideCurveIntensity * targetRotation -
 OUTSIDE_CURVE_STRENGTH * outsideCurveIntensity * targetRotation +
 TURNING_CURVE_STRENGTH * turningIntensity * targetRotation;

 // Fold rotation: subtle X-axis rotation for paper fold effect
 let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2);

 // When book is closed, only root bone rotates
 if (bookClosed) {
 if (i === 0) {
 rotationAngle = targetRotation;
 foldRotationAngle = 0;
 } else {
 rotationAngle = 0;
 foldRotationAngle = 0;
 }
 }

 // Reduced motion applies the same final pose without the page-turn travel.
 if (reducedMotion) {
   target.rotation.y = rotationAngle;
   target.rotation.x = 0;
   continue;
 }
 easing.dampAngle(
 target.rotation,
"y",
 rotationAngle,
 EASING_FACTOR,
 delta
 );

 // Add fold effect to middle/end bones during turning
 const foldIntensity =
 i > 8
 ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime
 : 0;
 easing.dampAngle(
 target.rotation,
"x",
 foldRotationAngle * foldIntensity,
 EASING_FACTOR_FOLD,
 delta
 );
 }
 });

 const { setPage } = usePage();
// const [highlighted, setHighlighted] = useState(false);
// useCursor(highlighted);

 return (
 <group
 {...props}
 ref={group}
 // onPointerEnter={(e) => {
 // e.stopPropagation();
 // setHighlighted(true);
 // }}
 // onPointerLeave={(e) => {
 // e.stopPropagation();
 // setHighlighted(false);
 // }}
 onClick={(e) => {
 e.stopPropagation();
 setPage(opened ? number : number + 1);
 // setHighlighted(false);
 }}
 >
 <primitive
 object={manualSkinnedMesh}
 ref={skinnedMeshRef}
 // Stack pages with slight depth offset
 position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
 />
 </group>
 );
};

/**
 * BOOK COMPONENT
 * Main book component that orchestrates page animation
 *  * ANIMATION FLOW:
 * 1. User clicks to change page number in PageContext
 * 2. delayedPage state animates one page at a time toward target
 * 3. Each page renders and receives updated page/opened props
 * 4. Pages animate their bones based on opened state
 */
export const Book = ({  images = [],
 pageColors = [],
 pathPattern ="/assets/nature",
 ...props }) => {
 const { page } = usePage();
 const reducedMotion = useEffectReducedMotion();
 const [delayedPage, setDelayedPage] = useState(page);

 // Generate pages from image array
 const pages = useMemo(() => generatePages(images, pageColors), [images, pageColors]);

 // Preload textures
 useEffect(() => {
 if (pages.length > 0) {
 preloadTextures(pages, pathPattern);
 }
 }, [pages, pathPattern]);

 /**
 * PAGE ANIMATION SEQUENCING
 * Animates delayedPage toward target page one page at a time
 * This creates the sequential page-by-page animation
 */
 useEffect(() => {
 let timeout;
 const goToPage = () => {
 setDelayedPage((delayedPage) => {
 if (page === delayedPage) {
 return delayedPage;
 } else {
 // Faster animation for large jumps, slower for single pages
 timeout = setTimeout(
 () => {
 goToPage();
 },
 Math.abs(page - delayedPage) > 2 ? 50 : 150
 );
  if (page > delayedPage) {
 return delayedPage + 1;
 }
 if (page < delayedPage) {
 return delayedPage - 1;
 }
 }
 });
 };
 if (!reducedMotion) timeout = setTimeout(goToPage, 0);
 return () => {
 clearTimeout(timeout);
 };
 }, [page, reducedMotion]);

 return (
 <group {...props} rotation-y={-Math.PI / 2} rotation-x={-0.7} >
 {pages.map((pageData, index) => (
 <Page
 key={index}
 page={reducedMotion ? page : delayedPage}
 number={index}
 opened={(reducedMotion ? page : delayedPage) > index}
 bookClosed={(reducedMotion ? page : delayedPage) === 0 || (reducedMotion ? page : delayedPage) === pages.length}
 pathPattern={pathPattern}
 {...pageData}
 />
 ))}
 </group>
 );
};
