import { Compass, User, Sparkles } from "lucide-react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();
  const isActive = (href: string) => (href === "/" ? location === "/" : location.startsWith(href));

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-paper/90 backdrop-blur border-b border-cream">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/">
            <span className="font-headline text-xl cursor-pointer text-ink hover:text-ink/80 transition-colors">
              Huddle Hub
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/host">
              <button className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm",
                isActive("/host") ? "bg-red text-white font-semibold" : "bg-red/90 text-white hover:bg-red"
              )}>
                <Sparkles className="w-4 h-4" /> Host
              </button>
            </Link>
            <Link href="/">
              <button className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm",
                isActive("/") ? "bg-ink text-paper font-semibold" : "text-ink-muted hover:text-ink hover:bg-cream/60"
              )}>
                <Compass className="w-4 h-4" /> Discover
              </button>
            </Link>
            <Link href="/profile">
              <button className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm",
                isActive("/profile") ? "bg-ink text-paper font-semibold" : "text-ink-muted hover:text-ink hover:bg-cream/60"
              )}>
                <User className="w-4 h-4" /> Profile
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav with center FAB */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="relative max-w-lg mx-auto pb-4 px-4">
          {/* Floating Discover button */}
          <Link href="/">
            <button
              className={cn(
                "pointer-events-auto absolute left-1/2 -translate-x-1/2 -top-3 w-14 h-14 rounded-full",
                "bg-ink text-paper shadow-lg shadow-ink/20 flex items-center justify-center",
                "hover:scale-105 active:scale-95 transition-transform",
                isActive("/") && "ring-4 ring-ink/10"
              )}
              aria-label="Discover"
            >
              <Compass className="w-5 h-5" strokeWidth={2.25} />
            </button>
          </Link>

          <nav className="pointer-events-auto bg-paper/95 backdrop-blur-xl border border-cream rounded-full shadow-[0_6px_24px_-8px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-around h-14 px-2">
              <div className="flex items-center gap-6">
                <Link href="/host">
                  <button
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                      isActive("/host") ? "text-red" : "text-ink-muted hover:text-ink"
                    )}
                    aria-label="Host"
                  >
                    <Sparkles className="w-5 h-5" strokeWidth={isActive("/host") ? 2.5 : 2} />
                  </button>
                </Link>
                <div className="w-14" /> {/* reserved space under FAB */}
                <Link href="/profile">
                  <button
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                      isActive("/profile") ? "text-ink" : "text-ink-muted hover:text-ink"
                    )}
                    aria-label="Profile"
                  >
                    <User className="w-5 h-5" strokeWidth={isActive("/profile") ? 2.5 : 2} />
                  </button>
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
