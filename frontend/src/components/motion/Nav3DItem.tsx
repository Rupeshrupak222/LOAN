'use client';

import React from 'react';
import Link from 'next/link';

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
  showUnderline = false,
  asButton = false,
}) => {
  const commonClasses = `relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 hover:text-[#155EEF] hover:bg-slate-100/80 transition-all duration-200 select-none ${
    isActive || isOpen ? 'bg-blue-50/90 text-[#155EEF]' : ''
  } ${className}`;

  if (asButton || !href) {
    return (
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={commonClasses}
      >
        {children}
      </button>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={commonClasses}
    >
      {children}
    </Link>
  );
};
