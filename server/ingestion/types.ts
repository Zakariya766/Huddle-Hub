// Shared types for the match ingestion pipeline

export type Provider = "sportradar" | "mlb_stats" | "api_football";

export type MatchStatus = "scheduled" | "live" | "final" | "postponed" | "cancelled";

// The normalized shape every provider must produce
export interface NormalizedMatch {
  externalId: string;
  provider: Provider;
  sportSlug: string;       // football, basketball, baseball, soccer, fifa
  leagueSlug: string;      // nfl, nba, mlb, mls, premier-league, la-liga, liga-mx, fifa-world-cup
  homeTeamName: string;
  awayTeamName: string;
  providerHomeTeamId: string;
  providerAwayTeamId: string;
  matchName: string | null;
  scheduledAt: Date;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  venueName: string | null;
  venueCity: string | null;
  venueCountry: string | null;
  broadcastInfo: string | null;
  season: string | null;
  week: string | null;
  stage: string | null;
  isPlayoff: boolean;
}

// What a provider fetch returns
export interface ProviderFetchResult {
  provider: Provider;
  sportSlug: string;
  leagueSlug: string;
  endpoint: string;
  rawPayload: string;       // stringified JSON for storage
  matches: NormalizedMatch[];
}

// Provider client interface
export interface ProviderClient {
  provider: Provider;
  fetchUpcoming(options: FetchOptions): Promise<ProviderFetchResult[]>;
}

export interface FetchOptions {
  daysAhead?: number;       // default 180 (6 months)
  sport?: string;           // filter to specific sport slug
  league?: string;          // filter to specific league slug
}

// Mapping from provider sport/league names to internal slugs
export interface LeagueMapping {
  sportSlug: string;
  leagueSlug: string;
}

export interface SyncResult {
  provider: Provider;
  sportSlug: string;
  leagueSlug: string;
  matchesFound: number;
  matchesUpserted: number;
  errors: string[];
}
