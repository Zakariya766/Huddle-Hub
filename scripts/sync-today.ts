#!/usr/bin/env tsx
// Same-day refresh: fetch today's matches to update scores and statuses
// Usage: npx tsx scripts/sync-today.ts

import "dotenv/config";
import { syncToday } from "../server/ingestion/index";

async function main() {
  console.log("\n=== Today's Match Refresh ===\n");

  const results = await syncToday();

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
