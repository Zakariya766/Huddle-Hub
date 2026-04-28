import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, MapPin, Calendar, Plus, Trash2, ExternalLink, Building2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Venue, Event } from "@shared/schema";

interface BusinessMe {
  venue: Venue;
  events: Event[];
}

export default function BusinessPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<BusinessMe | null>({
    queryKey: ["/api/business/me"],
    queryFn: async () => {
      const res = await fetch("/api/business/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      await apiRequest("DELETE", `/api/events/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/business/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event deleted" });
    } catch (e: any) {
      toast({ title: "Delete failed", description: String(e?.message ?? e), variant: "destructive" });
    }
  };

  if (authLoading || isLoading) return <div className="p-8 text-center text-ink-muted">Loading…</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-paper">
        <BackBar />
        <div className="max-w-md mx-auto px-5 pt-16 text-center">
          <h1 className="font-headline text-4xl text-ink mb-3">Business dashboard</h1>
          <p className="text-ink-muted mb-6">Sign in to manage your business.</p>
          <Link href="/profile"><Button className="rounded-full px-6">Sign in</Button></Link>
        </div>
      </div>
    );
  }

  if (!data?.venue) {
    return (
      <div className="min-h-screen bg-paper">
        <BackBar />
        <div className="max-w-md mx-auto px-5 pt-16 text-center">
          <Building2 className="w-12 h-12 text-ink-muted mx-auto mb-4" />
          <h1 className="font-headline text-3xl text-ink mb-3">No business yet</h1>
          <p className="text-ink-muted mb-6">Set up your business to host events from a venue.</p>
          <Link href="/host"><Button className="rounded-full px-6">Set up business</Button></Link>
        </div>
      </div>
    );
  }

  const { venue, events } = data;
  const now = Date.now();
  const upcoming = events.filter(e => new Date(e.date).getTime() > now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = events.filter(e => new Date(e.date).getTime() <= now).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-paper pb-24">
      <BackBar />

      <div className="max-w-5xl mx-auto px-5 md:px-8 pt-4 md:pt-8">
        {/* Venue header */}
        <Card className="border-cream overflow-hidden">
          <div className="relative h-44 md:h-56 bg-black">
            {venue.imageUrl && (
              <img
                src={venue.imageUrl}
                alt={venue.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 text-white">
              <div className="text-xs uppercase tracking-widest text-white/70 mb-1">Your business</div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline text-2xl md:text-3xl drop-shadow">{venue.name}</h1>
                {venue.verified && <ShieldCheck className="w-5 h-5 text-turf" />}
              </div>
              <div className="flex items-center gap-1 text-xs text-white/85 mt-1">
                <MapPin className="w-3.5 h-3.5" /> {venue.address}
              </div>
            </div>
          </div>
          <CardContent className="p-4 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[11px] capitalize">{venue.category}</Badge>
              {venue.neighborhood && <span className="text-xs text-ink-muted">{venue.neighborhood}</span>}
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/venues/${venue.id}`}>
                <Button variant="outline" size="sm" className="rounded-full text-xs">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View public page
                </Button>
              </Link>
              <Link href="/host">
                <Button size="sm" className="rounded-full text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> New event
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming events */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline text-2xl text-ink">Upcoming events</h2>
            <span className="text-xs text-ink-muted">{upcoming.length} scheduled</span>
          </div>
          {upcoming.length === 0 ? (
            <Card className="border-cream"><CardContent className="p-6 text-center text-sm text-ink-muted">
              No upcoming events. <Link href="/host" className="underline">Post one →</Link>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {upcoming.map(ev => <EventRow key={ev.id} event={ev} onDelete={() => deleteEvent(ev.id)} />)}
            </div>
          )}
        </section>

        {/* Past events */}
        {past.length > 0 && (
          <section className="mt-8">
            <h2 className="font-headline text-2xl text-ink mb-3">Past events</h2>
            <div className="space-y-2">
              {past.map(ev => <EventRow key={ev.id} event={ev} onDelete={() => deleteEvent(ev.id)} muted />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function EventRow({ event, onDelete, muted }: { event: Event; onDelete: () => void; muted?: boolean }) {
  return (
    <Card className={`border-cream ${muted ? "opacity-70" : ""}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-ink truncate">{event.title}</h3>
            <Badge variant="outline" className="text-[10px] capitalize shrink-0">{event.eventType}</Badge>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-ink-muted">
            <Calendar className="w-3 h-3" />
            {format(new Date(event.date), "EEE, MMM d · h:mm a")}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-ink-muted hover:text-red" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function BackBar() {
  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 pt-6">
      <button
        onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = "/"))}
        className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
    </div>
  );
}
