"use client";
import React, { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionStyle } from 'motion/react'
import { cn } from '@/lib/utils'
import '@/components/block/scroll-effect.css'


type ImageProps = {

        start: string[];
        middle: string[];
        featured: string
}

interface ScrollEffectProps{
    images: ImageProps;
    className?: string
}

 export function ScrollEffect  ({ images , className }: ScrollEffectProps)  {



    const sectionRef = useRef<HTMLDivElement>(null);


    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start start', 'end start']
    })



    const k = useTransform(scrollYProgress, [0, 1], [0, 1])

    const {start , middle , featured}= images




    return (

        <section ref={sectionRef}
            className={cn('ace-scroll-section relative h-[400dvh]' , className)}
        >

            <motion.div className='ace-scroll-root' style={{
                '--ace-scroll-progress': k
            } as MotionStyle}>

                {start.map((src, i) => (

                    <img key={`start-${i}`}
                        src={src}
                        className={cn('ace-scroll-image end')}
                        style={{
                            '--i': i,
                            '--j': 0
                        } as React.CSSProperties}
                        alt={`start-image${i}`}
                    />
                ))
                }

              


                {/* featured image */}
                <img src={featured}
                    className='ace-scroll-image feat'
                    alt='featured-image'
                />

                {/* middle images */}


                {
                    middle.map((src, i) =>

                    (
                        <img key={`mid-${i}`}
                            src={src}
                            className={cn('ace-scroll-image mid' , 
                               
                            )}
                            style={{
                                '--i': i + start.length,
                                '--j': 1
                            } as React.CSSProperties}
                            alt={`middle-image${i}`}

                        />
                    ))
                }
            </motion.div>

        </section>

    );
};



