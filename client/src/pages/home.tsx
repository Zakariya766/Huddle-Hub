import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Search, MapPin, Star, ChevronRight, ShieldCheck, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EventCard, type EventWithRelations } from "@/components/event-card";
import type { Venue, Team } from "@shared/schema";

export default function HomePage() {
  const [landingSearch, setLandingSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const { data: venues } = useQuery<Venue[]>({ queryKey: ["/api/venues"] });
  const { data: allTeams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const { data: events } = useQuery<EventWithRelations[]>({ queryKey: ["/api/events"] });

  const featuredVenues = venues?.filter(v => v.verified).slice(0, 8) || [];
  const upcoming = (events ?? [])
    .filter(e => new Date(e.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const weekendCutoff = new Date();
  weekendCutoff.setDate(weekendCutoff.getDate() + 7);
  const thisWeekend = upcoming.filter(e => new Date(e.date) <= weekendCutoff).slice(0, 6);
  const watchParties = upcoming.filter(e => (e.eventType ?? "watch-party") === "watch-party").slice(0, 6);

  const q = landingSearch.trim().toLowerCase();
  const teamMatches = q.length >= 2
    ? allTeams?.filter(t => t.name.toLowerCase().includes(q)).slice(0, 4) ?? []
    : [];
  const venueMatches = q.length >= 2
    ? venues?.filter(v => v.name.toLowerCase().includes(q) || (v.neighborhood?.toLowerCase().includes(q) ?? false)).slice(0, 4) ?? []
    : [];
  const hasSuggestions = teamMatches.length + venueMatches.length > 0;

  const goSearch = (overrideQ?: string) => {
    const term = (overrideQ ?? landingSearch).trim();
    setShowSuggestions(false);
    if (term) navigate(`/search?q=${encodeURIComponent(term)}`);
    else navigate(`/search`);
  };

  const scrollToExplore = () => exploreRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-paper">
      {/* Landing Hero */}
      <div className="relative bg-ink text-paper overflow-hidden min-h-screen flex flex-col items-center justify-center">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px),
              repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px)`
          }} />
        </div>
        <div className="relative text-center px-4 md:px-6 w-full max-w-2xl mx-auto -mt-32">
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-3">
            Find where fans watch the game.
          </h1>
          <p className="text-lg md:text-xl text-paper/60 mb-10">
            Watch parties, team bars, and game-day events across LA.
          </p>
          <div ref={searchRef} className="relative max-w-xl mx-auto mt-10" style={{ height: 56 }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted z-10" />
            <Input
              placeholder="Search bars, teams, or watch parties..."
              value={landingSearch}
              onChange={e => { setLandingSearch(e.target.value); setShowSuggestions(true); }}
              onKeyDown={e => e.key === "Enter" && goSearch()}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="!h-14 pl-12 pr-4 bg-paper text-ink border-0 rounded-full shadow-lg text-base absolute inset-0"
            />
            {showSuggestions && hasSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-paper rounded-xl shadow-xl border border-cream overflow-hidden z-20 text-left">
                {teamMatches.length > 0 && (
                  <div>
                    <div className="px-4 pt-2 pb-1 text-[10px] font-semibold tracking-wider uppercase text-ink-muted">Teams</div>
                    {teamMatches.map(team => (
                      <button
                        key={team.id}
                        onMouseDown={() => goSearch(team.name)}
                        className="w-full text-left px-4 py-2.5 hover:bg-cream/50 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span className="text-sm font-semibold text-ink">{team.name}</span>
                        {team.abbreviation && (
                          <span className="text-xs text-ink-muted">({team.abbreviation})</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {venueMatches.length > 0 && (
                  <div className="border-t border-cream">
                    <div className="px-4 pt-2 pb-1 text-[10px] font-semibold tracking-wider uppercase text-ink-muted">Bars & Venues</div>
                    {venueMatches.map(v => (
                      <button
                        key={v.id}
                        onMouseDown={() => navigate(`/venues/${v.id}`)}
                        className="w-full text-left px-4 py-2.5 hover:bg-cream/50 transition-colors cursor-pointer"
                      >
                        <div className="text-sm font-semibold text-ink">{v.name}</div>
                        <div className="text-xs text-ink-muted">{v.neighborhood || v.city}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
            {["Watch parties", "Tailgates", "Bar specials"].map(term => (
              <button
                key={term}
                onClick={() => goSearch(term)}
                className="text-xs text-paper/70 hover:text-paper border border-paper/20 hover:border-paper/50 rounded-full px-3 py-1.5 transition"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={scrollToExplore}
          className="absolute bottom-[18%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-paper/50 hover:text-paper transition-colors cursor-pointer"
        >
          <span className="text-sm font-medium">Want to explore?</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </button>
      </div>

      {/* Explore */}
      <div ref={exploreRef} className="max-w-6xl mx-auto px-4 md:px-6 pb-24 md:pb-12 space-y-10 pt-10">
        {/* This Weekend */}
        {thisWeekend.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-ink">This Weekend</h2>
              <Link href="/events">
                <span className="text-sm text-red font-medium flex items-center gap-1">View all <ChevronRight className="w-4 h-4" /></span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {thisWeekend.map(e => <EventCard key={e.id} event={e} compact />)}
            </div>
          </section>
        )}

        {/* Watch Parties */}
        {watchParties.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-ink">Watch Parties</h2>
              <Link href="/search?eventType=watch-party">
                <span className="text-sm text-red font-medium flex items-center gap-1">View all <ChevronRight className="w-4 h-4" /></span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {watchParties.map(e => <EventCard key={e.id} event={e} compact />)}
            </div>
          </section>
        )}

        {/* Featured Bars */}
        {featuredVenues.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-ink">Popular Venues</h2>
              <Link href="/search">
                <span className="text-sm text-red font-medium flex items-center gap-1">View all <ChevronRight className="w-4 h-4" /></span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {featuredVenues.map(venue => (
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
      </div>
    </div>
  );
}
