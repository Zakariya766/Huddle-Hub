import { User } from "lucide-react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { IconFootball, IconPlaybook, IconLocation, IconTicket } from "@/components/brand/icons";

const navItems = [
  { href: "/", icon: IconFootball, label: "Feed" },
  { href: "/teams", icon: IconPlaybook, label: "Teams" },
  { href: "/discover", icon: IconLocation, label: "Discover" },
  { href: "/offers", icon: IconTicket, label: "Offers" },
  { href: "/profile", icon: null, label: "Profile" },
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
                {item.icon ? (
                  <item.icon size={22} className={cn(isActive && "drop-shadow-sm")} />
                ) : (
                  <User className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                )}
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
