import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, Calendar, MapPin, Users, Globe, Lock, Trash2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Event, Venue, Team } from "@shared/schema";

type EventDetail = Event & { venue?: Venue; homeTeam?: Team; awayTeam?: Team; teamTags?: Team[] };

const TYPE_LABELS: Record<string, string> = {
  "watch-party": "Watch Party",
  "bar-special": "Bar Special",
  "tailgate": "Tailgate",
  "meetup": "Meetup",
  "other": "Event",
};

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery<EventDetail>({
    queryKey: [`/api/events/${params.id}`],
  });
  const { data: rsvps } = useQuery<string[]>({
    queryKey: [`/api/events/${params.id}/rsvps`],
  });

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/";
  };

  const handleRsvp = async () => {
    if (!user) {
      toast({ title: "Sign in to RSVP", variant: "destructive" });
      return;
    }
    try {
      const res = await apiRequest("POST", `/api/events/${params.id}/rsvp`);
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: [`/api/events/${params.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${params.id}/rsvps`] });
      toast({ title: data.rsvpd ? "You're in!" : "RSVP removed" });
    } catch {
      toast({ title: "Failed to RSVP", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this event?")) return;
    try {
      await apiRequest("DELETE", `/api/events/${params.id}`);
      toast({ title: "Event deleted" });
      setLocation("/events");
    } catch (e: any) {
      toast({ title: "Delete failed", description: String(e?.message ?? e), variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-8 text-center text-ink-muted">Loading…</div>;
  if (!event) return <div className="p-8 text-center text-ink-muted">Event not found.</div>;

  const isHost = user?.id === event.hostUserId;
  const userIsRsvpd = !!user && (rsvps ?? []).includes(user.id);
  const typeLabel = TYPE_LABELS[event.eventType ?? "watch-party"] ?? "Event";

  return (
    <div className="min-h-screen bg-paper pb-24">
      {/* Hero */}
      <div className="relative w-full h-[260px] md:h-[420px] overflow-hidden bg-black">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : event.venue?.imageUrl ? (
          <img
            src={event.venue.imageUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-red via-red-light to-ink" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/40 pointer-events-none" />
        <button
          onClick={goBack}
          className="absolute top-5 left-5 md:top-6 md:left-6 flex items-center gap-1 text-sm text-white/90 hover:text-white bg-black/35 backdrop-blur-sm rounded-full pl-2.5 pr-3.5 py-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="absolute bottom-5 left-5 right-5 md:bottom-8 md:left-10 md:right-10 max-w-4xl mx-auto text-white">
          <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-widest">
            <span className="px-2.5 py-0.5 rounded-full bg-red text-white font-semibold">{typeLabel}</span>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm">
              {event.isPublic ? <><Globe className="w-3 h-3" /> Public</> : <><Lock className="w-3 h-3" /> Private</>}
            </span>
          </div>
          <h1 className="font-headline text-3xl md:text-5xl leading-[1] drop-shadow-sm">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-white/85">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {format(new Date(event.date), "EEE, MMM d · h:mm a")}
            </span>
            {event.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {event.venue.name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" /> {event.rsvpCount ?? 0} going
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 md:px-8 mt-6 space-y-6">
        {/* Action row */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleRsvp}
            variant={userIsRsvpd ? "outline" : "default"}
            className="rounded-full h-11 px-6"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {userIsRsvpd ? "You're in" : "RSVP"}
          </Button>
          {event.venue && (
            <Link href={`/venues/${event.venue.id}`}>
              <Button variant="outline" className="rounded-full h-11">
                <MapPin className="w-4 h-4 mr-2" /> View venue
              </Button>
            </Link>
          )}
          {isHost && (
            <Button variant="ghost" onClick={handleDelete} className="rounded-full h-11 text-red ml-auto">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <Card className="border-cream">
            <CardContent className="p-5">
              <div className="text-xs uppercase tracking-widest text-ink-muted mb-2">About</div>
              <p className="text-ink whitespace-pre-wrap">{event.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Teams */}
        {event.teamTags && event.teamTags.length > 0 && (
          <Card className="border-cream">
            <CardContent className="p-5">
              <div className="text-xs uppercase tracking-widest text-ink-muted mb-2">Teams</div>
              <div className="flex flex-wrap gap-2">
                {event.teamTags.map(t => (
                  <Badge key={t.id} variant="outline" className="text-xs">{t.name}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Venue card */}
        {event.venue && (
          <Link href={`/venues/${event.venue.id}`}>
            <Card className="border-cream cursor-pointer hover:border-ink/30 transition-colors overflow-hidden">
              <div className="flex items-center gap-4 p-3">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-cream">
                  {event.venue.imageUrl && (
                    <img src={event.venue.imageUrl} alt={event.venue.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase tracking-widest text-ink-muted">Venue</div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-headline text-xl text-ink truncate">{event.venue.name}</h3>
                    {event.venue.verified && <ShieldCheck className="w-4 h-4 text-turf shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-ink-muted mt-0.5">
                    <MapPin className="w-3 h-3" /> {event.venue.address}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
