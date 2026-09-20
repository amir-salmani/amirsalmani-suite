'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface PixelatedCarouselProps {
    pixelSize?: number;
    animationDelayStep?: number;
    images: string[];
    pixelTransitionDuration?: number;
}

export function PixelatedCarousel({
    pixelSize = 100,
    animationDelayStep = 0.02,
    images,
    pixelTransitionDuration = 0.1
}: PixelatedCarouselProps) {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const reduceMotion = useReducedMotion();
    const ref = useRef<HTMLDivElement>(null);
    const [grid, setGrid] = useState({ rows: 0, cols: 0, height: 0, width: 0 });
    const isInitialized = grid.rows > 0 && grid.cols > 0;
    const [isFirstCycle, setIsFirstCycle] = useState(true);

    const sizeOfBox = useMemo(() => {
        if (grid.rows === 0 || grid.cols === 0) return { h: 0, w: 0 };
        return { h: grid.height / grid.rows, w: grid.width / grid.cols };
    }, [grid]);

    const shuffledDelays = useMemo(() => {
        const totalBoxes = grid.rows * grid.cols;
        if (totalBoxes === 0) return [];

        const delays = Array.from({ length: totalBoxes }, (_, i) => i * pixelTransitionDuration);
        for (let i = delays.length - 1; i > 0; i--) {
            const j = (i * 31 + 17) % (i + 1);
            [delays[i], delays[j]] = [delays[j], delays[i]];
        }
        return delays;
    }, [grid.rows, grid.cols, pixelTransitionDuration]);

    const boxState = useMemo(() => {
        if (shuffledDelays.length === 0) return [];
        return shuffledDelays.map((delay, index) => {
            const baseShade = 20 - (index * 13 % 20);
            return { delay, color: `rgb(${baseShade}, ${baseShade}, ${baseShade})` };
        });
    }, [shuffledDelays]);

    useEffect(() => {
        const container = ref.current;
        if (!container) return;
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            const size = Math.max(1, pixelSize);
            const next = { rows: Math.max(1, Math.floor(height / size)), cols: Math.max(1, Math.floor(width / size)), width, height };
            setGrid((previous) => previous.width === width && previous.height === height && previous.rows === next.rows && previous.cols === next.cols ? previous : next);
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, [pixelSize]);

    useEffect(() => {
        if (!isInitialized || grid.rows === 0 || grid.cols === 0 || reduceMotion || images.length < 2) return;

        const allBoxesBlackTime = animationDelayStep * (grid.rows * grid.cols - 1) + pixelTransitionDuration;

        if (isFirstCycle) {
            const firstTimeout = setTimeout(() => {
                setActiveImageIndex((prev) => (prev + 1) % images.length);
                setIsFirstCycle(false);
            }, allBoxesBlackTime * 1000);
            return () => clearTimeout(firstTimeout);
        } else {
            const id = setInterval(() => {
                setActiveImageIndex((prev) => (prev + 1) % images.length);
            }, allBoxesBlackTime * 1000 * 2);
            return () => clearInterval(id);
        }
    }, [images.length, grid.rows, grid.cols, isInitialized, isFirstCycle, animationDelayStep, pixelTransitionDuration, reduceMotion]);

    const gridElements = useMemo(() => {
        if (!isInitialized || grid.rows === 0 || grid.cols === 0 || reduceMotion) return null;

        return Array.from({ length: grid.rows }).map((_, row) => (
            <span key={row} className="flex">
                {Array.from({ length: grid.cols }).map((_, col) => {
                    const boxIndex = row * grid.cols + col;
                    const box = boxState[boxIndex];
                    if (!box) return null;

                    return (
                        <motion.span
                            key={col}
                            style={{ height: sizeOfBox.h, width: sizeOfBox.w, backgroundColor: box.color }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{
                                duration: pixelTransitionDuration,
                                repeat: Infinity,
                                repeatType: 'reverse',
                                delay: box.delay,
                                repeatDelay: grid.rows * grid.cols * animationDelayStep
                            }}
                        />
                    );
                })}
            </span>
        ));
    }, [isInitialized, grid.rows, grid.cols, boxState, sizeOfBox, pixelTransitionDuration, animationDelayStep, reduceMotion]);

    return (
        <div ref={ref} className="h-full w-full relative">
            {isInitialized && <span className="h-full w-full absolute top-0 left-0 z-10">{gridElements}</span>}
            <div className="h-full w-full z-0 relative">
                {images.map((image, index) => (
                    <img
                        src={image}
                        key={image + index}
                        alt="pixelated carousel"
                        className="object-cover absolute top-0 left-0 h-full w-full"
                        style={{ zIndex: activeImageIndex % images.length === index ? 10 : 0 }}
                    />
                ))}
            </div>
        </div>
    );
}

export default PixelatedCarousel;
