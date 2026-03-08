/** Subtle football field line pattern — use as a background on large sections */
export function FieldPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none select-none ${className}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern id="field-lines" width="80" height="80" patternUnits="userSpaceOnUse">
          {/* yard lines */}
          <line x1="0" y1="40" x2="80" y2="40" stroke="currentColor" strokeWidth="0.5" opacity="0.04" />
          <line x1="40" y1="0" x2="40" y2="80" stroke="currentColor" strokeWidth="0.5" opacity="0.04" />
          {/* hash marks */}
          <line x1="18" y1="38" x2="18" y2="42" stroke="currentColor" strokeWidth="0.5" opacity="0.03" />
          <line x1="62" y1="38" x2="62" y2="42" stroke="currentColor" strokeWidth="0.5" opacity="0.03" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#field-lines)" />
    </svg>
  );
}
