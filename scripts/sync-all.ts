#!/usr/bin/env tsx
// Full sync: fetch all matches for the next 6 months from all providers
// Usage: npx tsx scripts/sync-all.ts [--days=180]

import "dotenv/config";
import { syncAll } from "../server/ingestion/index";

async function main() {
  const daysArg = process.argv.find(a => a.startsWith("--days="));
  const daysAhead = daysArg ? parseInt(daysArg.split("=")[1]) : 180;

  console.log(`\n=== Full Sync (next ${daysAhead} days) ===\n`);

  const results = await syncAll({ daysAhead });

  console.log("\n=== Summary ===");
  for (const r of results) {
    const status = r.errors.length > 0 ? "ERRORS" : "OK";
    console.log(`  ${r.provider}/${r.leagueSlug}: ${r.matchesUpserted}/${r.matchesFound} upserted [${status}]`);
    for (const e of r.errors) {
      console.log(`    ERROR: ${e}`);
    }
  }

  const total = results.reduce((s, r) => s + r.matchesUpserted, 0);
  console.log(`\nTotal matches upserted: ${total}\n`);

  process.exit(0);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
