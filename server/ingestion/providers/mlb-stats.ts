import { PROVIDER_CONFIG } from "../config";
import { fetchWithRetry, formatDate, addDays } from "./base";
import type { NormalizedMatch, ProviderFetchResult, FetchOptions, MatchStatus } from "../types";

const PROVIDER = "mlb_stats" as const;
const SPORT_SLUG = "baseball";
const LEAGUE_SLUG = "mlb";

// MLB Stats API response types
interface MLBGame {
  gamePk: number;
  gameDate: string;
  status: { detailedState: string; abstractGameState: string };
  teams: {
    home: { team: { id: number; name: string }; score?: number };
    away: { team: { id: number; name: string }; score?: number };
  };
  venue?: { id?: number; name?: string; location?: { city?: string; country?: string } };
  seriesDescription?: string;
  description?: string;
  gameType?: string; // R=regular, P=playoff, W=world series, etc.
  broadcasts?: Array<{ name?: string; type?: string }>;
}

interface MLBScheduleResponse {
  dates: Array<{
    date: string;
    games: MLBGame[];
  }>;
}

function normalizeStatus(state: string): MatchStatus {
  const map: Record<string, MatchStatus> = {
    scheduled: "scheduled",
    "pre-game": "scheduled",
    "warmup": "scheduled",
    "in progress": "live",
    "manager challenge": "live",
    final: "final",
    "game over": "final",
    postponed: "postponed",
    cancelled: "cancelled",
    suspended: "postponed",
  };
  return map[state.toLowerCase()] || "scheduled";
}

function normalizeGame(game: MLBGame): NormalizedMatch {
  const isPlayoff = ["P", "W", "D", "L", "F"].includes(game.gameType || "");
  const broadcast = game.broadcasts?.map(b => b.name).filter(Boolean).join(", ") || null;

  return {
    externalId: String(game.gamePk),
    provider: PROVIDER,
    sportSlug: SPORT_SLUG,
    leagueSlug: LEAGUE_SLUG,
    homeTeamName: game.teams.home.team.name,
    awayTeamName: game.teams.away.team.name,
    providerHomeTeamId: String(game.teams.home.team.id),
    providerAwayTeamId: String(game.teams.away.team.id),
    matchName: `${game.teams.away.team.name} at ${game.teams.home.team.name}`,
    scheduledAt: new Date(game.gameDate),
    status: normalizeStatus(game.status.detailedState),
    homeScore: game.teams.home.score ?? null,
    awayScore: game.teams.away.score ?? null,
    venueName: game.venue?.name || null,
    venueCity: game.venue?.location?.city || null,
    venueCountry: game.venue?.location?.country || "USA",
    broadcastInfo: broadcast,
    season: new Date(game.gameDate).getFullYear().toString(),
    week: null,
    stage: isPlayoff ? "playoffs" : "regular_season",
    isPlayoff,
  };
}

export async function fetchMLB(options: FetchOptions): Promise<ProviderFetchResult[]> {
  // MLB Stats API is free, no key needed
  const results: ProviderFetchResult[] = [];
  const now = new Date();
  const daysAhead = options.daysAhead || 180;
  const endDate = addDays(now, daysAhead);

  // MLB API supports date ranges up to ~1 year, fetch in 30-day chunks
  const chunks: { start: Date; end: Date }[] = [];
  let cursor = new Date(now);
  while (cursor < endDate) {
    const chunkEnd = new Date(Math.min(addDays(cursor, 30).getTime(), endDate.getTime()));
    chunks.push({ start: new Date(cursor), end: chunkEnd });
    cursor = addDays(chunkEnd, 1);
  }

  for (const chunk of chunks) {
    const startStr = formatDate(chunk.start);
    const endStr = formatDate(chunk.end);
    const endpoint = `${PROVIDER_CONFIG.mlb_stats.baseUrl}/schedule?sportId=1&startDate=${startStr}&endDate=${endStr}&hydrate=team,venue,broadcasts`;

    try {
      console.log(`[ingestion:mlb-stats] Fetching ${startStr} to ${endStr}`);
      const { data, raw } = await fetchWithRetry(endpoint, {}, PROVIDER);

      const schedule = data as MLBScheduleResponse;
      const allMatches: NormalizedMatch[] = [];

      for (const dateEntry of schedule.dates || []) {
        for (const game of dateEntry.games || []) {
          allMatches.push(normalizeGame(game));
        }
      }

      results.push({
        provider: PROVIDER,
        sportSlug: SPORT_SLUG,
        leagueSlug: LEAGUE_SLUG,
        endpoint,
        rawPayload: raw,
        matches: allMatches,
      });
    } catch (err: any) {
      console.error(`[ingestion:mlb-stats] Error fetching ${startStr}-${endStr}: ${err.message}`);
    }
  }

  return results;
}
