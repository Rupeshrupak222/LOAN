import { cn } from '@/lib/utils';

/**
 * Adyapan brand mark.
 * A modern "A" built from a chevron + an ascending bar (growth / finance),
 * rendered with the brand indigo-to-teal gradient.
 */
export function LogoMark({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      role="img"
      aria-label="Adyapan"
    >
      <defs>
        <linearGradient id="adyapanGrad" x1="4" y1="6" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="0.55" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      {/* Rounded tile */}
      <rect x="1" y="1" width="46" height="46" rx="13" fill="url(#adyapanGrad)" />
      {/* The "A" chevron */}
      <path
        d="M16 33 L23.2 15.5 C23.5 14.8 24.5 14.8 24.8 15.5 L32 33"
        stroke="white"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Crossbar as an ascending growth line */}
      <path
        d="M19.5 27 L28.5 27"
        stroke="white"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      {/* Accent dot (upward growth) */}
      <circle cx="34.5" cy="16" r="2.6" fill="#a7f3d0" />
    </svg>
  );
}

/** Logo mark + wordmark. `variant` controls text color for light/dark surfaces. */
export function Logo({
  size = 40,
  variant = 'dark',
  showText = true,
  className,
}: {
  size?: number;
  variant?: 'light' | 'dark';
  showText?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {showText && (
        <div className="leading-tight">
          <p
            className={cn(
              'font-semibold tracking-tight',
              variant === 'light' ? 'text-white' : 'text-slate-900',
            )}
            style={{ fontSize: size * 0.42 }}
          >
            Adyapan
          </p>
          <p
            className={cn(
              'font-medium uppercase tracking-[0.18em]',
              variant === 'light' ? 'text-white/60' : 'text-slate-400',
            )}
            style={{ fontSize: size * 0.2 }}
          >
            IT Solution
          </p>
        </div>
      )}
    </div>
  );
}
