#!/usr/bin/env tsx
// Sync a single sport
// Usage: npx tsx scripts/sync-sport.ts football
// Usage: npx tsx scripts/sync-sport.ts basketball
// Usage: npx tsx scripts/sync-sport.ts baseball
// Usage: npx tsx scripts/sync-sport.ts soccer
// Usage: npx tsx scripts/sync-sport.ts fifa

import "dotenv/config";
import { syncSport } from "../server/ingestion/index";

async function main() {
  const sport = process.argv[2];

  if (!sport) {
    console.error("Usage: npx tsx scripts/sync-sport.ts <sport-slug>");
    console.error("Available: football, basketball, baseball, soccer, fifa");
    process.exit(1);
  }

  console.log(`\n=== Syncing sport: ${sport} ===\n`);

  const results = await syncSport(sport);

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
