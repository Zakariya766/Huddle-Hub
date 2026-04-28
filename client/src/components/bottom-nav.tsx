import { Home, Compass, CalendarCheck, User, Sparkles } from "lucide-react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";

const primaryItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/events", icon: CalendarCheck, label: "My Events" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const [location] = useLocation();
  const isActive = (href: string) => (href === "/" ? location === "/" : location.startsWith(href));

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-paper/90 backdrop-blur border-b border-cream">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/">
            <span className={cn(
              "font-headline text-xl cursor-pointer transition-colors",
              isActive("/") ? "text-ink" : "text-ink hover:text-ink/80"
            )}>
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
            <Link href="/search">
              <button className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm",
                isActive("/search") ? "bg-ink text-paper font-semibold" : "text-ink-muted hover:text-ink hover:bg-cream/60"
              )}>
                <Compass className="w-4 h-4" /> Discover
              </button>
            </Link>
            <Link href="/events">
              <button className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm",
                isActive("/events") ? "bg-ink text-paper font-semibold" : "text-ink-muted hover:text-ink hover:bg-cream/60"
              )}>
                <CalendarCheck className="w-4 h-4" /> My Events
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
          {/* Floating search button */}
          <Link href="/search">
            <button
              className={cn(
                "pointer-events-auto absolute left-1/2 -translate-x-1/2 -top-3 w-14 h-14 rounded-full",
                "bg-ink text-paper shadow-lg shadow-ink/20 flex items-center justify-center",
                "hover:scale-105 active:scale-95 transition-transform",
                isActive("/search") && "ring-4 ring-ink/10"
              )}
              aria-label="Discover"
            >
              <Compass className="w-5 h-5" strokeWidth={2.25} />
            </button>
          </Link>

          <nav className="pointer-events-auto bg-paper/95 backdrop-blur-xl border border-cream rounded-full shadow-[0_6px_24px_-8px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-around h-14 px-2">
              {primaryItems.map((item, i) => {
                const active = isActive(item.href);
                // Insert a spacer slot for the center FAB between items
                if (i === 1) {
                  return (
                    <div key="fab-slot" className="flex items-center gap-6">
                      <Link href={primaryItems[0].href}>
                        <button
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                            isActive(primaryItems[0].href) ? "text-ink" : "text-ink-muted hover:text-ink"
                          )}
                          aria-label={primaryItems[0].label}
                        >
                          {(() => {
                            const I = primaryItems[0].icon;
                            return <I className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />;
                          })()}
                        </button>
                      </Link>
                      <div className="w-14" /> {/* reserved space under FAB */}
                      <Link href={item.href}>
                        <button
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                            active ? "text-ink" : "text-ink-muted hover:text-ink"
                          )}
                          aria-label={item.label}
                        >
                          <item.icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                        </button>
                      </Link>
                    </div>
                  );
                }
                if (i === 0) return null; // rendered in i===1 block above
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                        active ? "text-ink" : "text-ink-muted hover:text-ink"
                      )}
                      aria-label={item.label}
                    >
                      <item.icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                    </button>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
