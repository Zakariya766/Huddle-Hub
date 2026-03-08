/** Generic throwback badge SVG — small shield shape */
export function BadgeMark({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2L4 6v5c0 5.25 3.4 10.15 8 11.4 4.6-1.25 8-6.15 8-11.4V6l-8-4z"
        fill="currentColor"
        opacity="0.1"
      />
      <path
        d="M12 2L4 6v5c0 5.25 3.4 10.15 8 11.4 4.6-1.25 8-6.15 8-11.4V6l-8-4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
      {/* Football laces inside */}
      <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="10" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <line x1="10" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <line x1="10" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
    </svg>
  );
}
