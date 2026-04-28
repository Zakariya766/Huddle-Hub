import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Search, MapPin, Star, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VenueImage } from "@/components/venue-image";
import { EventCard, type EventWithRelations } from "@/components/event-card";
import type { Venue, Team } from "@shared/schema";

export default function HomePage() {
  const [q, setQ] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrap = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const { data: venues } = useQuery<Venue[]>({ queryKey: ["/api/venues"] });
  const { data: allTeams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const { data: events } = useQuery<EventWithRelations[]>({ queryKey: ["/api/events"] });

  const upcoming = (events ?? [])
    .filter(e => new Date(e.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const weekendCutoff = new Date();
  weekendCutoff.setDate(weekendCutoff.getDate() + 7);
  const thisWeekend = upcoming.filter(e => new Date(e.date) <= weekendCutoff).slice(0, 8);
  const featured = upcoming[0];
  const watchParties = upcoming
    .filter(e => (e.eventType ?? "watch-party") === "watch-party")
    .filter(e => !featured || e.id !== featured.id)
    .slice(0, 6);
  const popularVenues = (venues ?? []).filter(v => v.verified).slice(0, 8);

  const query = q.trim().toLowerCase();
  const teamMatches = query.length >= 2
    ? allTeams?.filter(t => t.name.toLowerCase().includes(query)).slice(0, 4) ?? []
    : [];
  const venueMatches = query.length >= 2
    ? venues?.filter(v => v.name.toLowerCase().includes(query) || (v.neighborhood?.toLowerCase().includes(query) ?? false)).slice(0, 4) ?? []
    : [];
  const hasSuggestions = teamMatches.length + venueMatches.length > 0;

  const goSearch = (term?: string) => {
    const t = (term ?? q).trim();
    setShowSuggestions(false);
    navigate(t ? `/search?q=${encodeURIComponent(t)}` : "/search");
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-6xl mx-auto px-5 md:px-8 pt-8 md:pt-14 pb-24">
        {/* Headline */}
        <div className="mb-6">
          <div className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-3">
            Los Angeles · Tonight
          </div>
          <h1 className="font-headline text-[clamp(2.5rem,8vw,4.5rem)] text-ink">
            Catch the game.<br />
            <span className="italic text-ink-muted">Meet the fans.</span>
          </h1>
        </div>

        {/* Pill search */}
        <div ref={searchWrap} className="relative max-w-2xl" style={{ height: 56 }}>
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted z-10" />
          <Input
            placeholder="Search bars, teams, or watch parties"
            value={q}
            onChange={e => { setQ(e.target.value); setShowSuggestions(true); }}
            onKeyDown={e => e.key === "Enter" && goSearch()}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="!h-14 pl-12 pr-4 bg-paper text-ink border border-cream hover:border-ink/30 rounded-full shadow-sm text-base absolute inset-0"
          />
          {showSuggestions && hasSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-paper rounded-2xl shadow-xl border border-cream overflow-hidden z-30 text-left">
              {teamMatches.length > 0 && (
                <div>
                  <div className="px-4 pt-2 pb-1 text-[10px] font-semibold tracking-wider uppercase text-ink-muted">Teams</div>
                  {teamMatches.map(team => (
                    <button key={team.id} onMouseDown={() => goSearch(team.name)} className="w-full text-left px-4 py-2.5 hover:bg-cream/50 transition-colors flex items-center gap-2 cursor-pointer">
                      <span className="text-sm font-semibold text-ink">{team.name}</span>
                      {team.abbreviation && <span className="text-xs text-ink-muted">({team.abbreviation})</span>}
                    </button>
                  ))}
                </div>
              )}
              {venueMatches.length > 0 && (
                <div className="border-t border-cream">
                  <div className="px-4 pt-2 pb-1 text-[10px] font-semibold tracking-wider uppercase text-ink-muted">Bars & Venues</div>
                  {venueMatches.map(v => (
                    <button key={v.id} onMouseDown={() => navigate(`/venues/${v.id}`)} className="w-full text-left px-4 py-2.5 hover:bg-cream/50 transition-colors cursor-pointer">
                      <div className="text-sm font-semibold text-ink">{v.name}</div>
                      <div className="text-xs text-ink-muted">{v.neighborhood || v.city}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick filter chips */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 -mx-5 md:mx-0 px-5 md:px-0 scrollbar-none">
          {[
            { label: "Watch parties", href: "/search?eventType=watch-party" },
            { label: "Tailgates", href: "/search?eventType=tailgate" },
            { label: "Bar specials", href: "/search?eventType=bar-special" },
            { label: "Meetups", href: "/search?eventType=meetup" },
            { label: "Tonight", href: "/search" },
          ].map(c => (
            <Link key={c.label} href={c.href}>
              <span className="shrink-0 text-sm text-ink-muted hover:text-ink border border-cream hover:border-ink/30 rounded-full px-4 py-2 transition-colors cursor-pointer bg-paper">
                {c.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Host CTA banner */}
        <Link href="/host">
          <div className="mt-6 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-red via-red-light to-red p-5 md:p-6 cursor-pointer hover:shadow-lg transition-shadow">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-white/80 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Throw your own
                </div>
                <h3 className="font-headline text-2xl md:text-3xl text-white leading-tight">
                  Host a watch party. Bring the fans.
                </h3>
                <p className="text-sm text-white/85 mt-1">
                  Public, private, or as a business — set it up in 30 seconds.
                </p>
              </div>
              <div className="shrink-0">
                <span className="inline-flex items-center gap-2 bg-white text-red font-semibold rounded-full px-5 py-2.5 text-sm group-hover:scale-105 transition-transform">
                  Host an event →
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Featured hero event */}
        {featured && (
          <section className="mt-10">
            <Link href={featured.venue ? `/venues/${featured.venue.id}` : "/search"}>
              <div className="group relative rounded-[28px] overflow-hidden cursor-pointer">
                <VenueImage
                  src={featured.imageUrl ?? featured.venue?.imageUrl}
                  name={featured.venue?.name ?? featured.title}
                  seed={featured.venue?.id ?? featured.id}
                  aspect="aspect-[16/9] md:aspect-[21/9]"
                  rounded="rounded-[28px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                <div className="absolute top-5 left-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red text-white">
                    Next Up
                  </span>
                </div>
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <h2 className="font-headline text-3xl md:text-5xl leading-[0.95]">{featured.title}</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-white/85">
                    <span>{new Date(featured.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {new Date(featured.date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
                    {featured.venue && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {featured.venue.name}</span>}
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* This Weekend — horizontal scroll */}
        {thisWeekend.length > 0 && (
          <section className="mt-12">
            <div className="flex items-end justify-between mb-4">
              <h2 className="font-headline text-3xl text-ink">This Weekend</h2>
              <Link href="/events">
                <span className="text-sm text-ink-muted hover:text-ink cursor-pointer">See all →</span>
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto -mx-5 md:-mx-8 px-5 md:px-8 pb-3 scrollbar-none">
              {thisWeekend.map(e => (
                <EventCard key={e.id} event={e} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {/* Watch Parties — grid */}
        {watchParties.length > 0 && (
          <section className="mt-14">
            <div className="flex items-end justify-between mb-4">
              <h2 className="font-headline text-3xl text-ink">Watch Parties</h2>
              <Link href="/search?eventType=watch-party">
                <span className="text-sm text-ink-muted hover:text-ink cursor-pointer">See all →</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {watchParties.map(e => <EventCard key={e.id} event={e} variant="full" />)}
            </div>
          </section>
        )}

        {/* Popular Venues */}
        {popularVenues.length > 0 && (
          <section className="mt-14">
            <div className="flex items-end justify-between mb-4">
              <h2 className="font-headline text-3xl text-ink">Popular Venues</h2>
              <Link href="/search">
                <span className="text-sm text-ink-muted hover:text-ink cursor-pointer">See all →</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {popularVenues.map(v => (
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
                      <h3 className="font-headline text-lg text-ink leading-tight">{v.name}</h3>
                      <div className="flex items-center gap-1 mt-1 text-xs text-ink-muted">
                        <MapPin className="w-3 h-3" />
                        {v.neighborhood || v.city}
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
      </div>
    </div>
  );
}
