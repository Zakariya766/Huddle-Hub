import { PROVIDER_CONFIG } from "../config";
import { fetchWithRetry, sleep } from "./base";
import type { NormalizedMatch, ProviderFetchResult, FetchOptions, MatchStatus } from "../types";
import { RATE_LIMIT_DELAY } from "../config";

const PROVIDER = "sportradar" as const;
const SPORT_SLUG = "football";
const LEAGUE_SLUG = "nfl";

interface SporradarNFLGame {
  id: string;
  status: string;
  scheduled: string;
  home: { id: string; name: string; alias: string };
  away: { id: string; name: string; alias: string };
  venue?: { name?: string; city?: string; country?: string };
  broadcast?: { network?: string };
  scoring?: { home_points?: number; away_points?: number };
  week?: { sequence?: number; title?: string };
  sr_id?: string;
}

interface SportradarNFLSchedule {
  id: string;
  year: number;
  type: string; // REG, POST, PRE
  weeks?: Array<{
    sequence: number;
    title: string;
    games: SporradarNFLGame[];
  }>;
}

function normalizeStatus(status: string): MatchStatus {
  const map: Record<string, MatchStatus> = {
    scheduled: "scheduled",
    created: "scheduled",
    inprogress: "live",
    halftime: "live",
    closed: "final",
    complete: "final",
    "flex-schedule": "scheduled",
    postponed: "postponed",
    cancelled: "cancelled",
    delayed: "scheduled",
    suspended: "postponed",
  };
  return map[status.toLowerCase()] || "scheduled";
}

function normalizeGame(game: SporradarNFLGame, seasonYear: number, seasonType: string, weekTitle?: string): NormalizedMatch {
  const isPlayoff = seasonType === "POST" || seasonType === "PST";
  return {
    externalId: game.id,
    provider: PROVIDER,
    sportSlug: SPORT_SLUG,
    leagueSlug: LEAGUE_SLUG,
    homeTeamName: game.home.name,
    awayTeamName: game.away.name,
    providerHomeTeamId: game.home.id,
    providerAwayTeamId: game.away.id,
    matchName: `${game.away.name} at ${game.home.name}`,
    scheduledAt: new Date(game.scheduled),
    status: normalizeStatus(game.status),
    homeScore: game.scoring?.home_points ?? null,
    awayScore: game.scoring?.away_points ?? null,
    venueName: game.venue?.name || null,
    venueCity: game.venue?.city || null,
    venueCountry: game.venue?.country || "USA",
    broadcastInfo: game.broadcast?.network || null,
    season: String(seasonYear),
    week: weekTitle || (game.week?.title ? String(game.week.title) : null),
    stage: isPlayoff ? "playoffs" : "regular_season",
    isPlayoff,
  };
}

export async function fetchNFL(options: FetchOptions): Promise<ProviderFetchResult[]> {
  const apiKey = process.env.SPORTRADAR_API_KEY;
  if (!apiKey) {
    console.log("[ingestion:sportradar-nfl] SPORTRADAR_API_KEY not set, skipping");
    return [];
  }

  const results: ProviderFetchResult[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();

  // Fetch current year's schedule for REG and POST seasons
  for (const seasonType of ["REG", "POST"]) {
    const cfg = PROVIDER_CONFIG.sportradar.nfl;
    const endpoint = `${PROVIDER_CONFIG.sportradar.baseUrl}${cfg.path}/games/${currentYear}/${seasonType}/schedule.json?api_key=${apiKey}`;

    try {
      console.log(`[ingestion:sportradar-nfl] Fetching ${currentYear} ${seasonType} schedule`);
      const { data, raw } = await fetchWithRetry(endpoint, {}, PROVIDER);

      const schedule = data as SportradarNFLSchedule;
      const allMatches: NormalizedMatch[] = [];

      if (schedule.weeks) {
        for (const week of schedule.weeks) {
          for (const game of week.games || []) {
            const match = normalizeGame(game, currentYear, seasonType, week.title);
            // Only include future games or recent ones (within daysAhead)
            const daysAhead = options.daysAhead || 180;
            const cutoff = new Date(now.getTime() + daysAhead * 86400000);
            if (match.scheduledAt <= cutoff) {
              allMatches.push(match);
            }
          }
        }
      }

      results.push({
        provider: PROVIDER,
        sportSlug: SPORT_SLUG,
        leagueSlug: LEAGUE_SLUG,
        endpoint: endpoint.replace(apiKey, "REDACTED"),
        rawPayload: raw,
        matches: allMatches,
      });

      await sleep(RATE_LIMIT_DELAY.sportradar);
    } catch (err: any) {
      console.error(`[ingestion:sportradar-nfl] Error fetching ${seasonType}: ${err.message}`);
    }
  }

  return results;
}
