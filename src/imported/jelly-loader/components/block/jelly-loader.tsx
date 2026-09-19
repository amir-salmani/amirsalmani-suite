'use client';

import React from 'react';
import { motion, Transition } from 'motion/react';

type JellyLoaderProps = {
    numberOfCubes?: number;
    colors?: string[];
};

export function JellyLoader({
    numberOfCubes = 8,
    colors = [
      'color-mix(in srgb, var(--fg) 18%, transparent)',
      'color-mix(in srgb, var(--fg) 30%, transparent)',
      'color-mix(in srgb, var(--fg) 42%, transparent)',
      'color-mix(in srgb, var(--fg) 54%, transparent)',
      'color-mix(in srgb, var(--fg) 66%, transparent)',
      'color-mix(in srgb, var(--fg) 78%, transparent)',
      'color-mix(in srgb, var(--fg) 90%, transparent)',
      'var(--fg)',
    ]
}: JellyLoaderProps) {
    const transition: Transition = {
        duration: 1.5,
        repeat: Infinity,
        repeatDelay: 0.5,
        ease: 'easeOut'
    };

    return (
        <div className="-translate-x-1/5 flex items-center justify-center">
            {Array.from({ length: numberOfCubes }).map((_, index) => {
                const x = index * 10;
                const y = -index * 10;

                return (
                    <motion.span
                        key={index}
                        className="h-[70px] w-[100px] absolute rounded-full"
                        style={{
                            x,
                            y,
                            zIndex: numberOfCubes - index,
                            backgroundColor: colors[index % colors.length],
                            opacity: 1 - index * 0.05
                        }}
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 0.75, 1], rotate: [0, 360] }}
                        transition={{
                            ...transition,
                            delay: index * 0.05
                        }}
                    />
                );
            })}
        </div>
    );
}

export default JellyLoader;
