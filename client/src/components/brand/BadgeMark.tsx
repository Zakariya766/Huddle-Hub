/** Brand badge mark — uses the original asset pack SVG */
export function BadgeMark({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/brand/badge_mark.svg"
      width={size}
      height={size}
      className={className}
      alt=""
      aria-hidden="true"
    />
  );
}
