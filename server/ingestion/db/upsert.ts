import { db } from "../../db";
import { matches, matchRawPayloads, ingestionRuns } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { resolveMatch, loadMappingCache } from "./team-resolver";
import type { NormalizedMatch, ProviderFetchResult, SyncResult, Provider } from "../types";

// Upsert a batch of normalized matches into the database
export async function upsertMatches(normalized: NormalizedMatch[]): Promise<number> {
  let upserted = 0;

  for (const match of normalized) {
    const resolved = await resolveMatch(match);

    try {
      // Check if match already exists
      const existing = await db.select({ id: matches.id })
        .from(matches)
        .where(and(
          eq(matches.provider, match.provider),
          eq(matches.externalId, match.externalId)
        ))
        .limit(1);

      if (existing.length > 0) {
        // Update existing match
        await db.update(matches)
          .set({
            homeTeamName: match.homeTeamName,
            awayTeamName: match.awayTeamName,
            homeTeamId: resolved.homeTeamId,
            awayTeamId: resolved.awayTeamId,
            sportId: resolved.sportId,
            leagueId: resolved.leagueId,
            matchName: match.matchName,
            scheduledAt: match.scheduledAt,
            status: match.status,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            venueName: match.venueName,
            venueCity: match.venueCity,
            venueCountry: match.venueCountry,
            broadcastInfo: match.broadcastInfo,
            season: match.season,
            week: match.week,
            stage: match.stage,
            isPlayoff: match.isPlayoff,
            updatedAt: new Date(),
          })
          .where(eq(matches.id, existing[0].id));
      } else {
        // Insert new match
        await db.insert(matches).values({
          externalId: match.externalId,
          provider: match.provider,
          sportId: resolved.sportId,
          leagueId: resolved.leagueId,
          homeTeamId: resolved.homeTeamId,
          awayTeamId: resolved.awayTeamId,
          homeTeamName: match.homeTeamName,
          awayTeamName: match.awayTeamName,
          matchName: match.matchName,
          scheduledAt: match.scheduledAt,
          status: match.status,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          venueName: match.venueName,
          venueCity: match.venueCity,
          venueCountry: match.venueCountry,
          broadcastInfo: match.broadcastInfo,
          season: match.season,
          week: match.week,
          stage: match.stage,
          isPlayoff: match.isPlayoff,
        });
      }
      upserted++;
    } catch (err: any) {
      console.error(`[upsert] Error upserting match ${match.externalId}: ${err.message}`);
    }
  }

  return upserted;
}

// Store raw API payload for debugging
export async function storeRawPayload(result: ProviderFetchResult): Promise<void> {
  try {
    await db.insert(matchRawPayloads).values({
      provider: result.provider,
      endpoint: result.endpoint,
      sportSlug: result.sportSlug,
      leagueSlug: result.leagueSlug,
      payload: result.rawPayload,
      matchCount: result.matches.length,
    });
  } catch (err: any) {
    console.error(`[upsert] Error storing raw payload: ${err.message}`);
  }
}

// Create an ingestion run record
export async function createIngestionRun(provider: Provider, sportSlug: string, leagueSlug: string): Promise<string> {
  const [run] = await db.insert(ingestionRuns).values({
    provider,
    sportSlug,
    leagueSlug,
    status: "running",
  }).returning({ id: ingestionRuns.id });
  return run.id;
}

// Complete an ingestion run
export async function completeIngestionRun(
  runId: string,
  matchesFound: number,
  matchesUpserted: number,
  error?: string
): Promise<void> {
  await db.update(ingestionRuns)
    .set({
      status: error ? "failed" : "completed",
      matchesFound,
      matchesUpserted,
      errorMessage: error || null,
      completedAt: new Date(),
    })
    .where(eq(ingestionRuns.id, runId));
}

// Process a full provider fetch result: store raw payload + upsert matches
export async function processFetchResult(result: ProviderFetchResult): Promise<SyncResult> {
  const syncResult: SyncResult = {
    provider: result.provider,
    sportSlug: result.sportSlug,
    leagueSlug: result.leagueSlug,
    matchesFound: result.matches.length,
    matchesUpserted: 0,
    errors: [],
  };

  const runId = await createIngestionRun(result.provider, result.sportSlug, result.leagueSlug);

  try {
    // Store the raw payload
    await storeRawPayload(result);

    // Upsert all matches
    syncResult.matchesUpserted = await upsertMatches(result.matches);

    await completeIngestionRun(runId, syncResult.matchesFound, syncResult.matchesUpserted);
  } catch (err: any) {
    syncResult.errors.push(err.message);
    await completeIngestionRun(runId, syncResult.matchesFound, syncResult.matchesUpserted, err.message);
  }

  return syncResult;
}
