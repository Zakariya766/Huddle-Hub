import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="bg-ink text-paper px-4 pt-10 pb-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display text-2xl font-bold">My Events</h1>
          <p className="text-sm text-paper/70 mt-1">Events you've RSVP'd to</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24 pt-6">
        {authLoading || (user && isLoading) ? (
          <p className="text-sm text-ink-muted text-center py-10">Loading…</p>
        ) : !user ? (
          <EmptyState
            title="Sign in to see your events"
            message="RSVP to watch parties and they'll show up here."
          />
        ) : upcoming.length === 0 && past.length === 0 ? (
          <EmptyState
            title="No events yet"
            message="Browse watch parties and RSVP to one."
          />
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <h2 className="font-display text-sm font-bold text-ink-muted uppercase tracking-wider mb-3">Upcoming</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                  {upcoming.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      rsvpd={!pendingUnrsvp.has(event.id)}
                      onRsvp={handleRsvp}
                    />
                  ))}
                </div>
              </>
            )}

            {past.length > 0 && (
              <>
                <h2 className="font-display text-sm font-bold text-ink-muted uppercase tracking-wider mb-3">Past</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-60">
                  {past.slice(0, 10).map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <Card className="border-cream">
      <CardContent className="p-10 text-center">
        <CalendarPlus className="w-8 h-8 text-ink-muted mx-auto mb-3" />
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        <p className="text-sm text-ink-muted mt-1 mb-4">{message}</p>
        <Link href="/search?eventType=watch-party">
          <Button size="sm" className="rounded-full">Find events</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
