import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar, MapPin, Users, Filter, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Sport, League, Team, Venue, Event } from "@shared/schema";

export default function EventsPage() {
  const [sportFilter, setSportFilter] = useState<string>("");
  const [leagueFilter, setLeagueFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: sports } = useQuery<Sport[]>({ queryKey: ["/api/sports"] });
  const { data: leagues } = useQuery<League[]>({ queryKey: ["/api/leagues"] });
  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams", { leagueId: leagueFilter || undefined }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (leagueFilter) params.set("leagueId", leagueFilter);
      const res = await fetch(`/api/teams?${params}`);
      return res.json();
    },
    enabled: !!leagueFilter,
  });
  const { data: events, refetch } = useQuery<(Event & { venue?: Venue; homeTeam?: Team; awayTeam?: Team })[]>({
    queryKey: ["/api/events", { sportId: sportFilter || undefined, leagueId: leagueFilter || undefined, teamId: teamFilter || undefined }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sportFilter) params.set("sportId", sportFilter);
      if (leagueFilter) params.set("leagueId", leagueFilter);
      if (teamFilter) params.set("teamId", teamFilter);
      const res = await fetch(`/api/events?${params}`);
      return res.json();
    },
  });

  const { data: userRsvps } = useQuery<string[]>({
    queryKey: ["/api/events/user-rsvps"],
    enabled: false, // We'll track locally
  });

  const [rsvpSet, setRsvpSet] = useState<Set<string>>(new Set());

  const handleRsvp = async (eventId: string) => {
    if (!user) {
      toast({ title: "Sign in to RSVP", variant: "destructive" });
      return;
    }
    try {
      const res = await apiRequest("POST", `/api/events/${eventId}/rsvp`);
      const data = await res.json();
      setRsvpSet(prev => {
        const next = new Set(prev);
        if (data.rsvpd) next.add(eventId);
        else next.delete(eventId);
        return next;
      });
      refetch();
      toast({ title: data.rsvpd ? "RSVP'd!" : "RSVP removed" });
    } catch {
      toast({ title: "Failed to RSVP", variant: "destructive" });
    }
  };

  const filteredLeagues = sportFilter
    ? leagues?.filter(l => l.sportId === sportFilter)
    : leagues;

  const upcomingEvents = events
    ?.filter(e => new Date(e.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  const pastEvents = events
    ?.filter(e => new Date(e.date) <= new Date())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  return (
    <div className="min-h-screen bg-paper">
      <div className="bg-ink text-paper px-4 pt-10 pb-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display text-2xl font-bold">Events</h1>
          <p className="text-sm text-paper/70 mt-1">Watch parties, game nights, and more</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-4 mb-4">
          <Select value={sportFilter} onValueChange={(v) => { setSportFilter(v === "all" ? "" : v); setLeagueFilter(""); setTeamFilter(""); }}>
            <SelectTrigger className="flex-1 min-w-[120px] h-9 text-sm">
              <SelectValue placeholder="All Sports" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {sports?.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={leagueFilter} onValueChange={(v) => { setLeagueFilter(v === "all" ? "" : v); setTeamFilter(""); }}>
            <SelectTrigger className="flex-1 min-w-[120px] h-9 text-sm">
              <SelectValue placeholder="All Leagues" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leagues</SelectItem>
              {filteredLeagues?.map(l => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {leagueFilter && (
            <Select value={teamFilter} onValueChange={(v) => setTeamFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="flex-1 min-w-[140px] h-9 text-sm">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams?.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Upcoming Events */}
        <h2 className="font-display text-sm font-bold text-ink-muted uppercase tracking-wider mb-3">Upcoming</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          {upcomingEvents.length === 0 && (
            <p className="text-sm text-ink-muted text-center py-8 col-span-full">No upcoming events found.</p>
          )}
          {upcomingEvents.map(event => (
            <Card key={event.id} className="border-cream hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ink">{event.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-ink-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(event.date), "EEE, MMM d 'at' h:mm a")}
                      </span>
                      {event.venue && (
                        <Link href={`/venues/${event.venue.id}`}>
                          <span className="flex items-center gap-1 text-red hover:underline">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.venue.name}
                          </span>
                        </Link>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs text-ink-muted mt-2 line-clamp-2">{event.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {event.homeTeam && <Badge variant="outline" className="text-[10px]">{event.homeTeam.name}</Badge>}
                      {event.awayTeam && <Badge variant="outline" className="text-[10px]">{event.awayTeam.name}</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-3 shrink-0">
                    <div className="flex items-center gap-1 text-xs text-ink-muted">
                      <Users className="w-3.5 h-3.5" /> {event.rsvpCount || 0}
                    </div>
                    <Button
                      size="sm"
                      variant={rsvpSet.has(event.id) ? "outline" : "default"}
                      className="text-xs h-7 px-3 rounded-full"
                      onClick={() => handleRsvp(event.id)}
                    >
                      {rsvpSet.has(event.id) ? "RSVP'd" : "RSVP"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <>
            <h2 className="font-display text-sm font-bold text-ink-muted uppercase tracking-wider mb-3">Past Events</h2>
            <div className="space-y-2 opacity-60">
              {pastEvents.slice(0, 5).map(event => (
                <Card key={event.id} className="border-cream">
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm text-ink">{event.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-ink-muted">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(event.date), "MMM d, yyyy")}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
