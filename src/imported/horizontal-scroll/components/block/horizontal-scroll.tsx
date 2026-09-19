'use client';

import React, { useRef } from 'react';
import { motion, MotionValue, useScroll, useTransform, useReducedMotion } from 'motion/react';

const HorizontalScrollItem = ({
    image,
    index,
    isLeft,
    scrollYProgress,
    totalItems
}: {
    image: string;
    index: number;
    isLeft: boolean;
    scrollYProgress: MotionValue<number>;
    totalItems: number;
}) => {
    const direction = isLeft ? -1 : 1;
    const position = index / totalItems;

    const reduceMotion = useReducedMotion();
    const translateX = useTransform(
        scrollYProgress,
        [0, position, 1],
        [-index * 500 * direction, 0, (totalItems - index) * 500 * direction]
    );
    const rotateY = useTransform(
        scrollYProgress,
        [0, position, 1],
        [index * 35 * direction, 0, (totalItems - index) * -35 * direction]
    );
    const blur = useTransform(scrollYProgress, [0, position, 1], [index * 2, 0, (totalItems - index) * 2]);
    const contrast = useTransform(scrollYProgress, [0, position, 1], [index * 0.5, 1, (totalItems - index) * 0.5]);

    const translateY = useTransform(
        scrollYProgress,
        [0, position, 1],
        [(totalItems - index) * 20, totalItems * 20, index * 20]
    );

    const filter = useTransform([blur, contrast], ([blur, contrast]) => `blur(${blur}px) contrast(${contrast})`);

    return (
        <motion.div
            style={{
                translateX,
                filter: reduceMotion ? 'none' : filter,
                translateY: useTransform(translateY, (value) => `${reduceMotion ? -400 : value - 400}px`),
                perspective: reduceMotion ? 'none' : 1000,
                transformStyle: 'preserve-3d'
            }}
            className="h-[300px] max-w-sm w-full absolute rounded-xl overflow-visible"
        >
            <motion.div style={{ rotateY: reduceMotion ? 0 : rotateY }}>
                <img src={image} alt={image} width={1000} height={1000} className="object-cover h-[300px] w-full rounded-xl" />
            </motion.div>
        </motion.div>
    );
};

interface HorizontalScrollProps {
    items: { image: string }[];
}

export function HorizontalScroll({ items }: HorizontalScrollProps) {
    const ref = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        container: ref,
        offset: ['start start', 'end end']
    });

    return (
        <div ref={ref} className="h-full w-full overflow-y-auto relative" style={{ minHeight: '400px' }}>
            <div className="h-full w-full absolute top-0 left-0">
                <div className="w-full" style={{ height: (items.length - 3) * 300 }} />
            </div>
            <div className="grid grid-cols-1 gap-12 h-full w-full sticky top-0 left-0">
                <div className="flex flex-col h-full justify-center w-full items-center relative">
                    {items.map((image, index) => (
                        <HorizontalScrollItem
                            key={`horizontal-scroll-item-${index}`}
                            image={image.image}
                            index={index}
                            isLeft={true}
                            scrollYProgress={scrollYProgress}
                            totalItems={items.length}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default HorizontalScroll;
