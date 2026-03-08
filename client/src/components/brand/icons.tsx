/** Brand SVG icons from the asset pack — inline for fast rendering & color control */

interface IconProps {
  size?: number;
  className?: string;
}

export function IconFootball({ size = 24, className = "" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 256 256" className={className} aria-hidden="true">
      <path d="M195 61c-26-26-86-8-132 38S-4 205 22 231s86 8 132-38 68-106 41-132z"
            fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="10"/>
      <path d="M79 177l98-98" stroke="currentColor" strokeOpacity="0.25" strokeWidth="10" strokeLinecap="round"/>
      <path d="M118 116h22 M118 140h22 M118 164h22" stroke="hsl(var(--red))" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  );
}

export function IconPlaybook({ size = 24, className = "" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 256 256" className={className} aria-hidden="true">
      <rect x="44" y="40" width="168" height="176" rx="22" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="10"/>
      <path d="M84 84c14 0 14 22 28 22s14-22 28-22 14 22 28 22 14-22 28-22" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="7" strokeLinecap="round"/>
      <circle cx="90" cy="156" r="10" fill="currentColor"/>
      <circle cx="166" cy="150" r="10" fill="hsl(var(--red))"/>
      <path d="M98 156c22-18 42-20 62-6" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/>
      <path d="M160 144l10 6-10 6" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconLocation({ size = 24, className = "" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 256 256" className={className} aria-hidden="true">
      <path d="M128 232s68-62 68-124a68 68 0 1 0-136 0c0 62 68 124 68 124z"
            fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="10"/>
      <circle cx="128" cy="108" r="18" fill="hsl(var(--red))"/>
    </svg>
  );
}

export function IconTicket({ size = 24, className = "" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 256 256" className={className} aria-hidden="true">
      <path d="M52 88h152c0 18 16 18 16 40s-16 22-16 40H52c0-18-16-18-16-40s16-22 16-40z"
            fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="10" strokeLinejoin="round"/>
      <path d="M120 96v64" stroke="currentColor" strokeOpacity="0.25" strokeWidth="8" strokeDasharray="8 10"/>
      <path d="M146 114h44" stroke="hsl(var(--red))" strokeWidth="10" strokeLinecap="round"/>
    </svg>
  );
}

export function IconWhistle({ size = 24, className = "" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 256 256" className={className} aria-hidden="true">
      <path d="M66 154c0-34 28-62 62-62h34c16 0 30 6 40 16l18 18-22 22-14-14c-4-4-10-6-16-6h-6v26c0 24-20 44-44 44H96c-16 0-30-14-30-30z"
            fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="10" strokeLinejoin="round"/>
      <circle cx="176" cy="138" r="10" fill="hsl(var(--red))"/>
      <path d="M92 80l-18-18" stroke="currentColor" strokeOpacity="0.25" strokeWidth="10" strokeLinecap="round"/>
    </svg>
  );
}
