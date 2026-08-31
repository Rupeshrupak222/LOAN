'use client';

import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

export const ContinuousEnergySpine: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="pointer-events-none fixed inset-y-0 left-1/2 -translate-x-1/2 z-20 hidden lg:block w-px h-full">
      {/* Background Track Line */}
      <div className="w-[1.5px] h-full mx-auto bg-slate-200/60" />

      {/* Travelling Luminous Blue Progress Line */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[2.5px] origin-top bg-gradient-to-b from-[#155EEF] via-[#4EA8FF] to-[#8DEBFF]"
        style={{
          scaleY,
          height: '100%',
          boxShadow: '0 0 10px rgba(21, 94, 239, 0.5), 0 0 20px rgba(78, 168, 255, 0.3)',
        }}
      />
    </div>
  );
};
