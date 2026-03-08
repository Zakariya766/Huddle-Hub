/** Loading state using the football loop video with a CSS fallback */
export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = { sm: 48, md: 80, lg: 120 };
  const px = dims[size];

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className="rounded-full overflow-hidden"
        style={{ width: px, height: px }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          src="/loops/loop_loading_football_512.mp4"
        >
          {/* CSS fallback if video fails */}
        </video>
      </div>
      <span className="text-xs text-muted-foreground font-medium tracking-wide animate-pulse">
        Loading...
      </span>
    </div>
  );
}
