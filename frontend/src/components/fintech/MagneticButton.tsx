'use client';

import React, { useRef, useState, useEffect } from 'react';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  strength?: number;
  className?: string;
  variant?: 'primary' | 'secondary' | 'glass';
  href?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  strength = 14,
  className = '',
  variant = 'primary',
  href,
  onClick,
  ...props
}) => {
  const buttonRef = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (isTouchDevice || !buttonRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const deltaX = (clientX - centerX) / (width / 2);
    const deltaY = (clientY - centerY) / (height / 2);

    setPosition({
      x: deltaX * strength,
      y: deltaY * strength,
    });
  };

  const handleMouseEnter = () => {
    if (!isTouchDevice) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const baseStyles =
    'relative inline-flex items-center justify-center font-bold text-sm rounded-xl select-none overflow-hidden cursor-pointer group shadow-sm will-change-transform';

  let variantStyles = '';
  if (variant === 'primary') {
    variantStyles =
      'bg-[#155EEF] hover:bg-[#104ec8] text-white shadow-md shadow-[#155EEF]/20 hover:shadow-lg hover:shadow-[#155EEF]/30 border border-[#155EEF]';
  } else if (variant === 'secondary') {
    variantStyles =
      'bg-white hover:bg-[#EAF4FF] text-[#071A33] border border-slate-300 hover:border-[#155EEF] shadow-xs';
  } else if (variant === 'glass') {
    variantStyles =
      'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 shadow-xs';
  }

  const content = (
    <>
      {/* Subtle light sweep */}
      <span
        className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none"
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </>
  );

  const style = {
    transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${
      isPressed ? 0.96 : isHovered ? 1.02 : 1
    })`,
    transition: isHovered
      ? isPressed
        ? 'transform 0.08s ease-out'
        : 'transform 0.12s ease-out'
      : 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
  };

  if (href) {
    return (
      <a
        ref={buttonRef}
        href={href}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={style}
        className={`${baseStyles} ${variantStyles} ${className}`}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={onClick}
      style={style}
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {content}
    </button>
  );
};
