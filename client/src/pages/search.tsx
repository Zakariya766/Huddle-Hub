import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Search, MapPin, Star, List, Map as MapIcon, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VenueMap } from "@/components/venue-map";
import { VenueImage } from "@/components/venue-image";
import { EventCard, type EventWithRelations } from "@/components/event-card";
import type { Venue, Sport, Team } from "@shared/schema";

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
  // wouter's useLocation strips the query string — re-read from window on each navigation.
  return useMemo(() => new URLSearchParams(window.location.search), [location]);
}

export default function SearchPage() {
  const params = useQueryParams();
  const [, navigate] = useLocation();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [eventType, setEventType] = useState(params.get("eventType") ?? "");
  const [sportId, setSportId] = useState(params.get("sportId") ?? "");
  const [teamId, setTeamId] = useState(params.get("teamId") ?? "");
  const [view, setView] = useState<"list" | "map">("list");

  // Keep local filter state in sync with the URL — covers chip clicks from other pages
  // and direct link navigations once the page is already mounted.
  useEffect(() => {
    setQ(params.get("q") ?? "");
    setEventType(params.get("eventType") ?? "");
    setSportId(params.get("sportId") ?? "");
    setTeamId(params.get("teamId") ?? "");
  }, [params]);

  const commit = (next: { q?: string; eventType?: string; sportId?: string; teamId?: string }) => {
    const eff = {
      q: next.q ?? q,
      eventType: next.eventType ?? eventType,
      sportId: next.sportId ?? sportId,
      teamId: next.teamId ?? teamId,
    };
    // Update local state immediately — wouter v3 doesn't re-render on query-only changes,
    // so we can't rely on the URL→state sync effect to fire here.
    setQ(eff.q);
    setEventType(eff.eventType);
    setSportId(eff.sportId);
    setTeamId(eff.teamId);
    const p = new URLSearchParams();
    if (eff.q) p.set("q", eff.q);
    if (eff.eventType) p.set("eventType", eff.eventType);
    if (eff.sportId) p.set("sportId", eff.sportId);
    if (eff.teamId) p.set("teamId", eff.teamId);
    navigate(`/search${p.toString() ? "?" + p.toString() : ""}`);
  };

  const { data: sports } = useQuery<Sport[]>({ queryKey: ["/api/sports"] });
  const { data: teamsAll } = useQuery<Team[]>({ queryKey: ["/api/teams"] });

  const { data: results, isLoading } = useQuery<SearchResult>({
    queryKey: ["/api/search", { q, eventType, sportId, teamId }],
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

  const mapVenues = useMemo(() => {
    const m = new Map<string, Venue>();
    events.forEach(e => { if (e.venue) m.set(e.venue.id, e.venue); });
    venues.forEach(v => m.set(v.id, v));
    return Array.from(m.values());
  }, [events, venues]);

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-6xl mx-auto px-5 md:px-8 pt-8 md:pt-12 pb-24">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted z-10" />
          <Input
            placeholder="Search bars, teams, or watch parties"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === "Enter" && commit({ q })}
            className="!h-14 pl-12 pr-4 bg-paper text-ink border border-cream hover:border-ink/30 rounded-full text-base"
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            onClick={() => commit({ eventType: "" })}
            className={`text-sm px-4 py-2 rounded-full border transition ${eventType === "" ? "bg-ink text-paper border-ink" : "bg-paper text-ink-muted border-cream hover:border-ink/30"}`}
          >
            All
          </button>
          {EVENT_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => commit({ eventType: eventType === t.id ? "" : t.id })}
              className={`text-sm px-4 py-2 rounded-full border transition ${eventType === t.id ? "bg-ink text-paper border-ink" : "bg-paper text-ink-muted border-cream hover:border-ink/30"}`}
            >
              {t.label}
            </button>
          ))}
          <div className="h-5 w-px bg-cream mx-1" />
          <select
            value={sportId}
            onChange={e => { setSportId(e.target.value); commit({ sportId: e.target.value }); }}
            className="text-sm h-9 pl-3 pr-8 rounded-full border border-cream bg-paper text-ink-muted"
          >
            <option value="">All Sports</option>
            {sports?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select
            value={teamId}
            onChange={e => { setTeamId(e.target.value); commit({ teamId: e.target.value }); }}
            className="text-sm h-9 pl-3 pr-8 rounded-full border border-cream bg-paper text-ink-muted"
          >
            <option value="">All Teams</option>
            {teamsAll?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {/* Result count + view toggle */}
        <div className="flex items-center justify-between mt-6 mb-4">
          <div className="text-sm text-ink-muted">
            {isLoading ? "Searching…" : `${events.length} events · ${venues.length} venues`}
          </div>
          <div className="inline-flex items-center rounded-full border border-cream bg-paper p-1">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition ${view === "list" ? "bg-ink text-paper" : "text-ink-muted"}`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition ${view === "map" ? "bg-ink text-paper" : "text-ink-muted"}`}
            >
              <MapIcon className="w-3.5 h-3.5" /> Map
            </button>
          </div>
        </div>

        {/* Results */}
        {view === "map" ? (
          <div>
            {mapVenues.length > 0 ? (
              <div className="rounded-3xl overflow-hidden">
                <VenueMap venues={mapVenues} teams={teamsAll ?? []} />
              </div>
            ) : (
              <div className="rounded-3xl border border-cream p-10 text-center text-sm text-ink-muted">
                No places to show on the map.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {events.length > 0 && (
              <section>
                <h2 className="font-headline text-2xl text-ink mb-4">Events</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {events.map(e => <EventCard key={e.id} event={e} variant="full" />)}
                </div>
              </section>
            )}
            {venues.length > 0 && (
              <section>
                <h2 className="font-headline text-2xl text-ink mb-4">Bars & Venues</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {venues.map(v => (
                    <Link key={v.id} href={`/venues/${v.id}`}>
                      <div className="group cursor-pointer">
                        <VenueImage
                          src={v.imageUrl}
                          name={v.name}
                          seed={v.id}
                          aspect="aspect-[4/5]"
                          rounded="rounded-2xl"
                        />
                        <div className="px-1 pt-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-headline text-lg text-ink leading-tight">{v.name}</h3>
                            {v.verified && <ShieldCheck className="w-4 h-4 text-turf shrink-0 mt-1" />}
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-ink-muted">
                            <MapPin className="w-3 h-3" /> {v.neighborhood || v.city}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {v.rating && v.rating > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-gold">
                                <Star className="w-3 h-3 fill-current" /> {v.rating.toFixed(1)}
                              </span>
                            )}
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 rounded-full">{v.category}</Badge>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {!isLoading && events.length === 0 && venues.length === 0 && (
              <div className="rounded-3xl border border-cream p-10 text-center text-sm text-ink-muted">
                No results. Try a different search or remove filters.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
