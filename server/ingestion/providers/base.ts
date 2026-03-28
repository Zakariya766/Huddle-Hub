import { RATE_LIMIT_DELAY } from "../config";

// Shared HTTP fetch with retry and rate limiting
export async function fetchWithRetry(
  url: string,
  headers: Record<string, string> = {},
  provider: string,
  maxRetries = 3
): Promise<{ data: any; raw: string }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "Accept": "application/json", ...headers },
      });

      if (res.status === 429) {
        // Rate limited — wait and retry
        const wait = (RATE_LIMIT_DELAY[provider] || 1000) * attempt * 2;
        console.log(`[ingestion:${provider}] Rate limited, waiting ${wait}ms (attempt ${attempt})`);
        await sleep(wait);
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }

      const raw = await res.text();
      const data = JSON.parse(raw);
      return { data, raw };
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        const wait = 1000 * attempt;
        console.log(`[ingestion:${provider}] Attempt ${attempt} failed: ${err.message}. Retrying in ${wait}ms`);
        await sleep(wait);
      }
    }
  }

  throw lastError || new Error("Fetch failed after retries");
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatDate(d: Date): string {
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
