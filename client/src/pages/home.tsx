import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Search, MapPin, Calendar, Star, Users, ChevronRight, ShieldCheck, Globe, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Sport, Venue, Event, Team } from "@shared/schema";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [landingSearch, setLandingSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const { data: sports } = useQuery<Sport[]>({ queryKey: ["/api/sports"] });
  const { data: venues } = useQuery<Venue[]>({ queryKey: ["/api/venues"] });
  const { data: allTeams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const { data: events } = useQuery<(Event & { venue?: Venue; homeTeam?: Team; awayTeam?: Team })[]>({ queryKey: ["/api/events"] });
  const featuredVenues = venues?.filter(v => v.verified).slice(0, 8) || [];
  const upcomingEvents = events?.filter(e => new Date(e.date) > new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 12) || [];
  const fifaEvents = events?.filter(e => e.sportId === "sport-fifa" && new Date(e.date) > new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 4) || [];

  const sportIcons: Record<string, string> = {
    football: "🏈", basketball: "🏀", soccer: "⚽", baseball: "⚾", fifa: "🏆",
  };

  const matchingTeams = landingSearch.trim().length >= 2
    ? allTeams?.filter(t => t.name.toLowerCase().includes(landingSearch.toLowerCase())).slice(0, 6) || []
    : [];

  const handleTeamSelect = (teamId: string) => {
    setShowSuggestions(false);
    navigate(`/discover?teamId=${teamId}`);
  };

  const handleLandingSearch = () => {
    if (landingSearch.trim()) {
      setShowSuggestions(false);
      // If there's an exact or single matching team, navigate by teamId
      if (matchingTeams.length === 1) {
        navigate(`/discover?teamId=${matchingTeams[0].id}`);
      } else {
        const exactMatch = allTeams?.find(t => t.name.toLowerCase() === landingSearch.trim().toLowerCase());
        if (exactMatch) {
          navigate(`/discover?teamId=${exactMatch.id}`);
        } else {
          navigate(`/discover?search=${encodeURIComponent(landingSearch.trim())}`);
        }
      }
    }
  };

  const scrollToExplore = () => {
    exploreRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Landing Hero - Full Viewport */}
      <div className="relative bg-ink text-paper overflow-hidden min-h-screen flex flex-col items-center justify-center">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px),
              repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px)`
          }} />
        </div>
        <div className="relative text-center px-4 md:px-6 w-full max-w-2xl mx-auto -mt-40">
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-3 whitespace-nowrap">
            Welcome to the Huddle
          </h1>
          <p className="text-lg md:text-xl text-paper/60 mb-10">
            Where you can join the huddle
          </p>
          <div ref={searchRef} className="relative max-w-xl mx-auto mt-14" style={{ height: 56 }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted z-10" />
            <Input
              placeholder="Search by team name..."
              value={landingSearch}
              onChange={e => { setLandingSearch(e.target.value); setShowSuggestions(true); }}
              onKeyDown={e => e.key === "Enter" && handleLandingSearch()}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="!h-14 pl-12 pr-4 bg-paper text-ink border-0 rounded-full shadow-lg text-base absolute inset-0"
            />
            {showSuggestions && matchingTeams.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-paper rounded-xl shadow-xl border border-cream overflow-hidden z-20">
                {matchingTeams.map(team => (
                  <button
                    key={team.id}
                    onMouseDown={() => handleTeamSelect(team.id)}
                    className="w-full text-left px-4 py-3 hover:bg-cream/50 transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-ink">{team.name}</span>
                    {team.abbreviation && (
                      <span className="text-xs text-ink-muted">({team.abbreviation})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={scrollToExplore}
          className="absolute bottom-[25%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-paper/50 hover:text-paper transition-colors cursor-pointer"
        >
          <span className="text-sm font-medium">Want to explore?</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </button>
      </div>

      {/* Explore Section */}
      <div ref={exploreRef} className="max-w-6xl mx-auto px-4 md:px-6 pb-24 md:pb-12 space-y-10 pt-10">
        {/* Browse by Sport */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-ink">Browse by Sport</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {sports?.map(sport => (
              <Link key={sport.id} href={sport.slug === "fifa" ? "/worldcup" : `/discover?sport=${sport.slug}`} className="w-[calc(50%-6px)] md:w-[calc(20%-10px)]">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-cream h-full">
                  <CardContent className="p-4 md:p-6 text-center">
                    <div className="text-3xl md:text-4xl mb-2">{sportIcons[sport.slug] || "🏅"}</div>
                    <div className="text-sm md:text-base font-semibold text-ink">{sport.name}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Watch Spots */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-ink">Featured Watch Spots</h2>
            <Link href="/discover">
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

        {/* Upcoming Events */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-ink">Upcoming Events</h2>
            <Link href="/events">
              <span className="text-sm text-red font-medium flex items-center gap-1">View all <ChevronRight className="w-4 h-4" /></span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingEvents.map(event => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-cream">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-ink truncate">{event.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(event.date), "MMM d, h:mm a")}
                          </span>
                          {event.venue && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.venue.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <div className="flex items-center gap-1 text-xs text-ink-muted">
                          <Users className="w-3 h-3" /> {event.rsvpCount || 0}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* FIFA World Cup Section */}
        {fifaEvents.length > 0 && (
          <section className="bg-ink/5 -mx-4 md:-mx-6 px-4 md:px-6 py-8 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-ink" />
                <h2 className="font-display text-xl font-bold text-ink">World Cup 2026</h2>
              </div>
              <Link href="/worldcup">
                <span className="text-sm text-red font-medium flex items-center gap-1">Explore <ChevronRight className="w-4 h-4" /></span>
              </Link>
            </div>
            <p className="text-sm text-ink-muted mb-4">International matches coming to LA. Find where to watch with fans from every country.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {fifaEvents.map(event => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border-cream h-full">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm text-ink">{event.title}</h3>
                      <div className="flex items-center gap-2 mt-2 text-xs text-ink-muted">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(event.date), "MMM d, h:mm a")}
                      </div>
                      {event.venue && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-ink-muted">
                          <MapPin className="w-3 h-3" /> {event.venue.name}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {event.homeTeam && <Badge variant="outline" className="text-[10px]">{event.homeTeam.name}</Badge>}
                        {event.awayTeam && <Badge variant="outline" className="text-[10px]">{event.awayTeam.name}</Badge>}
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
