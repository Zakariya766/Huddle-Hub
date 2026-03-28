import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Globe, Calendar, MapPin, Users, Star, ShieldCheck, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Team, Event, Venue, VenueTeamAffiliation } from "@shared/schema";

export default function FifaPage() {
  const [countryFilter, setCountryFilter] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: allTeams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const { data: events, refetch } = useQuery<(Event & { venue?: Venue; homeTeam?: Team; awayTeam?: Team })[]>({
    queryKey: ["/api/events", { sportId: "sport-fifa" }],
    queryFn: async () => {
      const res = await fetch("/api/events?sportId=sport-fifa");
      return res.json();
    },
  });
  const { data: venues } = useQuery<Venue[]>({
    queryKey: ["/api/venues", { sportId: "sport-fifa" }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (countryFilter) params.set("teamId", countryFilter);
      else params.set("sportId", "sport-fifa");
      const res = await fetch(`/api/venues?${params}`);
      return res.json();
    },
  });

  // FIFA national teams
  const fifaTeams = allTeams?.filter(t =>
    t.leagueId === "league-fifawc" || t.leagueId === "league-fifawwc"
  ) || [];

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

  const upcomingFifa = events
    ?.filter(e => new Date(e.date) > new Date())
    .filter(e => !countryFilter || e.teamId === countryFilter || e.awayTeamId === countryFilter)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  const countryFlags: Record<string, string> = {
    "team-usa": "🇺🇸", "team-mexico": "🇲🇽", "team-brazil": "🇧🇷", "team-argentina": "🇦🇷",
    "team-england": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "team-germany": "🇩🇪", "team-france": "🇫🇷", "team-japan": "🇯🇵",
    "team-korea": "🇰🇷", "team-colombia": "🇨🇴",
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Hero */}
      <div className="relative bg-ink text-paper overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px),
              repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px)`
          }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-10 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-6 h-6 text-paper/80" />
            <h1 className="font-display text-2xl md:text-3xl font-bold">World Cup</h1>
          </div>
          <p className="text-sm md:text-base text-paper/70">
            World Cup 2026 is coming to Los Angeles. Find where to watch with fans from every nation.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 pb-24 md:pb-12">
        {/* Country filter */}
        <div className="flex gap-2 mt-6 mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
          <Button
            size="sm"
            variant={!countryFilter ? "default" : "outline"}
            className="text-xs h-8 px-4 rounded-full shrink-0"
            onClick={() => setCountryFilter("")}
          >
            All Countries
          </Button>
          {fifaTeams.map(team => (
            <Button
              key={team.id}
              size="sm"
              variant={countryFilter === team.id ? "default" : "outline"}
              className="text-xs h-8 px-4 rounded-full shrink-0"
              onClick={() => setCountryFilter(team.id)}
            >
              {countryFlags[team.id] || "🏳️"} {team.name}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content: Events */}
          <div className="lg:col-span-2">
            <h2 className="font-display text-lg font-bold text-ink mb-4">
              {countryFilter ? `${fifaTeams.find(t => t.id === countryFilter)?.name || "Country"} Matches` : "Upcoming World Cup Matches"}
            </h2>
            <div className="space-y-3">
              {upcomingFifa.length === 0 && (
                <p className="text-sm text-ink-muted text-center py-8">No upcoming World Cup matches found.</p>
              )}
              {upcomingFifa.map(event => (
                <Card key={event.id} className="border-cream hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-ink text-base">{event.title}</h3>
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
                          <p className="text-sm text-ink-muted mt-2">{event.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          {event.homeTeam && (
                            <Badge variant="outline" className="text-xs py-0.5 px-2">
                              {countryFlags[event.homeTeam.id] || "🏳️"} {event.homeTeam.name}
                            </Badge>
                          )}
                          {event.homeTeam && event.awayTeam && <span className="text-xs text-ink-muted font-bold">vs</span>}
                          {event.awayTeam && (
                            <Badge variant="outline" className="text-xs py-0.5 px-2">
                              {countryFlags[event.awayTeam.id] || "🏳️"} {event.awayTeam.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                        <div className="flex items-center gap-1 text-xs text-ink-muted">
                          <Users className="w-3.5 h-3.5" /> {event.rsvpCount || 0}
                        </div>
                        <Button
                          size="sm"
                          variant={rsvpSet.has(event.id) ? "outline" : "default"}
                          className="text-xs h-8 px-4 rounded-full"
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
          </div>

          {/* Sidebar: Venues showing FIFA */}
          <div>
            <h2 className="font-display text-lg font-bold text-ink mb-4">Watch Spots for World Cup</h2>
            <div className="space-y-2">
              {venues?.slice(0, 8).map(venue => (
                <Link key={venue.id} href={`/venues/${venue.id}`}>
                  <Card className="border-cream hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-sm text-ink truncate">{venue.name}</h3>
                            {venue.verified && <ShieldCheck className="w-3.5 h-3.5 text-turf shrink-0" />}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-ink-muted mt-0.5">
                            <MapPin className="w-3 h-3" /> {venue.neighborhood}
                          </div>
                        </div>
                        {venue.rating && venue.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-gold shrink-0">
                            <Star className="w-3 h-3 fill-current" /> {venue.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {(!venues || venues.length === 0) && (
                <p className="text-sm text-ink-muted text-center py-4">No venues found for this filter.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
