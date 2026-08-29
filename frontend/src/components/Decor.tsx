import { cn } from '@/lib/utils';

/**
 * Decorative floating circles / rings for hero and brand surfaces.
 * Purely visual, non-interactive.
 */
export function DecorCircles({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      {/* Big soft blobs */}
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
      <div className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-accent-500/25 blur-3xl" />
      <div className="absolute right-1/3 top-1/4 h-40 w-40 rounded-full bg-brand-300/20 blur-2xl" />

      {/* Thin concentric rings */}
      <svg
        className="absolute -right-16 top-10 h-80 w-80 text-white/10"
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
      >
        <circle cx="100" cy="100" r="40" strokeWidth="1" />
        <circle cx="100" cy="100" r="65" strokeWidth="1" />
        <circle cx="100" cy="100" r="90" strokeWidth="1" />
      </svg>

      {/* Dotted small circles */}
      <div className="absolute bottom-16 left-10 h-3 w-3 rounded-full bg-accent-400/70" />
      <div className="absolute bottom-24 left-16 h-2 w-2 rounded-full bg-white/40" />
      <div className="absolute left-24 top-24 h-2.5 w-2.5 rounded-full bg-white/30" />
    </div>
  );
}

/** A light ring pattern for white surfaces (e.g. dashboard header banner). */
export function DecorRingsLight({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <svg
        className="absolute -right-10 -top-10 h-56 w-56 text-white/20"
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
      >
        <circle cx="100" cy="100" r="45" strokeWidth="1.2" />
        <circle cx="100" cy="100" r="72" strokeWidth="1.2" />
        <circle cx="100" cy="100" r="99" strokeWidth="1.2" />
      </svg>
      <div className="absolute -bottom-10 left-1/4 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
    </div>
  );
}
