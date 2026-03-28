import { syncAll, syncToday } from "./index";

const FULL_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;   // 6 hours
const TODAY_REFRESH_INTERVAL_MS = 30 * 60 * 1000;     // 30 minutes

let fullSyncTimer: ReturnType<typeof setInterval> | null = null;
let todayRefreshTimer: ReturnType<typeof setInterval> | null = null;

export function startScheduler(): void {
  const enabled = process.env.MATCH_SYNC_ENABLED === "true";

  if (!enabled) {
    console.log("[scheduler] Match sync disabled (set MATCH_SYNC_ENABLED=true to enable)");
    return;
  }

  console.log("[scheduler] Starting match sync scheduler");

  // Run full sync on startup, then every 6 hours
  setTimeout(async () => {
    try {
      await syncAll();
    } catch (err: any) {
      console.error("[scheduler] Full sync error:", err.message);
    }
  }, 5000); // 5s delay to let server fully start

  fullSyncTimer = setInterval(async () => {
    try {
      console.log("[scheduler] Running scheduled full sync");
      await syncAll();
    } catch (err: any) {
      console.error("[scheduler] Full sync error:", err.message);
    }
  }, FULL_SYNC_INTERVAL_MS);

  // Refresh today's matches every 30 minutes (for live scores)
  todayRefreshTimer = setInterval(async () => {
    try {
      console.log("[scheduler] Running today refresh");
      await syncToday();
    } catch (err: any) {
      console.error("[scheduler] Today refresh error:", err.message);
    }
  }, TODAY_REFRESH_INTERVAL_MS);
}

export function stopScheduler(): void {
  if (fullSyncTimer) clearInterval(fullSyncTimer);
  if (todayRefreshTimer) clearInterval(todayRefreshTimer);
  fullSyncTimer = null;
  todayRefreshTimer = null;
  console.log("[scheduler] Stopped");
}
