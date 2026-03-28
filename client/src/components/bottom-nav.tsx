import { Compass, Calendar, Globe, Ticket, User } from "lucide-react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Compass, label: "Discover" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-ink border-b border-ink/20 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/">
            <span className="font-display text-lg font-bold text-paper tracking-tight cursor-pointer">HUDDLE HUB</span>
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <button
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm",
                      isActive
                        ? "bg-paper/15 text-paper font-semibold"
                        : "text-paper/60 hover:text-paper hover:bg-paper/10"
                    )}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <item.icon className={cn("w-4 h-4", isActive && "stroke-[2.5px]")} />
                    <span>{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-bar" data-testid="bottom-nav">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[48px] relative",
                    isActive
                      ? "text-red"
                      : "text-ink-muted hover:text-ink"
                  )}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                  <span className={cn(
                    "text-[10px]",
                    isActive ? "font-semibold" : "font-medium"
                  )}>{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
