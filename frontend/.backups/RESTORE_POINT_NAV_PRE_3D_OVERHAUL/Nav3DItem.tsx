'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

/* ══════════════════════════════════════════════════════════════
   Nav3DItem — Physical 3D Interactive Navigation Surface
   ─────────────────────────────────────────────────────────────
   ▸ 60fps GPU-accelerated pointer tracking (rAF + damped lerp)
   ▸ Pointer-responsive 3D tilt (rotateX, rotateY, translateZ)
   ▸ Physical dual-surface with 3D bevel & depth shadow
   ▸ Specular light glare tracking pointer coordinates
   ▸ Inertial entrance & smooth spring deceleration on exit
   ▸ Zero React re-renders during pointer tracking
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
  const depthLayerRef = useRef<HTMLDivElement>(null);

  // Animation physics state (kept in refs to avoid React re-renders)
  const animState = useRef({
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

  // Linear Interpolation helper
  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  };

  // Continuous 60fps physics loop with damping
  const updatePhysics = useCallback(() => {
    const s = animState.current;

    // Damping factors (lower = heavier mass, higher = faster response)
    const factor = s.isHovered ? 0.14 : 0.08;

    s.currentRx = lerp(s.currentRx, s.targetRx, factor);
    s.currentRy = lerp(s.currentRy, s.targetRy, factor);
    s.currentTx = lerp(s.currentTx, s.targetTx, factor);
    s.currentTy = lerp(s.currentTy, s.targetTy, factor);
    s.currentTz = lerp(s.currentTz, s.targetTz, factor);
    s.currentScale = lerp(s.currentScale, s.targetScale, factor);
    s.currentGlareOpacity = lerp(s.currentGlareOpacity, s.targetGlareOpacity, factor);

    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(800px) translate3d(${s.currentTx.toFixed(2)}px, ${s.currentTy.toFixed(2)}px, ${s.currentTz.toFixed(2)}px) rotateX(${s.currentRx.toFixed(2)}deg) rotateY(${s.currentRy.toFixed(2)}deg) scale3d(${s.currentScale.toFixed(3)}, ${s.currentScale.toFixed(3)}, 1)`;
    }

    if (depthLayerRef.current) {
      depthLayerRef.current.style.transform = `translate3d(${(s.currentTx * 0.4).toFixed(2)}px, ${(s.currentTy * 0.4 + 2).toFixed(2)}px, -4px)`;
      depthLayerRef.current.style.opacity = (s.currentTz / 10).toFixed(2);
    }

    if (glareRef.current) {
      glareRef.current.style.opacity = s.currentGlareOpacity.toFixed(2);
      glareRef.current.style.background = `radial-gradient(circle at ${s.glareX.toFixed(1)}% ${s.glareY.toFixed(1)}%, rgba(21, 94, 239, 0.16) 0%, rgba(255, 255, 255, 0.25) 30%, transparent 70%)`;
    }

    // Stop rAF loop when settled near neutral
    const isSettled =
      !s.isHovered &&
      Math.abs(s.currentRx) < 0.05 &&
      Math.abs(s.currentRy) < 0.05 &&
      Math.abs(s.currentTx) < 0.05 &&
      Math.abs(s.currentTy) < 0.05 &&
      Math.abs(s.currentTz) < 0.05 &&
      Math.abs(s.currentScale - 1) < 0.005;

    if (!isSettled) {
      s.rafId = requestAnimationFrame(updatePhysics);
    } else {
      // Snap to exact neutral
      s.currentRx = 0;
      s.currentRy = 0;
      s.currentTx = 0;
      s.currentTy = 0;
      s.currentTz = 0;
      s.currentScale = 1;
      s.currentGlareOpacity = 0;
      if (cardRef.current) {
        cardRef.current.style.transform = 'perspective(800px) translate3d(0,0,0) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
      }
      if (depthLayerRef.current) {
        depthLayerRef.current.style.opacity = '0';
      }
      if (glareRef.current) {
        glareRef.current.style.opacity = '0';
      }
      s.rafId = 0;
    }
  }, []);

  const handlePointerEnter = () => {
    if (isTouchDevice) return;
    const s = animState.current;
    s.isHovered = true;
    s.targetTz = 8;
    s.targetScale = 1.03;
    s.targetGlareOpacity = 0.85;

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

    // Normalized coordinates (-1 to 1)
    const normX = (x / rect.width - 0.5) * 2;
    const normY = (y / rect.height - 0.5) * 2;

    const s = animState.current;
    // Max 3D tilt: 10 degrees on Y, 9 degrees on X
    s.targetRy = normX * 10;
    s.targetRx = -normY * 9;

    // Micro-magnetic displacement: max 2.5px
    s.targetTx = normX * 2.5;
    s.targetTy = normY * 2.0;

    // Glare coordinates
    s.glareX = (x / rect.width) * 100;
    s.glareY = (y / rect.height) * 100;

    if (!s.rafId) {
      s.rafId = requestAnimationFrame(updatePhysics);
    }
  };

  const handlePointerLeave = () => {
    if (isTouchDevice) return;
    const s = animState.current;
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

  // Content wrapper element
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
        border: isActive || isOpen ? '1px solid rgba(21, 94, 239, 0.18)' : '1px solid transparent',
      }}
    >
      {/* ── 3D Front Surface (Text & Icons with translateZ elevation) ── */}
      <div
        className="relative z-10 flex items-center gap-1.5 text-xs font-bold"
        style={{
          transform: 'translateZ(6px)',
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </div>

      {/* ── Dynamic Specular Glare (Catches ambient light on pointer move) ── */}
      <div
        ref={glareRef}
        className="absolute inset-0 pointer-events-none rounded-xl z-20 transition-opacity duration-150"
        style={{
          opacity: 0,
          mixBlendMode: 'overlay',
        }}
      />

      {/* ── Animated Underline Indicator ── */}
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
        perspective: '800px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* ── 3D Bevel Underlayer / Soft Depth Shadow ── */}
      <div
        ref={depthLayerRef}
        className="absolute inset-0 rounded-xl bg-[#155EEF]/10 pointer-events-none blur-[2px] transition-opacity duration-300"
        style={{
          opacity: 0,
          transform: 'translate3d(0, 2px, -4px)',
        }}
      />

      {/* Link or Button or Raw Container */}
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
