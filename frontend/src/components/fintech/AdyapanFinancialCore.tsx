'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
  mouseCoords: { x: number; y: number };
  className?: string;
}

export const AdyapanFinancialCore: React.FC<Props> = ({ mouseCoords, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const setDimensions = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || 420;
      const h = rect.height || 420;
      canvas.width = w * (window.devicePixelRatio || 1);
      canvas.height = h * (window.devicePixelRatio || 1);
      return { w: canvas.width, h: canvas.height };
    };

    let { w: width, h: height } = setDimensions();

    const handleResize = () => {
      const dims = setDimensions();
      width = dims.w;
      height = dims.h;
    };

    window.addEventListener('resize', handleResize);

    // 3D Orbiting Financial Badges
    const nodes = [
      { label: '₹ Sanctioned Line', angle: 0, tilt: 0.15, radius: 135, bg: '#155EEF', text: '#FFFFFF' },
      { label: '⚡ 90s Disbursal', angle: Math.PI / 3, tilt: -0.2, radius: 140, bg: '#071A33', text: '#FFFFFF' },
      { label: '0% Interest Split', angle: (2 * Math.PI) / 3, tilt: 0.25, radius: 130, bg: '#155EEF', text: '#FFFFFF' },
      { label: '🛡️ Bank AES-256', angle: Math.PI, tilt: -0.15, radius: 138, bg: '#071A33', text: '#FFFFFF' },
      { label: 'Auto UPI Mandate', angle: (4 * Math.PI) / 3, tilt: 0.2, radius: 132, bg: '#155EEF', text: '#FFFFFF' },
      { label: '100% RBI NBFC', angle: (5 * Math.PI) / 3, tilt: -0.2, radius: 136, bg: '#071A33', text: '#FFFFFF' },
    ];

    // Sphere latitude rings
    const ringCount = 14;
    const ringPoints: { x: number; y: number; z: number }[] = [];
    const sphereRadius = 90;

    for (let i = 0; i < ringCount; i++) {
      const lat = ((i + 0.5) / ringCount) * Math.PI - Math.PI / 2;
      const r = sphereRadius * Math.cos(lat);
      const y = sphereRadius * Math.sin(lat);
      const pointsInRing = 18;

      for (let j = 0; j < pointsInRing; j++) {
        const lon = (j / pointsInRing) * 2 * Math.PI;
        const x = r * Math.cos(lon);
        const z = r * Math.sin(lon);
        ringPoints.push({ x, y, z });
      }
    }

    let baseRotation = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const dpr = window.devicePixelRatio || 1;
      const centerX = width / 2;
      const centerY = height / 2;

      baseRotation += 0.007;

      const rotY = baseRotation + mouseCoords.x * 0.4;
      const rotX = mouseCoords.y * 0.3;

      // Project 3D sphere points
      const projectedSphere: { px: number; py: number; pz: number; alpha: number }[] = [];

      for (let i = 0; i < ringPoints.length; i++) {
        const pt = ringPoints[i];

        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const x1 = pt.x * cosY - pt.z * sinY;
        const z1 = pt.z * cosY + pt.x * sinY;

        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const y2 = pt.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + pt.y * sinX;

        const fov = 350 * dpr;
        const distance = 400 * dpr;
        const scale = fov / (distance + z2);

        const px = centerX + x1 * scale;
        const py = centerY + y2 * scale;
        const alpha = Math.max(0.2, (z2 + sphereRadius) / (2 * sphereRadius));

        projectedSphere.push({ px, py, pz: z2, alpha });
      }

      projectedSphere.sort((a, b) => a.pz - b.pz);

      // Render Central Ambient Glow
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        20 * dpr,
        centerX,
        centerY,
        sphereRadius * 1.5 * dpr
      );
      glowGrad.addColorStop(0, 'rgba(78, 168, 255, 0.35)');
      glowGrad.addColorStop(0.6, 'rgba(21, 94, 239, 0.15)');
      glowGrad.addColorStop(1, 'rgba(234, 244, 255, 0)');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, sphereRadius * 1.5 * dpr, 0, Math.PI * 2);
      ctx.fill();

      // Render Central High-Contrast Sphere
      const sphereGrad = ctx.createRadialGradient(
        centerX - 25 * dpr,
        centerY - 25 * dpr,
        15 * dpr,
        centerX,
        centerY,
        sphereRadius * 1.05 * dpr
      );
      sphereGrad.addColorStop(0, '#FFFFFF');
      sphereGrad.addColorStop(0.3, '#EAF4FF');
      sphereGrad.addColorStop(0.7, '#93C5FD');
      sphereGrad.addColorStop(1, '#155EEF');

      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, sphereRadius * dpr, 0, Math.PI * 2);
      ctx.fill();

      // Outer Sphere Border
      ctx.strokeStyle = '#155EEF';
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      // Draw high-contrast wireframe nodes
      for (let i = 0; i < projectedSphere.length; i++) {
        const pt = projectedSphere[i];
        ctx.fillStyle = `rgba(7, 26, 51, ${pt.alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, 1.6 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Central ₹ Symbol
      ctx.font = `black ${36 * dpr}px Inter, sans-serif`;
      ctx.fillStyle = '#071A33';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('₹', centerX, centerY);

      // Render Orbiting Financial Badges
      nodes.forEach((node) => {
        const currentAngle = node.angle + baseRotation * 0.7;
        const rawX = Math.cos(currentAngle) * node.radius;
        const rawZ = Math.sin(currentAngle) * node.radius;
        const rawY = Math.sin(currentAngle + node.tilt) * 32;

        const cosY = Math.cos(rotY * 0.4);
        const sinY = Math.sin(rotY * 0.4);
        const x1 = rawX * cosY - rawZ * sinY;
        const z1 = rawZ * cosY + rawX * sinY;

        const cosX = Math.cos(rotX * 0.4);
        const sinX = Math.sin(rotX * 0.4);
        const y2 = rawY * cosX - z1 * sinX;
        const z2 = z1 * cosX + rawY * sinX;

        const fov = 350 * dpr;
        const distance = 400 * dpr;
        const scale = fov / (distance + z2);

        const px = centerX + x1 * scale;
        const py = centerY + y2 * scale;
        const alpha = Math.max(0.45, Math.min(1, (z2 + 150) / 300));

        // Connect beam line to core
        ctx.strokeStyle = `rgba(21, 94, 239, ${alpha * 0.4})`;
        ctx.lineWidth = 1.2 * dpr;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(px, py);
        ctx.stroke();

        // Node Card
        const badgeWidth = (node.label.length * 7 + 18) * dpr;
        const badgeHeight = 24 * dpr;
        const radius = 8 * dpr;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Card shadow & background
        ctx.fillStyle = node.bg;
        ctx.shadowColor = 'rgba(7, 26, 51, 0.2)';
        ctx.shadowBlur = 10 * dpr;
        ctx.shadowOffsetY = 3 * dpr;

        ctx.beginPath();
        ctx.roundRect(px - badgeWidth / 2, py - badgeHeight / 2, badgeWidth, badgeHeight, radius);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1 * dpr;
        ctx.stroke();

        // Card Text
        ctx.font = `bold ${10 * dpr}px Inter, sans-serif`;
        ctx.fillStyle = node.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, px, py);

        ctx.restore();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [mouseCoords]);

  return (
    <div className={`relative flex items-center justify-center min-h-[380px] min-w-[380px] ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-[460px] max-h-[460px] pointer-events-none"
      />
    </div>
  );
};
