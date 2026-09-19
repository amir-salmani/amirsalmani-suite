'use client';

import { motion, MotionValue, useScroll, useTransform } from 'motion/react';
import React, { useSyncExternalStore } from 'react';

const subscribeToDom = (notify: () => void) => {
    const observer = new MutationObserver(notify);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
};

const BARS = 40;

const ScrollBar = ({
    index,
    scrollProgress
}: {
    index: number;
    scrollProgress: MotionValue<number>;
}) => {
    const thisBarPosition = index / BARS;
    const preStep = Math.max(0, (index - 3) / BARS);
    const postStep = Math.min(1, (index + 3) / BARS);

    const height = useTransform(
        scrollProgress,
        [0, preStep, thisBarPosition, postStep, 1],
        [5, 15, 35, 15, 5]
    );
    const opacity = useTransform(
        scrollProgress,
        [0, preStep, thisBarPosition, postStep, 1],
        [0.1, 0.4, 1, 0.4, 0.1]
    );
    const width = useTransform(scrollProgress, [0, thisBarPosition, 1], [1.5, 5, 1.5]);

    return (
        <motion.div
            className="bg-[var(--fg)] dark:bg-[var(--fg)]"
            style={{
                height: height,
                opacity: useTransform(opacity, (value) => `${value}`),
                width: useTransform(width, (value) => `${value}px`)
            }}
        />
    );
};

const ScrollIndicatorBars = ({
    container,
    direction
}: {
    container: HTMLElement;
    direction: 'vertical' | 'horizontal';
}) => {
    const ref = React.useRef<HTMLElement>(container);

    React.useEffect(() => {
        ref.current = container;
    }, [container]);

    const { scrollXProgress, scrollYProgress } = useScroll({ container: ref });

    const scrollProgress = direction === 'vertical' ? scrollYProgress : scrollXProgress;
    const left = useTransform(scrollProgress, [0, 1], [0, 100]);

    return (
        <div className="flex items-end justify-center gap-1 md:gap-2 relative w-fit">
            {Array.from({ length: BARS }).map((_, index) => (
                <ScrollBar
                    key={`scroll-bar-${index}`}
                    index={index}
                    scrollProgress={scrollProgress}
                />
            ))}
            <motion.div
                className="h-20 bg-[color-mix(in_srgb,var(--fg)_37%,var(--bg))] w-1 absolute bottom-0 left-1/2 -translate-x-1/2"
                style={{ left: useTransform(left, (value) => `${value}%`) }}
            >
                <div className="w-3.5 h-3.5 rounded-full shadow-sm bg-[color-mix(in_srgb,var(--fg)_55%,var(--bg))] absolute top-0 left-1/2 -translate-x-1/2" />
            </motion.div>
        </div>
    );
};

interface GlowingScrollIndicatorProps {
    scrollContainerId?: string;
    direction?: 'vertical' | 'horizontal';
}

export function GlowingScrollIndicator({
    scrollContainerId = 'scroll-target',
    direction = 'vertical'
}: GlowingScrollIndicatorProps) {
    const container = useSyncExternalStore(
        subscribeToDom,
        () => document.getElementById(scrollContainerId),
        () => null
    );

    if (!container) return null;

    return <ScrollIndicatorBars container={container} direction={direction} />;
}

export default GlowingScrollIndicator;

