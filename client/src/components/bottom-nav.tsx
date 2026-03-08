import { Home, MapPin, Tag, Users, User } from "lucide-react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Feed" },
  { href: "/teams", icon: Users, label: "Teams" },
  { href: "/discover", icon: MapPin, label: "Discover" },
  { href: "/offers", icon: Tag, label: "Offers" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-bar" data-testid="bottom-nav">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px]",
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
  );
}
