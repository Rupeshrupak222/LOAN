'use client';

import React, { useRef, useState, useEffect } from 'react';

interface TiltCard3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glowColor?: string;
  isActive?: boolean;
}

export const TiltCard3D: React.FC<TiltCard3DProps> = ({
  children,
  className = '',
  maxTilt = 6,
  glowColor = 'rgba(21, 94, 239, 0.12)',
  isActive = false,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({
    rotateX: 0,
    rotateY: 0,
    spotlightX: 50,
    spotlightY: 50,
  });
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    const normalizedX = (x / width - 0.5) * 2;
    const normalizedY = (y / height - 0.5) * 2;

    setTransform({
      rotateX: -normalizedY * maxTilt,
      rotateY: normalizedX * maxTilt,
      spotlightX: (x / width) * 100,
      spotlightY: (y / height) * 100,
    });
  };

  const handleMouseEnter = () => {
    if (!isTouchDevice) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform({
      rotateX: 0,
      rotateY: 0,
      spotlightX: 50,
      spotlightY: 50,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1000,
      }}
      className={`relative ${className}`}
      {...props}
    >
      <div
        style={{
          transform: isHovered
            ? `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale3d(1.02, 1.02, 1.02) translateZ(8px)`
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateZ(0px)',
          transition: isHovered
            ? 'transform 0.1s ease-out'
            : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
          willChange: 'transform',
        }}
        className="w-full h-full relative rounded-2xl overflow-hidden"
      >
        {/* Dynamic Specular Spotlight Reflection */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-20 rounded-2xl"
          style={{
            opacity: isHovered || isActive ? 1 : 0,
            background: `radial-gradient(circle at ${transform.spotlightX}% ${transform.spotlightY}%, ${glowColor} 0%, transparent 60%)`,
          }}
        />

        {children}
      </div>
    </div>
  );
};
