import { useState } from "react";

// Deterministic palette based on venue id — same id → same gradient
const GRADIENTS: Array<[string, string]> = [
  ["#1f2937", "#0f766e"], // ink → teal
  ["#7c2d12", "#fb7185"], // brick → rose
  ["#0c4a6e", "#22d3ee"], // deep blue → cyan
  ["#365314", "#84cc16"], // olive → lime
  ["#581c87", "#c084fc"], // plum → lavender
  ["#7c2d12", "#fbbf24"], // brick → gold
  ["#134e4a", "#2dd4bf"], // forest → seafoam
  ["#3f3f46", "#a1a1aa"], // slate → stone
  ["#78350f", "#fbbf24"], // rust → gold
  ["#1e3a8a", "#60a5fa"], // navy → sky
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = name.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface VenueImageProps {
  src?: string | null;
  name: string;
  seed?: string; // usually venue.id
  className?: string;
  rounded?: string; // e.g. "rounded-3xl"
  aspect?: string; // e.g. "aspect-[4/3]" or "aspect-square"
}

export function VenueImage({
  src,
  name,
  seed,
  className = "",
  rounded = "rounded-3xl",
  aspect = "aspect-[4/3]",
}: VenueImageProps) {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && !failed;
  const [from, to] = GRADIENTS[hashString(seed || name) % GRADIENTS.length];

  return (
    <div className={`relative overflow-hidden ${aspect} ${rounded} ${className}`}>
      {showImage ? (
        <img
          src={src!}
          alt={name}
          onError={() => setFailed(true)}
          className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-[filter] duration-500 ease-out"
          loading="lazy"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center grayscale group-hover:grayscale-0 transition-[filter] duration-500 ease-out"
          style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
        >
          <span
            className="font-headline text-white/85"
            style={{ fontSize: "clamp(1.5rem, 6vw, 2.5rem)", letterSpacing: "-0.03em" }}
          >
            {initials(name)}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-neutral-800/45 group-hover:bg-neutral-800/0 transition-colors duration-500 ease-out pointer-events-none" />
    </div>
  );
}
