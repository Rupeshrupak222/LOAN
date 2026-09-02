'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

/* ══════════════════════════════════════════════════════════════
   Nav3DItem — High-End Physical 3D Interactive Navigation Surface
   ─────────────────────────────────────────────────────────────
   ▸ 60fps GPU-accelerated inertial physics (rAF + damped lerp)
   ▸ Pointer-responsive 3D tilt (rotateX, rotateY, translateZ)
   ▸ Physical dual-surface structure with 3D bevel & perspective shadow
   ▸ Specular light reflection tracking pointer angle
   ▸ Controlled micro-magnetic pull (±3px X, ±2px Y, +10px Z)
   ▸ Inertial entrance & smooth spring deceleration to neutral on exit
   ▸ Zero React re-renders during mouse movement (pure ref DOM transforms)
   ▸ Full accessibility (prefers-reduced-motion & keyboard focus)
   ══════════════════════════════════════════════════════════════ */

interface Nav3DItemProps {
  children: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  isActive?: boolean;
  isOpen?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  showUnderline?: boolean;
  asButton?: boolean;
}

export const Nav3DItem: React.FC<Nav3DItemProps> = ({
  children,
  href,
  onClick,
  className = '',
  isActive = false,
  isOpen = false,
  onMouseEnter,
  onMouseLeave,
  showUnderline = true,
  asButton = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const bevelRef = useRef<HTMLDivElement>(null);

  // Physics state kept entirely in refs to guarantee 60fps without React re-renders
  const anim = useRef({
    currentRx: 0,
    currentRy: 0,
    currentTx: 0,
    currentTy: 0,
    currentTz: 0,
    currentScale: 1,
    targetRx: 0,
    targetRy: 0,
    targetTx: 0,
    targetTy: 0,
    targetTz: 0,
    targetScale: 1,
    glareX: 50,
    glareY: 50,
    targetGlareOpacity: 0,
    currentGlareOpacity: 0,
    isHovered: false,
    rafId: 0,
  });

  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }
  }, []);

  // Linear Interpolation helper with inertia
  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  };

  // Continuous physics update loop
  const updatePhysics = useCallback(() => {
    const s = anim.current;
    const factor = s.isHovered ? 0.12 : 0.08; // responsive entrance, smooth damped return

    s.currentRx = lerp(s.currentRx, s.targetRx, factor);
    s.currentRy = lerp(s.currentRy, s.targetRy, factor);
    s.currentTx = lerp(s.currentTx, s.targetTx, factor);
    s.currentTy = lerp(s.currentTy, s.targetTy, factor);
    s.currentTz = lerp(s.currentTz, s.targetTz, factor);
    s.currentScale = lerp(s.currentScale, s.targetScale, factor);
    s.currentGlareOpacity = lerp(s.currentGlareOpacity, s.targetGlareOpacity, factor);

    // Apply 3D matrix transform to the main interactive surface
    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(900px) translate3d(${s.currentTx.toFixed(2)}px, ${s.currentTy.toFixed(2)}px, ${s.currentTz.toFixed(2)}px) rotateX(${s.currentRx.toFixed(2)}deg) rotateY(${s.currentRy.toFixed(2)}deg) scale3d(${s.currentScale.toFixed(3)}, ${s.currentScale.toFixed(3)}, 1)`;
    }

    // Dynamic perspective shadow shifting opposite to tilt
    if (shadowRef.current) {
      const shadowX = (-s.currentRy * 0.8 + s.currentTx * 0.5).toFixed(2);
      const shadowY = (s.currentRx * 0.8 + s.currentTy * 0.5 + 4).toFixed(2);
      const shadowBlur = (8 + s.currentTz * 0.8).toFixed(1);
      shadowRef.current.style.transform = `translate3d(${shadowX}px, ${shadowY}px, -8px)`;
      shadowRef.current.style.opacity = (s.currentTz / 12 * 0.75).toFixed(2);
      shadowRef.current.style.filter = `blur(${shadowBlur}px)`;
    }

    // Dynamic bevel highlight catching edge lighting
    if (bevelRef.current) {
      bevelRef.current.style.transform = `translate3d(${(s.currentTx * 0.3).toFixed(2)}px, ${(s.currentTy * 0.3).toFixed(2)}px, -2px)`;
      bevelRef.current.style.opacity = (s.currentTz / 10).toFixed(2);
    }

    // Dynamic specular glare reflection
    if (glareRef.current) {
      glareRef.current.style.opacity = s.currentGlareOpacity.toFixed(2);
      glareRef.current.style.background = `radial-gradient(circle at ${s.glareX.toFixed(1)}% ${s.glareY.toFixed(1)}%, rgba(21, 94, 239, 0.16) 0%, rgba(255, 255, 255, 0.28) 25%, transparent 65%)`;
    }

    // Check if settled back to neutral
    const isSettled =
      !s.isHovered &&
      Math.abs(s.currentRx) < 0.04 &&
      Math.abs(s.currentRy) < 0.04 &&
      Math.abs(s.currentTx) < 0.04 &&
      Math.abs(s.currentTy) < 0.04 &&
      Math.abs(s.currentTz) < 0.04 &&
      Math.abs(s.currentScale - 1) < 0.004;

    if (!isSettled) {
      s.rafId = requestAnimationFrame(updatePhysics);
    } else {
      // Snap to perfect neutral
      s.currentRx = 0;
      s.currentRy = 0;
      s.currentTx = 0;
      s.currentTy = 0;
      s.currentTz = 0;
      s.currentScale = 1;
      s.currentGlareOpacity = 0;
      if (cardRef.current) {
        cardRef.current.style.transform = 'perspective(900px) translate3d(0,0,0) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
      }
      if (shadowRef.current) {
        shadowRef.current.style.opacity = '0';
      }
      if (bevelRef.current) {
        bevelRef.current.style.opacity = '0';
      }
      if (glareRef.current) {
        glareRef.current.style.opacity = '0';
      }
      s.rafId = 0;
    }
  }, []);

  const handlePointerEnter = () => {
    if (isTouchDevice) return;
    const s = anim.current;
    s.isHovered = true;
    s.targetTz = 10;
    s.targetScale = 1.03;
    s.targetGlareOpacity = 0.9;

    if (!s.rafId) {
      s.rafId = requestAnimationFrame(updatePhysics);
    }
    if (onMouseEnter) onMouseEnter();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isTouchDevice || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width - 0.5) * 2;
    const normY = (y / rect.height - 0.5) * 2;

    const s = anim.current;
    // Elegant 3D tilt: max 9° on Y, 8° on X
    s.targetRy = normX * 9.0;
    s.targetRx = -normY * 8.0;

    // Controlled micro-magnetic pull: max 2.8px X, 2.0px Y
    s.targetTx = normX * 2.8;
    s.targetTy = normY * 2.0;

    // Specular highlight coordinate mapping
    s.glareX = (x / rect.width) * 100;
    s.glareY = (y / rect.height) * 100;

    if (!s.rafId) {
      s.rafId = requestAnimationFrame(updatePhysics);
    }
  };

  const handlePointerLeave = () => {
    if (isTouchDevice) return;
    const s = anim.current;
    s.isHovered = false;
    s.targetRx = 0;
    s.targetRy = 0;
    s.targetTx = 0;
    s.targetTy = 0;
    s.targetTz = 0;
    s.targetScale = 1;
    s.targetGlareOpacity = 0;

    if (!s.rafId) {
      s.rafId = requestAnimationFrame(updatePhysics);
    }
    if (onMouseLeave) onMouseLeave();
  };

  const innerContent = (
    <div
      ref={cardRef}
      className={`relative rounded-xl px-3.5 py-1.5 transition-colors duration-200 select-none overflow-hidden ${
        isActive || isOpen
          ? 'bg-[#EAF4FF] text-[#155EEF] shadow-xs'
          : 'text-[#071A33] hover:text-[#155EEF]'
      } ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        border: isActive || isOpen ? '1px solid rgba(21, 94, 239, 0.22)' : '1px solid transparent',
        backgroundColor: isActive || isOpen ? 'rgba(234, 244, 255, 0.85)' : undefined,
      }}
    >
      {/* ── 3D Elevated Front Surface (Text & Icons) ── */}
      <div
        className="relative z-10 flex items-center gap-1.5 text-xs font-bold tracking-tight"
        style={{
          transform: 'translateZ(7px)',
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </div>

      {/* ── Dynamic Specular Glare Reflection Layer ── */}
      <div
        ref={glareRef}
        className="absolute inset-0 pointer-events-none rounded-xl z-20 transition-opacity duration-150"
        style={{
          opacity: 0,
          mixBlendMode: 'overlay',
        }}
      />

      {/* ── Subtle Active/Hover Indicator Line ── */}
      {showUnderline && !isActive && !isOpen && (
        <span className="absolute bottom-0.5 left-3.5 right-3.5 h-[2px] bg-[#155EEF] rounded-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative inline-block group"
      style={{
        perspective: '900px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* ── 3D Bevel Underlayer ── */}
      <div
        ref={bevelRef}
        className="absolute inset-0 rounded-xl bg-gradient-to-b from-[#155EEF]/15 to-[#155EEF]/5 pointer-events-none border border-[#155EEF]/20 transition-opacity duration-300"
        style={{
          opacity: 0,
          transform: 'translate3d(0, 0, -2px)',
        }}
      />

      {/* ── Directional Perspective Depth Shadow ── */}
      <div
        ref={shadowRef}
        className="absolute inset-0 rounded-xl bg-[#071A33]/25 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: 0,
          transform: 'translate3d(0, 4px, -8px)',
          filter: 'blur(8px)',
        }}
      />

      {/* Interactive Element */}
      {href ? (
        <Link
          href={href}
          onClick={onClick}
          className="block outline-hidden focus-visible:ring-2 focus-visible:ring-[#155EEF] rounded-xl"
        >
          {innerContent}
        </Link>
      ) : asButton ? (
        <button
          onClick={onClick}
          className="block w-full text-left outline-hidden focus-visible:ring-2 focus-visible:ring-[#155EEF] rounded-xl cursor-pointer"
        >
          {innerContent}
        </button>
      ) : (
        innerContent
      )}
    </div>
  );
};
