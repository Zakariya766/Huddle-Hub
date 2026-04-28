import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CalendarPlus, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EventCard, type EventWithRelations } from "@/components/event-card";

export default function EventsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: myEvents, isLoading, refetch } = useQuery<EventWithRelations[]>({
    queryKey: ["/api/me/events"],
    queryFn: async () => {
      const res = await fetch("/api/me/events", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  const [pendingUnrsvp, setPendingUnrsvp] = useState<Set<string>>(new Set());

  const handleRsvp = async (eventId: string) => {
    try {
      const res = await apiRequest("POST", `/api/events/${eventId}/rsvp`);
      const data = await res.json();
      if (!data.rsvpd) {
        setPendingUnrsvp(prev => {
          const n = new Set(prev);
          n.add(eventId);
          return n;
        });
      }
      refetch();
      toast({ title: data.rsvpd ? "RSVP'd!" : "RSVP removed" });
    } catch {
      toast({ title: "Failed to update RSVP", variant: "destructive" });
    }
  };

  const { upcoming, past } = useMemo(() => {
    const list = myEvents ?? [];
    const now = Date.now();
    return {
      upcoming: list.filter(e => new Date(e.date).getTime() > now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      past: list.filter(e => new Date(e.date).getTime() <= now).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }, [myEvents]);

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-6xl mx-auto px-5 md:px-8 pt-8 md:pt-14 pb-24">
        {/* Headline */}
        <div className="mb-8">
          <div className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-3">
            Your Lineup
          </div>
          <h1 className="font-headline text-[clamp(2.25rem,7vw,4rem)] text-ink leading-[0.95]">
            My Events
          </h1>
          {user && (upcoming.length > 0 || past.length > 0) && (
            <p className="text-sm text-ink-muted mt-3">
              {upcoming.length > 0
                ? `${upcoming.length} coming up${past.length > 0 ? ` · ${past.length} attended` : ""}`
                : `${past.length} attended`}
            </p>
          )}
        </div>

        {authLoading || (user && isLoading) ? (
          <p className="text-sm text-ink-muted py-10">Loading…</p>
        ) : !user ? (
          <EmptyState
            title="Sign in to see your events"
            message="RSVP to watch parties and they'll show up here."
            cta={{ label: "Sign in", href: "/profile" }}
          />
        ) : upcoming.length === 0 && past.length === 0 ? (
          <EmptyState
            title="No events yet"
            message="Browse watch parties and RSVP to one."
            cta={{ label: "Discover events", href: "/search?eventType=watch-party" }}
          />
        ) : (
          <div className="space-y-12">
            {upcoming.length > 0 && (
              <section>
                <h2 className="font-headline text-2xl text-ink mb-4">Upcoming</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {upcoming.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      rsvpd={!pendingUnrsvp.has(event.id)}
                      onRsvp={handleRsvp}
                      variant="full"
                    />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="font-headline text-2xl text-ink mb-4">Past</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 opacity-70">
                  {past.slice(0, 9).map(event => (
                    <EventCard key={event.id} event={event} variant="full" />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  title,
  message,
  cta,
}: {
  title: string;
  message: string;
  cta: { label: string; href: string };
}) {
  const Icon = cta.href.startsWith("/search") ? Compass : CalendarPlus;
  return (
    <div className="rounded-3xl border border-cream bg-paper p-12 text-center">
      <div className="w-12 h-12 rounded-full bg-cream/80 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-5 h-5 text-ink-muted" />
      </div>
      <h2 className="font-headline text-2xl text-ink">{title}</h2>
      <p className="text-sm text-ink-muted mt-2 mb-5 max-w-sm mx-auto">{message}</p>
      <Link href={cta.href}>
        <Button className="rounded-full h-10 px-5">{cta.label}</Button>
      </Link>
    </div>
  );
}
