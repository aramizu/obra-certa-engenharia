export function HelmetMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M8 36c0-14 10-24 24-24s24 10 24 24" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M6 40h52v8H6z" fill="currentColor" />
      <rect x="28" y="16" width="8" height="10" fill="currentColor" />
    </svg>
  );
}

export function TapeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="8" y="22" width="48" height="20" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M16 22v20M24 22v20M32 22v20M40 22v20M48 22v20" stroke="currentColor" strokeWidth="2" />
      <circle cx="14" cy="32" r="3" fill="currentColor" />
    </svg>
  );
}

export function PlanMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M12 8h32l8 8v40H12z" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M44 8v8h8" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M20 28h24M20 36h16M20 44h20" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
