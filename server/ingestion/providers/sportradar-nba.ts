import { PROVIDER_CONFIG } from "../config";
import { fetchWithRetry, sleep, formatDate, addDays } from "./base";
import type { NormalizedMatch, ProviderFetchResult, FetchOptions, MatchStatus } from "../types";
import { RATE_LIMIT_DELAY } from "../config";

const PROVIDER = "sportradar" as const;
const SPORT_SLUG = "basketball";
const LEAGUE_SLUG = "nba";

interface SportradarNBAGame {
  id: string;
  status: string;
  scheduled: string;
  home: { id: string; name: string; alias: string; market?: string };
  away: { id: string; name: string; alias: string; market?: string };
  venue?: { name?: string; city?: string; country?: string };
  broadcasts?: Array<{ network?: string; type?: string }>;
  home_points?: number;
  away_points?: number;
  sr_id?: string;
  title?: string;
  series?: { title?: string };
}

function normalizeStatus(status: string): MatchStatus {
  const map: Record<string, MatchStatus> = {
    scheduled: "scheduled",
    created: "scheduled",
    inprogress: "live",
    halftime: "live",
    closed: "final",
    complete: "final",
    postponed: "postponed",
    cancelled: "cancelled",
    "if-necessary": "scheduled",
    delayed: "scheduled",
    suspended: "postponed",
  };
  return map[status.toLowerCase()] || "scheduled";
}

function normalizeGame(game: SportradarNBAGame): NormalizedMatch {
  const homeName = game.home.market ? `${game.home.market} ${game.home.name}` : game.home.name;
  const awayName = game.away.market ? `${game.away.market} ${game.away.name}` : game.away.name;
  const broadcast = game.broadcasts?.map(b => b.network).filter(Boolean).join(", ") || null;
  const isPlayoff = !!(game.series?.title || game.title?.toLowerCase().includes("playoff"));

  return {
    externalId: game.id,
    provider: PROVIDER,
    sportSlug: SPORT_SLUG,
    leagueSlug: LEAGUE_SLUG,
    homeTeamName: homeName,
    awayTeamName: awayName,
    providerHomeTeamId: game.home.id,
    providerAwayTeamId: game.away.id,
    matchName: `${awayName} at ${homeName}`,
    scheduledAt: new Date(game.scheduled),
    status: normalizeStatus(game.status),
    homeScore: game.home_points ?? null,
    awayScore: game.away_points ?? null,
    venueName: game.venue?.name || null,
    venueCity: game.venue?.city || null,
    venueCountry: game.venue?.country || "USA",
    broadcastInfo: broadcast,
    season: null, // filled from schedule context
    week: null,
    stage: isPlayoff ? "playoffs" : "regular_season",
    isPlayoff,
  };
}

export async function fetchNBA(options: FetchOptions): Promise<ProviderFetchResult[]> {
  const apiKey = process.env.SPORTRADAR_API_KEY;
  if (!apiKey) {
    console.log("[ingestion:sportradar-nba] SPORTRADAR_API_KEY not set, skipping");
    return [];
  }

  const results: ProviderFetchResult[] = [];
  const now = new Date();
  const daysAhead = options.daysAhead || 180;

  // NBA schedule is fetched by year/month
  // Fetch each month from now to daysAhead
  const months: { year: number; month: number }[] = [];
  let cursor = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = addDays(now, daysAhead);

  while (cursor <= endDate) {
    months.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  for (const { year, month } of months) {
    const monthStr = String(month).padStart(2, "0");
    const cfg = PROVIDER_CONFIG.sportradar.nba;
    const endpoint = `${PROVIDER_CONFIG.sportradar.baseUrl}${cfg.path}/games/${year}/${monthStr}/schedule.json?api_key=${apiKey}`;

    try {
      console.log(`[ingestion:sportradar-nba] Fetching ${year}-${monthStr} schedule`);
      const { data, raw } = await fetchWithRetry(endpoint, {}, PROVIDER);

      const allMatches: NormalizedMatch[] = [];
      const games: SportradarNBAGame[] = data.games || [];

      for (const game of games) {
        const match = normalizeGame(game);
        match.season = `${year}-${String(year + 1).slice(-2)}`;
        allMatches.push(match);
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
      console.error(`[ingestion:sportradar-nba] Error fetching ${year}-${monthStr}: ${err.message}`);
    }
  }

  return results;
}
