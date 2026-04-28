import "dotenv/config";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { db } from "../server/db";
import { venues } from "../shared/schema";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) throw new Error("GOOGLE_PLACES_API_KEY must be set in .env");

const OUT_DIR = path.resolve("client/public/venues");
const MAX_WIDTH = 1200;

type PlacePhoto = { name: string };
type SearchResponse = {
  places?: Array<{ id: string; displayName?: { text: string }; photos?: PlacePhoto[] }>;
};

async function findPhoto(query: string): Promise<string | null> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY!,
      "X-Goog-FieldMask": "places.id,places.displayName,places.photos",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });
  if (!res.ok) {
    console.error(`  searchText ${res.status}:`, await res.text());
    return null;
  }
  const data = (await res.json()) as SearchResponse;
  const photo = data.places?.[0]?.photos?.[0];
  return photo?.name ?? null;
}

async function downloadPhoto(photoName: string, dest: string): Promise<boolean> {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${MAX_WIDTH}&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  photo ${res.status}:`, await res.text());
    return false;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return true;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const rows = await db.select().from(venues);
  console.log(`Fetching photos for ${rows.length} venues → ${OUT_DIR}`);

  let ok = 0, missing = 0, failed = 0;
  for (const v of rows) {
    const query = `${v.name}, ${v.address ?? ""} ${v.city ?? ""}`.trim();
    process.stdout.write(`• ${v.id} ${v.name.padEnd(28)} `);
    const photoName = await findPhoto(query);
    if (!photoName) { console.log("no photo match"); missing++; continue; }
    const dest = path.join(OUT_DIR, `${v.id}.jpg`);
    const saved = await downloadPhoto(photoName, dest);
    if (saved) { console.log("ok"); ok++; } else { failed++; }
  }
  console.log(`\nDone. ok=${ok} missing=${missing} failed=${failed}`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
