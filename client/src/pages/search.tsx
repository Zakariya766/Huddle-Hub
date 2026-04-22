import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Search, MapPin, Star, List, Map as MapIcon, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VenueMap } from "@/components/venue-map";
import { EventCard, type EventWithRelations } from "@/components/event-card";
import type { Venue, Sport, League, Team } from "@shared/schema";

const EVENT_TYPES = [
  { id: "watch-party", label: "Watch Parties" },
  { id: "bar-special", label: "Bar Specials" },
  { id: "tailgate", label: "Tailgates" },
  { id: "meetup", label: "Meetups" },
];

type SearchResult = {
  events: EventWithRelations[];
  venues: Venue[];
};

function useQueryParams() {
  const [location] = useLocation();
  return useMemo(() => {
    const qs = location.includes("?") ? location.split("?")[1] : "";
    return new URLSearchParams(qs);
  }, [location]);
}

export default function SearchPage() {
  const params = useQueryParams();
  const [, navigate] = useLocation();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [eventType, setEventType] = useState(params.get("eventType") ?? "");
  const [sportId, setSportId] = useState(params.get("sportId") ?? "");
  const [teamId, setTeamId] = useState(params.get("teamId") ?? "");
  const [view, setView] = useState<"list" | "map">("list");

  const commit = (next: { q?: string; eventType?: string; sportId?: string; teamId?: string }) => {
    const p = new URLSearchParams();
    const eff = {
      q: next.q ?? q,
      eventType: next.eventType ?? eventType,
      sportId: next.sportId ?? sportId,
      teamId: next.teamId ?? teamId,
    };
    if (eff.q) p.set("q", eff.q);
    if (eff.eventType) p.set("eventType", eff.eventType);
    if (eff.sportId) p.set("sportId", eff.sportId);
    if (eff.teamId) p.set("teamId", eff.teamId);
    navigate(`/search${p.toString() ? "?" + p.toString() : ""}`);
  };

  const { data: sports } = useQuery<Sport[]>({ queryKey: ["/api/sports"] });
  const { data: leagues } = useQuery<League[]>({ queryKey: ["/api/leagues"] });
  const { data: teamsAll } = useQuery<Team[]>({ queryKey: ["/api/teams"] });

  const searchKey = ["/api/search", { q, eventType, sportId, teamId }];
  const { data: results, isLoading } = useQuery<SearchResult>({
    queryKey: searchKey,
    queryFn: async () => {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      if (eventType) p.set("eventType", eventType);
      if (sportId) p.set("sportId", sportId);
      if (teamId) p.set("teamId", teamId);
      const res = await fetch(`/api/search?${p.toString()}`);
      return res.json();
    },
  });

  const events = results?.events ?? [];
  const venues = results?.venues ?? [];

  // Map: union of event-attached venues + standalone venue matches
  const mapVenues = useMemo(() => {
    const map = new Map<string, Venue>();
    events.forEach(e => { if (e.venue) map.set(e.venue.id, e.venue); });
    venues.forEach(v => map.set(v.id, v));
    return Array.from(map.values());
  }, [events, venues]);

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="bg-ink text-paper px-4 pt-10 pb-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted z-10" />
            <Input
              placeholder="Search bars, teams, or watch parties..."
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && commit({ q })}
              className="!h-11 pl-10 pr-4 bg-paper text-ink border-0 rounded-full text-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24">
        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            onClick={() => commit({ eventType: "" })}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${eventType === "" ? "bg-ink text-paper border-ink" : "bg-paper text-ink-muted border-cream hover:border-ink"}`}
          >
            All Events
          </button>
          {EVENT_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => commit({ eventType: eventType === t.id ? "" : t.id })}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${eventType === t.id ? "bg-ink text-paper border-ink" : "bg-paper text-ink-muted border-cream hover:border-ink"}`}
            >
              {t.label}
            </button>
          ))}
          <div className="h-4 w-px bg-cream mx-1" />
          <select
            value={sportId}
            onChange={e => { setSportId(e.target.value); commit({ sportId: e.target.value }); }}
            className="text-xs h-8 px-3 rounded-full border border-cream bg-paper text-ink-muted"
          >
            <option value="">All Sports</option>
            {sports?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select
            value={teamId}
            onChange={e => { setTeamId(e.target.value); commit({ teamId: e.target.value }); }}
            className="text-xs h-8 px-3 rounded-full border border-cream bg-paper text-ink-muted"
          >
            <option value="">All Teams</option>
            {teamsAll?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {/* Header row: count + view toggle */}
        <div className="flex items-center justify-between mt-5 mb-3">
          <div className="text-sm text-ink-muted">
            {isLoading
              ? "Searching…"
              : `${events.length} events · ${venues.length} venues`}
          </div>
          <div className="inline-flex items-center rounded-full border border-cream bg-paper p-1">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full transition ${view === "list" ? "bg-ink text-paper" : "text-ink-muted"}`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full transition ${view === "map" ? "bg-ink text-paper" : "text-ink-muted"}`}
            >
              <MapIcon className="w-3.5 h-3.5" /> Map
            </button>
          </div>
        </div>

        {/* Results */}
        {view === "map" ? (
          <div>
            {mapVenues.length > 0 ? (
              <VenueMap venues={mapVenues} teams={teamsAll ?? []} />
            ) : (
              <Card className="border-cream">
                <CardContent className="p-8 text-center text-sm text-ink-muted">No places to show on the map.</CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {events.length > 0 && (
              <section>
                <h2 className="font-display text-sm font-bold text-ink-muted uppercase tracking-wider mb-3">Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {events.map(e => <EventCard key={e.id} event={e} />)}
                </div>
              </section>
            )}
            {venues.length > 0 && (
              <section>
                <h2 className="font-display text-sm font-bold text-ink-muted uppercase tracking-wider mb-3">Bars & Venues</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {venues.map(venue => (
                    <Link key={venue.id} href={`/venues/${venue.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border-cream h-full">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-sm text-ink mr-2">{venue.name}</h3>
                            {venue.verified && <ShieldCheck className="w-4 h-4 text-turf shrink-0" />}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-ink-muted mb-2">
                            <MapPin className="w-3 h-3" /> {venue.neighborhood || venue.city}
                          </div>
                          {venue.description && (
                            <p className="text-xs text-ink-muted line-clamp-2 mb-2">{venue.description}</p>
                          )}
                          <div className="flex items-center gap-2">
                            {venue.rating && venue.rating > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-gold">
                                <Star className="w-3 h-3 fill-current" /> {venue.rating.toFixed(1)}
                              </span>
                            )}
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{venue.category}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {!isLoading && events.length === 0 && venues.length === 0 && (
              <Card className="border-cream">
                <CardContent className="p-8 text-center text-sm text-ink-muted">
                  No results. Try a different search or remove filters.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
