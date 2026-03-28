import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { Search, MapPin, Star, ShieldCheck, X, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Sport, League, Team, Venue, VenueTeamAffiliation } from "@shared/schema";

export default function DiscoverPage() {
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const initialSport = urlParams.get("sport") || "";
  const initialSearch = urlParams.get("search") || "";
  const initialTeamId = urlParams.get("teamId") || "";

  const [search, setSearch] = useState(initialSearch);
  const [sportFilter, setSportFilter] = useState(initialSport);
  const [leagueFilter, setLeagueFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState(initialTeamId);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const { data: sports } = useQuery<Sport[]>({ queryKey: ["/api/sports"] });
  const { data: allLeagues } = useQuery<League[]>({ queryKey: ["/api/leagues"] });
  const { data: allTeams } = useQuery<Team[]>({ queryKey: ["/api/teams"] });

  // Resolve sport slug to ID
  const sportId = sports?.find(s => s.slug === sportFilter || s.id === sportFilter)?.id || "";

  const filteredLeagues = sportId ? allLeagues?.filter(l => l.sportId === sportId) : allLeagues;
  const filteredTeams = leagueFilter
    ? allTeams?.filter(t => t.leagueId === leagueFilter)
    : sportId
      ? allTeams?.filter(t => filteredLeagues?.some(l => l.id === t.leagueId))
      : allTeams;

  const { data: venues } = useQuery<Venue[]>({
    queryKey: ["/api/venues", { teamId: teamFilter, sportId, leagueId: leagueFilter, category: categoryFilter, neighborhood: neighborhoodFilter, verified: verifiedOnly }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (teamFilter) params.set("teamId", teamFilter);
      else if (leagueFilter) params.set("leagueId", leagueFilter);
      else if (sportId) params.set("sportId", sportId);
      if (categoryFilter) params.set("category", categoryFilter);
      if (neighborhoodFilter) params.set("neighborhood", neighborhoodFilter);
      if (verifiedOnly) params.set("verified", "true");
      const res = await fetch(`/api/venues?${params}`);
      return res.json();
    },
  });

  const filteredVenues = venues?.filter(v =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.description?.toLowerCase().includes(search.toLowerCase()) ||
    v.neighborhood?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const neighborhoods = Array.from(new Set(venues?.map(v => v.neighborhood).filter(Boolean) || [])).sort();
  const categories = Array.from(new Set(venues?.map(v => v.category).filter(Boolean) || [])).sort();

  const clearFilters = () => {
    setSportFilter("");
    setLeagueFilter("");
    setTeamFilter("");
    setCategoryFilter("");
    setNeighborhoodFilter("");
    setVerifiedOnly(false);
    setSearch("");
  };

  const hasFilters = sportFilter || leagueFilter || teamFilter || categoryFilter || neighborhoodFilter || verifiedOnly;

  const sportIcons: Record<string, string> = {
    football: "🏈", basketball: "🏀", baseball: "⚾", soccer: "⚽", fifa: "🏆",
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="bg-ink text-paper px-4 pt-10 pb-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display text-2xl font-bold">Discover</h1>
          <p className="text-sm text-paper/70 mt-1">Find where fans watch the game in Greater LA</p>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
            <Input
              placeholder="Search venues, neighborhoods..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-paper text-ink border-0 h-10 rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24">
        {/* Team affiliation banner */}
        {teamFilter && !sportFilter && !leagueFilter && (
          <div className="flex items-center gap-2 mt-4 mb-3 px-3 py-2 bg-ink/5 rounded-lg">
            <span className="text-sm font-medium text-ink">
              Showing venues for: <span className="font-bold">{allTeams?.find(t => t.id === teamFilter)?.name || "Team"}</span>
            </span>
            <Button size="sm" variant="ghost" className="text-xs h-6 px-2 ml-auto" onClick={() => setTeamFilter("")}>
              <X className="w-3 h-3 mr-1" /> Clear
            </Button>
          </div>
        )}

        {/* Sport pills */}
        <div className="flex gap-1.5 mt-4 mb-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
          <Button
            size="sm"
            variant={!sportFilter ? "default" : "outline"}
            className="text-xs h-7 px-3 rounded-full shrink-0"
            onClick={() => { setSportFilter(""); setLeagueFilter(""); setTeamFilter(""); }}
          >
            All Sports
          </Button>
          {sports?.map(sport => (
            <Button
              key={sport.id}
              size="sm"
              variant={sportFilter === sport.slug || sportFilter === sport.id ? "default" : "outline"}
              className="text-xs h-7 px-3 rounded-full shrink-0"
              onClick={() => { setSportFilter(sport.slug); setLeagueFilter(""); setTeamFilter(""); }}
            >
              {sportIcons[sport.slug] || "🏅"} {sport.name.replace("American ", "")}
            </Button>
          ))}
        </div>

        {/* League pills */}
        {sportId && filteredLeagues && filteredLeagues.length > 0 && (
          <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
            <Button
              size="sm"
              variant={!leagueFilter ? "default" : "outline"}
              className="text-xs h-7 px-3 rounded-full shrink-0"
              onClick={() => { setLeagueFilter(""); setTeamFilter(""); }}
            >
              All Leagues
            </Button>
            {filteredLeagues.map(league => (
              <Button
                key={league.id}
                size="sm"
                variant={leagueFilter === league.id ? "default" : "outline"}
                className="text-xs h-7 px-3 rounded-full shrink-0"
                onClick={() => { setLeagueFilter(league.id); setTeamFilter(""); }}
              >
                {league.name}
              </Button>
            ))}
          </div>
        )}

        {/* Team pills */}
        {(leagueFilter || sportId) && filteredTeams && filteredTeams.length > 0 && (
          <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
            <Button
              size="sm"
              variant={!teamFilter ? "default" : "outline"}
              className="text-xs h-7 px-3 rounded-full shrink-0"
              onClick={() => setTeamFilter("")}
            >
              All Teams
            </Button>
            {filteredTeams.map(team => (
              <Button
                key={team.id}
                size="sm"
                variant={teamFilter === team.id ? "default" : "outline"}
                className="text-xs h-7 px-3 rounded-full shrink-0"
                onClick={() => setTeamFilter(team.id)}
              >
                {team.name}
              </Button>
            ))}
          </div>
        )}

        {/* Additional filters */}
        <div className="flex gap-2 mb-4">
          <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c!} className="capitalize">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={neighborhoodFilter} onValueChange={v => setNeighborhoodFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue placeholder="Neighborhood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Neighborhoods</SelectItem>
              {neighborhoods.map(n => (
                <SelectItem key={n} value={n!}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant={verifiedOnly ? "default" : "outline"}
            className="text-xs h-8 px-2 shrink-0"
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            title="Verified venues only"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </Button>
        </div>

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red font-medium mb-3">
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}

        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-ink-muted">{filteredVenues.length} venue{filteredVenues.length !== 1 ? "s" : ""} found</p>
        </div>

        {/* Venue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredVenues.length === 0 && (
            <p className="text-sm text-ink-muted text-center py-8">No venues found matching your filters.</p>
          )}
          {filteredVenues.map(venue => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      </div>
    </div>
  );
}

function VenueCard({ venue }: { venue: Venue }) {
  const { data: affiliations } = useQuery<(VenueTeamAffiliation & { team: Team })[]>({
    queryKey: [`/api/venues/${venue.id}/affiliations`],
  });

  return (
    <Link href={`/venues/${venue.id}`}>
      <Card className="border-cream hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-ink">{venue.name}</h3>
                {venue.verified && <ShieldCheck className="w-4 h-4 text-turf shrink-0" />}
              </div>
              <div className="flex items-center gap-1 text-xs text-ink-muted mb-1.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{venue.address}</span>
              </div>
              {venue.description && (
                <p className="text-xs text-ink-muted line-clamp-2 mb-2">{venue.description}</p>
              )}
              {affiliations && affiliations.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {affiliations.map(aff => (
                    <Badge key={aff.id} variant="outline" className="text-[10px] py-0 px-1.5">
                      {aff.team.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 ml-3 shrink-0">
              {venue.rating && venue.rating > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-gold">
                  <Star className="w-3.5 h-3.5 fill-current" /> {venue.rating.toFixed(1)}
                </span>
              )}
              <Badge variant="secondary" className="text-[10px]">{venue.category}</Badge>
              <ChevronRight className="w-4 h-4 text-ink-muted mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
