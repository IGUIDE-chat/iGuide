// [COMPONENT] Animated text component that simulates typing effect.
// [组件] 模拟打字机效果的动画文本组件。
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TypewriterTextProps {
    text: string;
    className?: string;
    delay?: number;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({ text, className = "", delay = 0 }) => {
    // Split text into characters (works for Chinese too)
    const characters = text.split("");

    return (
        <span className={className}>
            {characters.map((char, index) => {
                // "Slow to fast" logic implementation
                // We want the delay between characters to decrease as index increases.
                // Standard linear would be: index * 0.1
                // Accelerating (Quadratic ease-in for time? No, we want time between chars to shrink)

                // Let's model the Time(index) function.
                // T(i) = sum(gaps). 
                // Gap(i) should start large (e.g. 0.1s) and shrink to small (e.g. 0.02s).
                // Let's use a simple decay: Gap(i) = MaxGap * (DecayFactor ^ i)

                // Example: 
                // i=0: 0
                // i=1: 0.1
                // i=2: 0.1 + 0.09 = 0.19
                // i=3: 0.19 + 0.081 = 0.271

                let cumulativeDelay = delay;
                const startGap = 0.15; // Slow start
                const minGap = 0.01;   // Very fast end limit
                const decay = 0.90;    // How fast it accelerates

                let currentGap = startGap;
                for (let i = 0; i < index; i++) {
                    cumulativeDelay += currentGap;
                    currentGap = Math.max(minGap, currentGap * decay);
                }

                return (
                    <motion.span
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            duration: 0.1, // Fade in duration for the char itself
                            delay: cumulativeDelay,
                            ease: "easeOut"
                        }}
                    >
                        {char}
                    </motion.span>
                );
            })}
        </span>
    );
};
