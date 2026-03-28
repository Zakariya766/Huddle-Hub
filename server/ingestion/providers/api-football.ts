import { PROVIDER_CONFIG } from "../config";
import { fetchWithRetry, sleep, formatDate, addDays } from "./base";
import type { NormalizedMatch, ProviderFetchResult, FetchOptions, MatchStatus } from "../types";
import { RATE_LIMIT_DELAY } from "../config";

const PROVIDER = "api_football" as const;

// API-Football response types
interface APIFootballFixture {
  fixture: {
    id: number;
    date: string;
    status: { long: string; short: string };
    venue?: { id?: number; name?: string; city?: string };
  };
  league: {
    id: number;
    name: string;
    country: string;
    season: number;
    round?: string;
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: { home: number | null; away: number | null };
}

interface APIFootballResponse {
  response: APIFootballFixture[];
  errors?: any;
}

function normalizeStatus(short: string): MatchStatus {
  const map: Record<string, MatchStatus> = {
    TBD: "scheduled",
    NS: "scheduled",
    "1H": "live",
    HT: "live",
    "2H": "live",
    ET: "live",
    P: "live",
    FT: "final",
    AET: "final",
    PEN: "final",
    BT: "live",
    SUSP: "postponed",
    INT: "postponed",
    PST: "postponed",
    CANC: "cancelled",
    ABD: "cancelled",
    AWD: "final",
    WO: "final",
    LIVE: "live",
  };
  return map[short] || "scheduled";
}

function normalizeFixture(fix: APIFootballFixture, sportSlug: string, leagueSlug: string): NormalizedMatch {
  const round = fix.league.round || null;
  const isPlayoff = !!(round && (
    round.toLowerCase().includes("final") ||
    round.toLowerCase().includes("semi") ||
    round.toLowerCase().includes("quarter") ||
    round.toLowerCase().includes("knockout") ||
    round.toLowerCase().includes("round of")
  ));

  return {
    externalId: String(fix.fixture.id),
    provider: PROVIDER,
    sportSlug,
    leagueSlug,
    homeTeamName: fix.teams.home.name,
    awayTeamName: fix.teams.away.name,
    providerHomeTeamId: String(fix.teams.home.id),
    providerAwayTeamId: String(fix.teams.away.id),
    matchName: `${fix.teams.home.name} vs ${fix.teams.away.name}`,
    scheduledAt: new Date(fix.fixture.date),
    status: normalizeStatus(fix.fixture.status.short),
    homeScore: fix.goals.home,
    awayScore: fix.goals.away,
    venueName: fix.fixture.venue?.name || null,
    venueCity: fix.fixture.venue?.city || null,
    venueCountry: fix.league.country || null,
    broadcastInfo: null, // API-Football doesn't provide broadcast data on free tier
    season: String(fix.league.season),
    week: round,
    stage: isPlayoff ? "playoffs" : "regular_season",
    isPlayoff,
  };
}

export async function fetchSoccer(options: FetchOptions): Promise<ProviderFetchResult[]> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    console.log("[ingestion:api-football] API_FOOTBALL_KEY not set, skipping");
    return [];
  }

  const results: ProviderFetchResult[] = [];
  const now = new Date();
  const daysAhead = options.daysAhead || 180;
  const endDate = addDays(now, daysAhead);
  const fromStr = formatDate(now);
  const toStr = formatDate(endDate);
  const currentSeason = now.getFullYear();

  const leagueConfig = PROVIDER_CONFIG.api_football.leagues;
  const leagueIds = Object.keys(leagueConfig).map(Number);

  // Filter leagues if sport/league specified
  const filteredLeagues = leagueIds.filter(id => {
    const cfg = leagueConfig[id];
    if (options.sport && cfg.sportSlug !== options.sport) return false;
    if (options.league && cfg.leagueSlug !== options.league) return false;
    return true;
  });

  for (const leagueId of filteredLeagues) {
    const cfg = leagueConfig[leagueId];
    const endpoint = `${PROVIDER_CONFIG.api_football.baseUrl}/fixtures?league=${leagueId}&season=${currentSeason}&from=${fromStr}&to=${toStr}`;

    try {
      console.log(`[ingestion:api-football] Fetching league ${leagueId} (${cfg.leagueSlug})`);
      const { data, raw } = await fetchWithRetry(
        endpoint,
        {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "v3.football.api-sports.io",
        },
        PROVIDER
      );

      const response = data as APIFootballResponse;

      if (response.errors && Object.keys(response.errors).length > 0) {
        console.error(`[ingestion:api-football] API errors for league ${leagueId}:`, response.errors);
      }

      const allMatches: NormalizedMatch[] = [];
      for (const fix of response.response || []) {
        allMatches.push(normalizeFixture(fix, cfg.sportSlug, cfg.leagueSlug));
      }

      results.push({
        provider: PROVIDER,
        sportSlug: cfg.sportSlug,
        leagueSlug: cfg.leagueSlug,
        endpoint: endpoint.replace(apiKey, "REDACTED"),
        rawPayload: raw,
        matches: allMatches,
      });

      await sleep(RATE_LIMIT_DELAY.api_football);
    } catch (err: any) {
      console.error(`[ingestion:api-football] Error fetching league ${leagueId}: ${err.message}`);
    }
  }

  return results;
}
