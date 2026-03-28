import { db } from "../../db";
import { teamProviderMappings, teams, sports, leagues } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { SPORT_SLUG_TO_ID, LEAGUE_SLUG_TO_ID } from "../config";
import type { NormalizedMatch } from "../types";

// In-memory caches, loaded once per sync run
let mappingCache: Map<string, string> | null = null; // "provider:providerTeamId" -> teamId
let teamNameCache: Map<string, string> | null = null; // "lowercase team name" -> teamId

export async function loadMappingCache(): Promise<void> {
  const mappings = await db.select().from(teamProviderMappings);
  mappingCache = new Map();
  for (const m of mappings) {
    mappingCache.set(`${m.provider}:${m.providerTeamId}`, m.teamId);
  }

  // Also build a name-based fallback cache from existing teams
  const allTeams = await db.select().from(teams);
  teamNameCache = new Map();
  for (const t of allTeams) {
    teamNameCache.set(t.name.toLowerCase(), t.id);
    if (t.abbreviation) {
      teamNameCache.set(t.abbreviation.toLowerCase(), t.id);
    }
  }

  console.log(`[team-resolver] Loaded ${mappingCache.size} provider mappings, ${teamNameCache.size} team names`);
}

export function resolveTeamId(provider: string, providerTeamId: string, teamName: string): string | null {
  if (!mappingCache || !teamNameCache) {
    throw new Error("Mapping cache not loaded. Call loadMappingCache() first.");
  }

  // Try exact provider mapping first
  const mapped = mappingCache.get(`${provider}:${providerTeamId}`);
  if (mapped) return mapped;

  // Fallback: try matching by team name
  const byName = teamNameCache.get(teamName.toLowerCase());
  if (byName) return byName;

  // Try partial matching (e.g., "Los Angeles Dodgers" contains "Dodgers")
  // Only match if the cached name appears as a whole word and is at least 4 chars
  const lowerTeamName = teamName.toLowerCase();
  for (const [name, id] of Array.from(teamNameCache.entries())) {
    if (name.length < 4) continue;
    // Check if the cached name is a whole-word match within the input
    const wordBoundary = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (wordBoundary.test(lowerTeamName)) {
      return id;
    }
  }

  return null;
}

export function resolveSportId(sportSlug: string): string | null {
  return SPORT_SLUG_TO_ID[sportSlug] || null;
}

export function resolveLeagueId(leagueSlug: string): string | null {
  return LEAGUE_SLUG_TO_ID[leagueSlug] || null;
}

// Auto-create a mapping when we find a match by name
export async function createMapping(
  provider: string,
  providerTeamId: string,
  providerTeamName: string,
  internalTeamId: string
): Promise<void> {
  try {
    await db.insert(teamProviderMappings).values({
      teamId: internalTeamId,
      provider,
      providerTeamId,
      providerTeamName,
    });
    // Update cache
    if (mappingCache) {
      mappingCache.set(`${provider}:${providerTeamId}`, internalTeamId);
    }
    console.log(`[team-resolver] Created mapping: ${provider}:${providerTeamId} -> ${internalTeamId} (${providerTeamName})`);
  } catch (err: any) {
    // Ignore duplicate key errors
    if (!err.message?.includes("duplicate")) {
      console.error(`[team-resolver] Error creating mapping: ${err.message}`);
    }
  }
}

// Resolve a full normalized match to internal IDs
export interface ResolvedMatch {
  sportId: string | null;
  leagueId: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
}

export async function resolveMatch(match: NormalizedMatch): Promise<ResolvedMatch> {
  const sportId = resolveSportId(match.sportSlug);
  const leagueId = resolveLeagueId(match.leagueSlug);

  let homeTeamId = resolveTeamId(match.provider, match.providerHomeTeamId, match.homeTeamName);
  let awayTeamId = resolveTeamId(match.provider, match.providerAwayTeamId, match.awayTeamName);

  // If resolved by name but no mapping exists, create one for future lookups
  if (homeTeamId && !mappingCache?.has(`${match.provider}:${match.providerHomeTeamId}`)) {
    await createMapping(match.provider, match.providerHomeTeamId, match.homeTeamName, homeTeamId);
  }
  if (awayTeamId && !mappingCache?.has(`${match.provider}:${match.providerAwayTeamId}`)) {
    await createMapping(match.provider, match.providerAwayTeamId, match.awayTeamName, awayTeamId);
  }

  return { sportId, leagueId, homeTeamId, awayTeamId };
}
