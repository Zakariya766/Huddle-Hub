import { fetchNFL } from "./providers/sportradar-nfl";
import { fetchNBA } from "./providers/sportradar-nba";
import { fetchMLB } from "./providers/mlb-stats";
import { fetchSoccer } from "./providers/api-football";
import { processFetchResult } from "./db/upsert";
import { loadMappingCache } from "./db/team-resolver";
import type { FetchOptions, ProviderFetchResult, SyncResult } from "./types";

// Registry of all provider fetch functions
const PROVIDERS: Record<string, (opts: FetchOptions) => Promise<ProviderFetchResult[]>> = {
  nfl: fetchNFL,
  nba: fetchNBA,
  mlb: fetchMLB,
  soccer: fetchSoccer,
};

// Map sport slugs to their provider keys
const SPORT_TO_PROVIDERS: Record<string, string[]> = {
  football: ["nfl"],
  basketball: ["nba"],
  baseball: ["mlb"],
  soccer: ["soccer"],
  fifa: ["soccer"], // FIFA is fetched via api-football
};

// Map league slugs to their provider keys
const LEAGUE_TO_PROVIDERS: Record<string, string[]> = {
  nfl: ["nfl"],
  nba: ["nba"],
  mlb: ["mlb"],
  mls: ["soccer"],
  "premier-league": ["soccer"],
  "la-liga": ["soccer"],
  "liga-mx": ["soccer"],
  "fifa-world-cup": ["soccer"],
};

export interface SyncOptions {
  daysAhead?: number;
  sport?: string;    // Filter to a specific sport slug
  league?: string;   // Filter to a specific league slug
}

// Run a full sync across all providers
export async function syncAll(options: SyncOptions = {}): Promise<SyncResult[]> {
  console.log("[ingestion] Starting sync...");
  const startTime = Date.now();

  // Load team mapping cache
  await loadMappingCache();

  const fetchOptions: FetchOptions = {
    daysAhead: options.daysAhead || 180,
    sport: options.sport,
    league: options.league,
  };

  // Determine which providers to run
  let providerKeys: string[];

  if (options.league) {
    providerKeys = LEAGUE_TO_PROVIDERS[options.league] || Object.keys(PROVIDERS);
  } else if (options.sport) {
    providerKeys = SPORT_TO_PROVIDERS[options.sport] || Object.keys(PROVIDERS);
  } else {
    providerKeys = Object.keys(PROVIDERS);
  }

  const uniqueKeys = Array.from(new Set(providerKeys));
  const allResults: SyncResult[] = [];

  for (const key of uniqueKeys) {
    const fetchFn = PROVIDERS[key];
    if (!fetchFn) {
      console.log(`[ingestion] Unknown provider key: ${key}, skipping`);
      continue;
    }

    try {
      console.log(`[ingestion] Running provider: ${key}`);
      const fetchResults = await fetchFn(fetchOptions);

      for (const result of fetchResults) {
        const syncResult = await processFetchResult(result);
        allResults.push(syncResult);
        console.log(
          `[ingestion] ${result.provider}/${result.leagueSlug}: ` +
          `${syncResult.matchesFound} found, ${syncResult.matchesUpserted} upserted` +
          (syncResult.errors.length > 0 ? `, ${syncResult.errors.length} errors` : "")
        );
      }
    } catch (err: any) {
      console.error(`[ingestion] Provider ${key} failed: ${err.message}`);
      allResults.push({
        provider: key as any,
        sportSlug: "unknown",
        leagueSlug: "unknown",
        matchesFound: 0,
        matchesUpserted: 0,
        errors: [err.message],
      });
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalFound = allResults.reduce((s, r) => s + r.matchesFound, 0);
  const totalUpserted = allResults.reduce((s, r) => s + r.matchesUpserted, 0);
  console.log(`[ingestion] Sync complete in ${elapsed}s: ${totalFound} matches found, ${totalUpserted} upserted`);

  return allResults;
}

// Convenience: sync only today's matches (refresh scores/statuses)
export async function syncToday(): Promise<SyncResult[]> {
  return syncAll({ daysAhead: 1 });
}

// Convenience: sync a single sport
export async function syncSport(sportSlug: string): Promise<SyncResult[]> {
  return syncAll({ sport: sportSlug });
}

// Convenience: sync a single league
export async function syncLeague(leagueSlug: string): Promise<SyncResult[]> {
  return syncAll({ league: leagueSlug });
}
