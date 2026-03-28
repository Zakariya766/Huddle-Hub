#!/usr/bin/env tsx
// Sync a single league
// Usage: npx tsx scripts/sync-league.ts nfl
// Usage: npx tsx scripts/sync-league.ts nba
// Usage: npx tsx scripts/sync-league.ts mlb
// Usage: npx tsx scripts/sync-league.ts premier-league
// Usage: npx tsx scripts/sync-league.ts fifa-world-cup

import "dotenv/config";
import { syncLeague } from "../server/ingestion/index";

async function main() {
  const league = process.argv[2];

  if (!league) {
    console.error("Usage: npx tsx scripts/sync-league.ts <league-slug>");
    console.error("Available: nfl, nba, mlb, mls, premier-league, la-liga, liga-mx, fifa-world-cup");
    process.exit(1);
  }

  console.log(`\n=== Syncing league: ${league} ===\n`);

  const results = await syncLeague(league);

  console.log("\n=== Summary ===");
  for (const r of results) {
    console.log(`  ${r.provider}/${r.leagueSlug}: ${r.matchesUpserted}/${r.matchesFound} upserted`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
