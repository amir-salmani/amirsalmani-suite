'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const getMaskDataUrl = () => {
    const svgString = `<svg width="526" height="526" viewBox="0 0 526 526" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="263" cy="263" r="263" fill="black" />
  </svg>`;
    return `data:image/svg+xml;base64,${btoa(svgString)}`;
};

interface MaskCursorEffectProps {
    children: React.ReactNode;
    hiddenComponent?: React.ReactNode;
    className?: string;
    compressedMaskSize?: number;
    expandedMaskSize?: number;
    backgroundColor?: string;
}

export function MaskCursorEffect({
    children,
    hiddenComponent,
    className,
    compressedMaskSize = 40,
    expandedMaskSize = 350,
    backgroundColor = 'var(--fg-accent)'
}: MaskCursorEffectProps) {
    const [mousePosition, setMousePosition] = useState({ x: 20, y: 20 });
    const [isHovered, setIsHovered] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const MASK_SIZE = isHovered ? expandedMaskSize : compressedMaskSize;

    const reduceMotion = useReducedMotion();
    const spring = reduceMotion ? { stiffness: 10000, damping: 100 } : { stiffness: 500, damping: 50 };
    const maskX = useSpring(useMotionValue(mousePosition.x - MASK_SIZE / 2), spring);
    const maskY = useSpring(useMotionValue(mousePosition.y - MASK_SIZE / 2), spring);
    const maskSizeSpring = useSpring(useMotionValue(MASK_SIZE), spring);

    useEffect(() => {
        maskX.set(mousePosition.x - MASK_SIZE / 2);
        maskY.set(mousePosition.y - MASK_SIZE / 2);
        maskSizeSpring.set(MASK_SIZE);
    }, [mousePosition, MASK_SIZE, maskX, maskY, maskSizeSpring]);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;
        const handleMouseMove = (e: MouseEvent) => {
            const { left, top } = wrapper.getBoundingClientRect();
            setMousePosition({ x: e.clientX - left, y: e.clientY - top });
        };
        wrapper.addEventListener('mousemove', handleMouseMove);
        return () => wrapper.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div ref={wrapperRef} className="h-full w-full relative flex flex-col">
            <motion.div
                style={{
                    maskImage: `url("${getMaskDataUrl()}")`,
                    WebkitMaskImage: `url("${getMaskDataUrl()}")`,
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: `${mousePosition.x - MASK_SIZE / 2}px ${mousePosition.y - MASK_SIZE / 2}px`,
                    maskPosition: `${mousePosition.x - MASK_SIZE / 2}px ${mousePosition.y - MASK_SIZE / 2}px`,
                    WebkitMaskSize: `${MASK_SIZE}px ${MASK_SIZE}px`,
                    maskSize: `${MASK_SIZE}px ${MASK_SIZE}px`,
                    backgroundColor,
                    color: 'black',
                    transition: 'mask-size 0.3s ease, -webkit-mask-size 0.3s ease'
                }}
                className={cn('h-[800px] w-full flex items-center justify-center absolute z-10', className)}
            >
                <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                    {hiddenComponent}
                </div>
            </motion.div>
            <div className={cn('h-[800px] w-full flex items-center justify-center text-[var(--fg)]/70', className)}>
                {children}
            </div>
        </div>
    );
}

export default MaskCursorEffect;

