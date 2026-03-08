import { BadgeMark } from "./BadgeMark";

interface LogoWordmarkProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LogoWordmark({ size = "md", className = "" }: LogoWordmarkProps) {
  const sizes = {
    sm: { badge: 18, text: "text-sm", gap: "gap-1.5" },
    md: { badge: 22, text: "text-lg", gap: "gap-2" },
    lg: { badge: 32, text: "text-2xl", gap: "gap-2.5" },
  };
  const s = sizes[size];

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <BadgeMark size={s.badge} className="text-red" />
      <span className={`font-display ${s.text} text-ink tracking-wider`}>
        Huddle Hub
      </span>
    </div>
  );
}
