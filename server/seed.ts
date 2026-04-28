import { db } from "./db";
import {
  users, sports, leagues, teams, posts, comments, likes,
  venues, venueTeamAffiliations, events, eventTeams, eventRsvps, offers,
  communityRooms, roomMessages, reviews, checkins,
} from "@shared/schema";
import { sql, inArray } from "drizzle-orm";

// Demo fixtures — re-seeded on every boot so dates always look "upcoming".
// User-created events (with uuid ids) are preserved.
const SEEDED_EVENT_IDS = Array.from({ length: 15 }, (_, i) => `event-${i + 1}`);

function buildSeededEventData(now: Date) {
  const day = (n: number) => new Date(now.getTime() + 86400000 * n);
  const hour = (d: Date, h: number) => { const x = new Date(d); x.setHours(h, 0, 0, 0); return x; };
  return [
    { id: "event-1",  venueId: "venue-7",  teamId: "team-rams",     awayTeamId: "team-49ers",   sportId: "sport-football",   leagueId: "league-nfl",    title: "Rams 2026 NFL Draft Recap Watch Party",                description: "Tom's Watch Bar breaks down LA's draft class. Drink specials, sports talk, and 120+ screens.",      date: hour(day(2),  19), rsvpCount: 38, eventType: "watch-party" },
    { id: "event-2",  venueId: "venue-22", teamId: "team-chargers", awayTeamId: "team-chiefs",  sportId: "sport-football",   leagueId: "league-nfl",    title: "AFC West 2026 Schedule Release Show",                  description: "Brickhouse hosts the schedule reveal. First peek at Chargers + Chiefs + Raiders home dates.",       date: hour(day(5),  17), rsvpCount: 24, eventType: "watch-party" },
    { id: "event-3",  venueId: "venue-4",  teamId: "team-dodgers",  awayTeamId: "team-angels",  sportId: "sport-baseball",   leagueId: "league-mlb",    title: "Dodgers vs Angels — Freeway Series",                   description: "Barney's pulls out the big screens for the early-season Freeway Series. Beer specials all 3 games.", date: hour(day(3),  19), rsvpCount: 52, eventType: "watch-party" },
    { id: "event-4",  venueId: "venue-14", teamId: "team-lafc",     awayTeamId: "team-lagalaxy",sportId: "sport-soccer",     leagueId: "league-mls",    title: "El Tráfico — LAFC vs LA Galaxy",                       description: "Red Lion Tavern's biggest night. The MLS rivalry that defines the city.",                          date: hour(day(4),  19), rsvpCount: 78, eventType: "watch-party" },
    { id: "event-5",  venueId: "venue-1",  teamId: "team-arsenal",  awayTeamId: "team-chelsea", sportId: "sport-soccer",     leagueId: "league-epl",    title: "Arsenal vs Chelsea — Top 4 Showdown",                  description: "Premier League run-in at Ye Olde King's Head. Doors 7 AM, full English breakfast.",                date: hour(day(6),   7), rsvpCount: 41, eventType: "watch-party" },
    { id: "event-6",  venueId: "venue-9",  teamId: "team-mexico",   awayTeamId: "team-usa",     sportId: "sport-fifa",       leagueId: "league-fifawc", title: "USA vs Mexico — World Cup 2026 Tune-Up",               description: "La Cita Bar packs out for the pre-WC friendly. Both jerseys, one bar, expect noise.",              date: hour(day(8),  18), rsvpCount: 95, eventType: "watch-party" },
    { id: "event-7",  venueId: "venue-7",  teamId: "team-usa",      awayTeamId: "team-england", sportId: "sport-fifa",       leagueId: "league-fifawc", title: "USA vs England — WC 2026 Group Stage Friendly",        description: "Tom's projects on every screen. World Cup hits LA in 6 weeks — get warmed up.",                    date: hour(day(11), 16), rsvpCount: 130, eventType: "watch-party" },
    { id: "event-8",  venueId: "venue-23", teamId: "team-chivas",   awayTeamId: "team-america", sportId: "sport-soccer",     leagueId: "league-ligamx", title: "Club América vs Chivas — Liga MX Clásico",             description: "La Numero Uno is wall-to-wall jerseys. Bring your colors and your voice.",                         date: hour(day(7),  19), rsvpCount: 64, eventType: "watch-party" },
    { id: "event-9",  venueId: "venue-13", teamId: "team-usc",      awayTeamId: "team-ucla",    sportId: "sport-football",   leagueId: "league-cfb",    title: "USC vs UCLA — 2026 Schedule Release Party",            description: "The 35er marks the day Pac fans get the new slate. Trojan & Bruin tables both welcome.",            date: hour(day(9),  18), rsvpCount: 22, eventType: "watch-party" },
    { id: "event-10", venueId: "venue-11", teamId: "team-korea",    awayTeamId: "team-japan",   sportId: "sport-fifa",       leagueId: "league-fifawc", title: "South Korea vs Japan — Friendly",                      description: "The Prince in Koreatown. KBBQ menu + the rivalry that owns East Asia.",                            date: hour(day(13), 19), rsvpCount: 29, eventType: "watch-party" },
    { id: "event-11", venueId: "venue-7",  teamId: "team-lakers",   awayTeamId: "team-celtics", sportId: "sport-basketball", leagueId: "league-nba",    title: "Lakers vs Celtics — NBA Finals Preview",               description: "Tom's expects a Finals matchup. The greatest rivalry in basketball, regular-season closer.",        date: hour(day(1),  19), rsvpCount: 88, eventType: "watch-party" },
    { id: "event-12", venueId: "venue-10", teamId: "team-lakers",   awayTeamId: "team-warriors",sportId: "sport-basketball", leagueId: "league-nba",    title: "Lakers vs Warriors — Playoff Stakes",                  description: "HMS Bounty's mid-Wilshire viewing party. Old-school spot, new-era LeBron / Curry chess match.",     date: hour(day(2),  19), rsvpCount: 61, eventType: "watch-party" },
    { id: "event-13", venueId: "venue-22", teamId: "team-rams",     awayTeamId: null as any,    sportId: "sport-football",   leagueId: "league-nfl",    title: "Rams Schedule Release Tailgate",                       description: "Brickhouse's pre-season tailgate at SoFi. BBQ, DJ, and the schedule drop on the big screen.",      date: hour(day(10), 16), rsvpCount: 40, eventType: "tailgate" },
    { id: "event-14", venueId: "venue-1",  teamId: null as any,     awayTeamId: null as any,    sportId: "sport-soccer",     leagueId: "league-epl",    title: "Premier League Saturday Morning Pub",                   description: "Ye Olde King's Head, weekly. 6 EPL matches on the big screens, full English on every plate.",      date: hour(day(0),   7), rsvpCount: 18, eventType: "bar-special" },
    { id: "event-15", venueId: "venue-4",  teamId: "team-dodgers",  awayTeamId: null as any,    sportId: "sport-baseball",   leagueId: "league-mlb",    title: "Dodgers Brunch & Bullpen Day",                         description: "Casual game-day meetup at Barney's. Brunch + the Dodger broadcast. Bring your gear.",              date: hour(day(12), 11), rsvpCount: 16, eventType: "meetup" },
  ] as const;
}

// Per-event cover images — famous player from one of the matchup teams.
// Sourced from Wikipedia (Wikimedia Commons, freely hotlinkable).
const EVENT_IMAGES: Record<string, string> = {
  "event-1":  "https://upload.wikimedia.org/wikipedia/commons/5/51/Cooper_Kupp.jpg",
  "event-2":  "https://upload.wikimedia.org/wikipedia/commons/9/92/Patrick_Mahomes_%2851615475056%29.jpg",
  "event-3":  "https://upload.wikimedia.org/wikipedia/commons/e/e6/Dodgers_at_Nationals_%2853677192000%29_%28cropped%29.jpg",
  "event-4":  "https://upload.wikimedia.org/wikipedia/commons/6/6d/Mex-Kor_%2821%29_%28cropped%29.jpg",
  "event-5":  "https://upload.wikimedia.org/wikipedia/commons/c/cd/1_bukayo_saka_arsenal_2025_%28cropped%29.jpg",
  "event-6":  "https://upload.wikimedia.org/wikipedia/commons/7/71/Christian_Pulisic_USMNT_v_Belgium_Mar_28_2026-73_%28cropped%29.jpg",
  "event-7":  "https://upload.wikimedia.org/wikipedia/commons/9/91/Harry_Kane_on_October_10%2C_2023.jpg",
  "event-8":  "https://upload.wikimedia.org/wikipedia/commons/3/30/Henry_Martin_2.png",
  "event-9":  "https://upload.wikimedia.org/wikipedia/commons/a/af/Reggie_Bush_by_Gage_Skidmore.jpg",
  "event-10": "https://upload.wikimedia.org/wikipedia/commons/b/b0/BFA_2023_-2_Heung-Min_Son_%28cropped%29.jpg",
  "event-11": "https://upload.wikimedia.org/wikipedia/commons/7/7a/LeBron_James_%2851959977144%29_%28cropped2%29.jpg",
  "event-12": "https://upload.wikimedia.org/wikipedia/commons/5/52/Stephen_Curry%2C_Olympic_Games_2024_%28cropped%29.jpg",
  "event-13": "https://upload.wikimedia.org/wikipedia/commons/5/53/Stafford_6_731_%28cropped3%29.jpg",
  "event-14": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Mohamed_Salah_2018.jpg",
  "event-15": "https://upload.wikimedia.org/wikipedia/commons/7/70/Clayton_Kershaw_on_July_23%2C_2015_%282%29.jpg",
};

function withEventImages<T extends { id: string }>(rows: T[]): (T & { imageUrl?: string })[] {
  return rows.map(r => ({ ...r, imageUrl: EVENT_IMAGES[r.id] }));
}

export async function seedDatabase() {
  // Apply additive column migrations on every boot (idempotent).
  await applyAdditiveMigrations();

  // Check if already seeded
  const existing = await db.select().from(sports);
  if (existing.length > 0) {
    await refreshEvents();
    await refreshVenueImages();
    await refreshSportNames();
    await refreshEventImages();
    return;
  }

  console.log("Seeding database with Greater Los Angeles data...");

  // ─── Sports ────────────────────────────────────────────────────
  const sportsData = [
    { id: "sport-football", name: "Football", slug: "football", icon: "football" },
    { id: "sport-basketball", name: "Basketball", slug: "basketball", icon: "dribbble" },
    { id: "sport-soccer", name: "Soccer", slug: "soccer", icon: "circle" },
    { id: "sport-baseball", name: "Baseball", slug: "baseball", icon: "circle-dot" },
    { id: "sport-fifa", name: "World Cup", slug: "fifa", icon: "trophy" },
  ];
  await db.insert(sports).values(sportsData);

  // ─── Leagues ────────────────────────────────────────────────────
  const leaguesData = [
    { id: "league-nfl", sportId: "sport-football", name: "NFL", slug: "nfl", country: "USA", description: "National Football League" },
    { id: "league-cfb", sportId: "sport-football", name: "College Football", slug: "college-football", country: "USA", description: "NCAA Division I Football" },
    { id: "league-nba", sportId: "sport-basketball", name: "NBA", slug: "nba", country: "USA", description: "National Basketball Association" },
    { id: "league-mls", sportId: "sport-soccer", name: "MLS", slug: "mls", country: "USA/Canada", description: "Major League Soccer" },
    { id: "league-epl", sportId: "sport-soccer", name: "Premier League", slug: "premier-league", country: "England", description: "English Premier League" },
    { id: "league-laliga", sportId: "sport-soccer", name: "La Liga", slug: "la-liga", country: "Spain", description: "Spanish La Liga" },
    { id: "league-ligamx", sportId: "sport-soccer", name: "Liga MX", slug: "liga-mx", country: "Mexico", description: "Mexican Liga MX" },
    { id: "league-mlb", sportId: "sport-baseball", name: "MLB", slug: "mlb", country: "USA", description: "Major League Baseball" },
    { id: "league-fifawc", sportId: "sport-fifa", name: "FIFA World Cup", slug: "fifa-world-cup", country: "Global", description: "FIFA World Cup 2026" },
    { id: "league-fifawwc", sportId: "sport-fifa", name: "FIFA Women's World Cup", slug: "fifa-womens-world-cup", country: "Global", description: "FIFA Women's World Cup" },
  ];
  await db.insert(leagues).values(leaguesData);

  // ─── Teams ──────────────────────────────────────────────────────
  const teamsData = [
    // NFL
    { id: "team-rams", name: "Los Angeles Rams", leagueId: "league-nfl", city: "Los Angeles", abbreviation: "LAR", description: "The Rams" },
    { id: "team-chargers", name: "Los Angeles Chargers", leagueId: "league-nfl", city: "Los Angeles", abbreviation: "LAC", description: "Bolt Up" },
    { id: "team-chiefs", name: "Kansas City Chiefs", leagueId: "league-nfl", city: "Kansas City", abbreviation: "KC", description: "The Chiefs Kingdom" },
    { id: "team-cowboys", name: "Dallas Cowboys", leagueId: "league-nfl", city: "Dallas", abbreviation: "DAL", description: "America's Team" },
    { id: "team-49ers", name: "San Francisco 49ers", leagueId: "league-nfl", city: "San Francisco", abbreviation: "SF", description: "The Niners" },
    { id: "team-raiders", name: "Las Vegas Raiders", leagueId: "league-nfl", city: "Las Vegas", abbreviation: "LV", description: "Raider Nation" },
    // College Football
    { id: "team-usc", name: "USC Trojans", leagueId: "league-cfb", city: "Los Angeles", abbreviation: "USC", description: "Fight On" },
    { id: "team-ucla", name: "UCLA Bruins", leagueId: "league-cfb", city: "Los Angeles", abbreviation: "UCLA", description: "Go Bruins" },
    // NBA
    { id: "team-lakers", name: "Los Angeles Lakers", leagueId: "league-nba", city: "Los Angeles", abbreviation: "LAL", description: "Lake Show" },
    { id: "team-clippers", name: "Los Angeles Clippers", leagueId: "league-nba", city: "Los Angeles", abbreviation: "LAC", description: "Clipper Nation" },
    { id: "team-celtics", name: "Boston Celtics", leagueId: "league-nba", city: "Boston", abbreviation: "BOS", description: "The Green Machine" },
    { id: "team-warriors", name: "Golden State Warriors", leagueId: "league-nba", city: "San Francisco", abbreviation: "GSW", description: "Dub Nation" },
    // MLS
    { id: "team-lafc", name: "LAFC", leagueId: "league-mls", city: "Los Angeles", abbreviation: "LAFC", description: "Los Angeles Football Club" },
    { id: "team-lagalaxy", name: "LA Galaxy", leagueId: "league-mls", city: "Carson", abbreviation: "LAG", description: "LA's original soccer club" },
    // Premier League
    { id: "team-arsenal", name: "Arsenal", leagueId: "league-epl", city: "London", abbreviation: "ARS", description: "The Gunners" },
    { id: "team-liverpool", name: "Liverpool", leagueId: "league-epl", city: "Liverpool", abbreviation: "LIV", description: "The Reds" },
    { id: "team-manutd", name: "Manchester United", leagueId: "league-epl", city: "Manchester", abbreviation: "MUN", description: "The Red Devils" },
    { id: "team-chelsea", name: "Chelsea", leagueId: "league-epl", city: "London", abbreviation: "CHE", description: "The Blues" },
    // La Liga
    { id: "team-realmadrid", name: "Real Madrid", leagueId: "league-laliga", city: "Madrid", abbreviation: "RMA", description: "Los Blancos" },
    { id: "team-barcelona", name: "FC Barcelona", leagueId: "league-laliga", city: "Barcelona", abbreviation: "BAR", description: "Blaugrana" },
    // Liga MX
    { id: "team-chivas", name: "Chivas de Guadalajara", leagueId: "league-ligamx", city: "Guadalajara", abbreviation: "CHV", description: "El Rebano Sagrado" },
    { id: "team-america", name: "Club America", leagueId: "league-ligamx", city: "Mexico City", abbreviation: "AME", description: "Las Aguilas" },
    { id: "team-tigres", name: "Tigres UANL", leagueId: "league-ligamx", city: "Monterrey", abbreviation: "TIG", description: "Los Tigres" },
    // MLB
    { id: "team-dodgers", name: "Los Angeles Dodgers", leagueId: "league-mlb", city: "Los Angeles", abbreviation: "LAD", description: "The Boys in Blue" },
    { id: "team-angels", name: "Los Angeles Angels", leagueId: "league-mlb", city: "Anaheim", abbreviation: "LAA", description: "The Halos" },
    // FIFA National Teams
    { id: "team-usa", name: "United States", leagueId: "league-fifawc", city: "USA", abbreviation: "USA", description: "USMNT" },
    { id: "team-mexico", name: "Mexico", leagueId: "league-fifawc", city: "Mexico", abbreviation: "MEX", description: "El Tri" },
    { id: "team-brazil", name: "Brazil", leagueId: "league-fifawc", city: "Brazil", abbreviation: "BRA", description: "Selecao" },
    { id: "team-argentina", name: "Argentina", leagueId: "league-fifawc", city: "Argentina", abbreviation: "ARG", description: "La Albiceleste" },
    { id: "team-england", name: "England", leagueId: "league-fifawc", city: "England", abbreviation: "ENG", description: "Three Lions" },
    { id: "team-germany", name: "Germany", leagueId: "league-fifawc", city: "Germany", abbreviation: "GER", description: "Die Mannschaft" },
    { id: "team-france", name: "France", leagueId: "league-fifawc", city: "France", abbreviation: "FRA", description: "Les Bleus" },
    { id: "team-japan", name: "Japan", leagueId: "league-fifawc", city: "Japan", abbreviation: "JPN", description: "Samurai Blue" },
    { id: "team-korea", name: "South Korea", leagueId: "league-fifawc", city: "South Korea", abbreviation: "KOR", description: "Taegeuk Warriors" },
    { id: "team-colombia", name: "Colombia", leagueId: "league-fifawc", city: "Colombia", abbreviation: "COL", description: "Los Cafeteros" },
  ];
  await db.insert(teams).values(teamsData);

  // ─── Demo Users ─────────────────────────────────────────────────
  const userData = [
    { id: "user-1", username: "alex_fan", password: "demo123", displayName: "Alex Rivera", teamId: "team-rams", isAdmin: false },
    { id: "user-2", username: "sam_sports", password: "demo123", displayName: "Sam Chen", teamId: "team-dodgers", isAdmin: false },
    { id: "user-3", username: "jordan_hub", password: "demo123", displayName: "Jordan Taylor", teamId: "team-lafc", isAdmin: false },
    { id: "user-4", username: "casey_mod", password: "demo123", displayName: "Casey Morgan", teamId: "team-rams", isAdmin: true },
    { id: "user-5", username: "riley_cheers", password: "demo123", displayName: "Riley Park", teamId: "team-arsenal", isAdmin: false },
    { id: "user-6", username: "taylor_kicks", password: "demo123", displayName: "Taylor Reese", teamId: "team-usa", isAdmin: false },
    { id: "user-7", username: "drew_slam", password: "demo123", displayName: "Drew Martinez", teamId: "team-mexico", isAdmin: false },
    { id: "user-8", username: "morgan_puck", password: "demo123", displayName: "Morgan Shaw", teamId: "team-lagalaxy", isAdmin: false },
  ];
  await db.insert(users).values(userData);

  // ─── Venues (Greater Los Angeles, 50-mile radius) ──────────────
  const venueData = [
    // Santa Monica / Venice
    { id: "venue-1", name: "Ye Olde King's Head", description: "Legendary British pub in Santa Monica. The go-to for Premier League and FIFA watch parties since 1974.", address: "116 Santa Monica Blvd, Santa Monica, CA 90401", city: "Los Angeles", neighborhood: "Santa Monica", lat: 34.0153, lng: -118.4956, category: "Pub", verified: true, rating: 4.6, reviewCount: 28 },
    { id: "venue-2", name: "Hinano Cafe", description: "Venice Beach dive bar institution. Cold beer, burgers, and game-day energy right on the boardwalk.", address: "15 Washington Blvd, Venice, CA 90292", city: "Los Angeles", neighborhood: "Venice", lat: 33.9832, lng: -118.4694, category: "Bar", verified: true, rating: 4.3, reviewCount: 15 },
    { id: "venue-3", name: "The Galley", description: "Santa Monica seafood spot with big screens and a loyal game-day crowd. Great for NFL Sundays.", address: "2442 Main St, Santa Monica, CA 90405", city: "Los Angeles", neighborhood: "Santa Monica", lat: 34.0070, lng: -118.4917, category: "Restaurant", verified: true, rating: 4.4, reviewCount: 12 },
    // Hollywood / West Hollywood
    { id: "venue-4", name: "Barney's Beanery", description: "West Hollywood landmark since 1920. Over 60 TVs, 100+ beers, and a menu built for game day.", address: "8447 Santa Monica Blvd, West Hollywood, CA 90069", city: "Los Angeles", neighborhood: "West Hollywood", lat: 34.0900, lng: -118.3747, category: "Restaurant", verified: true, rating: 4.5, reviewCount: 32 },
    { id: "venue-5", name: "Rocco's Tavern", description: "WeHo sports bar with great wings, pitchers, and a packed house for every big game.", address: "8900 Santa Monica Blvd, West Hollywood, CA 90069", city: "Los Angeles", neighborhood: "West Hollywood", lat: 34.0900, lng: -118.3840, category: "Bar", verified: true, rating: 4.2, reviewCount: 18 },
    { id: "venue-6", name: "The Pikey", description: "Stylish Hollywood gastropub with craft cocktails and screens for major soccer and football matches.", address: "7617 Sunset Blvd, Los Angeles, CA 90046", city: "Los Angeles", neighborhood: "Hollywood", lat: 34.0978, lng: -118.3547, category: "Lounge", verified: false, rating: 4.1, reviewCount: 8 },
    // Downtown LA
    { id: "venue-7", name: "Tom's Watch Bar", description: "Downtown LA's ultimate sports destination across from LA Live. 120+ screens and multiple floors.", address: "1011 S Figueroa St, Los Angeles, CA 90015", city: "Los Angeles", neighborhood: "Downtown", lat: 34.0440, lng: -118.2657, category: "Bar", verified: true, rating: 4.7, reviewCount: 40 },
    { id: "venue-8", name: "The Escondite", description: "DTLA dive bar with strong drinks, a pool table, and big screens tucked under the 4th St bridge.", address: "410 Boyd St, Los Angeles, CA 90013", city: "Los Angeles", neighborhood: "Downtown", lat: 34.0425, lng: -118.2375, category: "Bar", verified: false, rating: 4.0, reviewCount: 6 },
    { id: "venue-9", name: "La Cita Bar", description: "Downtown dive bar with a Latin vibe. Packed for Liga MX, FIFA, and Mexican national team matches.", address: "336 S Hill St, Los Angeles, CA 90013", city: "Los Angeles", neighborhood: "Downtown", lat: 34.0487, lng: -118.2519, category: "Bar", verified: true, rating: 4.3, reviewCount: 14 },
    // Koreatown / Mid-Wilshire
    { id: "venue-10", name: "HMS Bounty", description: "Classic Mid-Wilshire cocktail lounge with old-school charm and big screens for Dodger games and more.", address: "3357 Wilshire Blvd, Los Angeles, CA 90010", city: "Los Angeles", neighborhood: "Koreatown", lat: 34.0618, lng: -118.3068, category: "Lounge", verified: true, rating: 4.2, reviewCount: 11 },
    { id: "venue-11", name: "The Prince", description: "Koreatown institution with red vinyl booths and great Korean fried chicken. A hidden gem for game watching.", address: "3198 W 7th St, Los Angeles, CA 90005", city: "Los Angeles", neighborhood: "Koreatown", lat: 34.0586, lng: -118.3035, category: "Restaurant", verified: false, rating: 4.4, reviewCount: 9 },
    // Pasadena / Eagle Rock
    { id: "venue-12", name: "Lucky Baldwin's Pub", description: "Pasadena's beloved British pub. The spot for Premier League morning matches and real ales.", address: "17 S Raymond Ave, Pasadena, CA 91105", city: "Los Angeles", neighborhood: "Pasadena", lat: 34.1459, lng: -118.1489, category: "Pub", verified: true, rating: 4.5, reviewCount: 22 },
    { id: "venue-13", name: "The 35er", description: "Old Pasadena dive bar with a Rose Bowl vibe. Cheap drinks and a USC/UCLA game-day crowd.", address: "12 E Colorado Blvd, Pasadena, CA 91105", city: "Los Angeles", neighborhood: "Pasadena", lat: 34.1459, lng: -118.1489, category: "Bar", verified: true, rating: 4.1, reviewCount: 16 },
    // Silver Lake / Echo Park / Los Feliz
    { id: "venue-14", name: "Red Lion Tavern", description: "German beer hall in Silver Lake. Great for international soccer, World Cup, and Bundesliga matches.", address: "2366 Glendale Blvd, Los Angeles, CA 90039", city: "Los Angeles", neighborhood: "Silver Lake", lat: 34.0905, lng: -118.2615, category: "Beer Garden", verified: true, rating: 4.6, reviewCount: 20 },
    { id: "venue-15", name: "The Thirsty Crow", description: "Cozy Silver Lake whiskey bar with screens for the big games. Great bourbon selection.", address: "2939 Sunset Blvd, Los Angeles, CA 90026", city: "Los Angeles", neighborhood: "Silver Lake", lat: 34.0813, lng: -118.2695, category: "Bar", verified: false, rating: 4.0, reviewCount: 5 },
    // Burbank / Glendale
    { id: "venue-16", name: "Tony's Darts Away", description: "All-California craft beer bar in Burbank. Great for game days with a laid-back neighborhood crowd.", address: "1710 W Magnolia Blvd, Burbank, CA 91506", city: "Los Angeles", neighborhood: "Burbank", lat: 34.1770, lng: -118.3267, category: "Bar", verified: true, rating: 4.3, reviewCount: 13 },
    { id: "venue-17", name: "Tinhorn Flats Saloon", description: "Rustic Burbank saloon with a massive patio, cold beers, and every game on the big screen.", address: "2623 W Magnolia Blvd, Burbank, CA 91505", city: "Los Angeles", neighborhood: "Burbank", lat: 34.1770, lng: -118.3390, category: "Bar", verified: false, rating: 4.0, reviewCount: 7 },
    // South Bay / Beach Cities
    { id: "venue-18", name: "Patrick Molloy's", description: "Hermosa Beach sports bar right on the pier. NFL Sundays with ocean breezes and cold drafts.", address: "50 Pier Ave, Hermosa Beach, CA 90254", city: "Los Angeles", neighborhood: "Hermosa Beach", lat: 33.8614, lng: -118.3986, category: "Bar", verified: true, rating: 4.4, reviewCount: 24 },
    { id: "venue-19", name: "Shellback Tavern", description: "Manhattan Beach classic with a lively game-day scene, great apps, and a surf-town vibe.", address: "116 Manhattan Beach Blvd, Manhattan Beach, CA 90266", city: "Los Angeles", neighborhood: "Manhattan Beach", lat: 33.8855, lng: -118.4095, category: "Bar", verified: true, rating: 4.5, reviewCount: 19 },
    // Long Beach
    { id: "venue-20", name: "The Auld Dubliner", description: "Irish pub in Long Beach with live music, big screens, and a proper match-day atmosphere.", address: "71 S Pine Ave, Long Beach, CA 90802", city: "Los Angeles", neighborhood: "Long Beach", lat: 33.7695, lng: -118.1899, category: "Pub", verified: true, rating: 4.3, reviewCount: 17 },
    // Culver City
    { id: "venue-21", name: "Rush Street", description: "Culver City cocktail bar and restaurant with great food, big screens, and a lively game-night crowd.", address: "9546 Washington Blvd, Culver City, CA 90232", city: "Los Angeles", neighborhood: "Culver City", lat: 34.0267, lng: -118.3943, category: "Restaurant", verified: true, rating: 4.2, reviewCount: 14 },
    // Inglewood (near SoFi)
    { id: "venue-22", name: "Brickhouse Kitchen & Bar", description: "Steps from SoFi Stadium. The pre-game and post-game headquarters for Rams and Chargers fans.", address: "131 N Market St, Inglewood, CA 90301", city: "Los Angeles", neighborhood: "Inglewood", lat: 33.9617, lng: -118.3526, category: "Restaurant", verified: true, rating: 4.4, reviewCount: 21 },
    // Boyle Heights / East LA
    { id: "venue-23", name: "La Numero Uno", description: "East LA cantina where every Liga MX and El Tri match is an event. Authentic food and passionate fans.", address: "3500 E 1st St, Los Angeles, CA 90063", city: "Los Angeles", neighborhood: "East LA", lat: 34.0378, lng: -118.1965, category: "Restaurant", verified: true, rating: 4.5, reviewCount: 16 },
    // North Hollywood / Studio City
    { id: "venue-24", name: "Pitfire Pizza", description: "Studio City pizzeria with craft beers and screens for every major game. Family-friendly game day.", address: "12222 Ventura Blvd, Studio City, CA 91604", city: "Los Angeles", neighborhood: "Studio City", lat: 34.1427, lng: -118.3950, category: "Pizzeria", verified: true, rating: 4.3, reviewCount: 10 },
    // El Segundo
    { id: "venue-25", name: "The Tavern on Main", description: "El Segundo neighborhood pub with a big beer list, great burgers, and a proper sports crowd.", address: "131 Main St, El Segundo, CA 90245", city: "Los Angeles", neighborhood: "El Segundo", lat: 33.9192, lng: -118.4165, category: "Pub", verified: true, rating: 4.2, reviewCount: 11 },
  ];
  await db.insert(venues).values(venueData);

  // ─── Venue-Team Affiliations ────────────────────────────────────
  const affiliationData = [
    // Santa Monica / Venice — Soccer + Football
    { venueId: "venue-1", teamId: "team-arsenal", isPrimary: true },
    { venueId: "venue-1", teamId: "team-liverpool", isPrimary: false },
    { venueId: "venue-1", teamId: "team-england", isPrimary: false },
    { venueId: "venue-1", teamId: "team-chelsea", isPrimary: false },
    { venueId: "venue-2", teamId: "team-rams", isPrimary: true },
    { venueId: "venue-2", teamId: "team-dodgers", isPrimary: false },
    { venueId: "venue-3", teamId: "team-rams", isPrimary: true },
    { venueId: "venue-3", teamId: "team-chargers", isPrimary: false },
    // Hollywood / WeHo — Multi-sport
    { venueId: "venue-4", teamId: "team-rams", isPrimary: true },
    { venueId: "venue-4", teamId: "team-dodgers", isPrimary: false },
    { venueId: "venue-4", teamId: "team-chargers", isPrimary: false },
    { venueId: "venue-4", teamId: "team-lakers", isPrimary: false },
    { venueId: "venue-4", teamId: "team-lafc", isPrimary: false },
    { venueId: "venue-5", teamId: "team-rams", isPrimary: true },
    { venueId: "venue-5", teamId: "team-chargers", isPrimary: false },
    { venueId: "venue-5", teamId: "team-lakers", isPrimary: false },
    { venueId: "venue-5", teamId: "team-lagalaxy", isPrimary: false },
    { venueId: "venue-6", teamId: "team-arsenal", isPrimary: true },
    { venueId: "venue-6", teamId: "team-lafc", isPrimary: false },
    // Downtown — Mixed (includes Lakers/Clippers near LA Live)
    { venueId: "venue-7", teamId: "team-rams", isPrimary: true },
    { venueId: "venue-7", teamId: "team-dodgers", isPrimary: false },
    { venueId: "venue-7", teamId: "team-chargers", isPrimary: false },
    { venueId: "venue-7", teamId: "team-lakers", isPrimary: false },
    { venueId: "venue-7", teamId: "team-clippers", isPrimary: false },
    { venueId: "venue-7", teamId: "team-lafc", isPrimary: false },
    { venueId: "venue-7", teamId: "team-usa", isPrimary: false },
    { venueId: "venue-8", teamId: "team-dodgers", isPrimary: true },
    { venueId: "venue-8", teamId: "team-lakers", isPrimary: false },
    { venueId: "venue-9", teamId: "team-mexico", isPrimary: true },
    { venueId: "venue-9", teamId: "team-chivas", isPrimary: false },
    { venueId: "venue-9", teamId: "team-america", isPrimary: false },
    // Koreatown — Korea + mixed (near Crypto.com Arena)
    { venueId: "venue-10", teamId: "team-lakers", isPrimary: true },
    { venueId: "venue-10", teamId: "team-dodgers", isPrimary: false },
    { venueId: "venue-10", teamId: "team-rams", isPrimary: false },
    { venueId: "venue-11", teamId: "team-korea", isPrimary: true },
    { venueId: "venue-11", teamId: "team-lakers", isPrimary: false },
    { venueId: "venue-11", teamId: "team-dodgers", isPrimary: false },
    // Pasadena — College + Football
    { venueId: "venue-12", teamId: "team-arsenal", isPrimary: true },
    { venueId: "venue-12", teamId: "team-liverpool", isPrimary: false },
    { venueId: "venue-12", teamId: "team-england", isPrimary: false },
    { venueId: "venue-13", teamId: "team-usc", isPrimary: true },
    { venueId: "venue-13", teamId: "team-ucla", isPrimary: false },
    { venueId: "venue-13", teamId: "team-rams", isPrimary: false },
    // Silver Lake — International soccer
    { venueId: "venue-14", teamId: "team-germany", isPrimary: true },
    { venueId: "venue-14", teamId: "team-barcelona", isPrimary: false },
    { venueId: "venue-14", teamId: "team-lafc", isPrimary: false },
    { venueId: "venue-15", teamId: "team-lafc", isPrimary: true },
    // Burbank — General
    { venueId: "venue-16", teamId: "team-rams", isPrimary: true },
    { venueId: "venue-16", teamId: "team-dodgers", isPrimary: false },
    { venueId: "venue-17", teamId: "team-chargers", isPrimary: true },
    { venueId: "venue-17", teamId: "team-rams", isPrimary: false },
    // Beach Cities — Football + Baseball
    { venueId: "venue-18", teamId: "team-rams", isPrimary: true },
    { venueId: "venue-18", teamId: "team-chargers", isPrimary: false },
    { venueId: "venue-18", teamId: "team-dodgers", isPrimary: false },
    { venueId: "venue-19", teamId: "team-dodgers", isPrimary: true },
    { venueId: "venue-19", teamId: "team-angels", isPrimary: false },
    { venueId: "venue-19", teamId: "team-rams", isPrimary: false },
    // Long Beach — Mixed
    { venueId: "venue-20", teamId: "team-lagalaxy", isPrimary: true },
    { venueId: "venue-20", teamId: "team-rams", isPrimary: false },
    // Culver City
    { venueId: "venue-21", teamId: "team-rams", isPrimary: true },
    { venueId: "venue-21", teamId: "team-dodgers", isPrimary: false },
    // Inglewood — Rams/Chargers home base
    { venueId: "venue-22", teamId: "team-rams", isPrimary: true },
    { venueId: "venue-22", teamId: "team-chargers", isPrimary: false },
    { venueId: "venue-22", teamId: "team-usa", isPrimary: false },
    // East LA — Liga MX + Mexico
    { venueId: "venue-23", teamId: "team-mexico", isPrimary: true },
    { venueId: "venue-23", teamId: "team-chivas", isPrimary: false },
    { venueId: "venue-23", teamId: "team-america", isPrimary: false },
    { venueId: "venue-23", teamId: "team-tigres", isPrimary: false },
    // Studio City
    { venueId: "venue-24", teamId: "team-dodgers", isPrimary: true },
    { venueId: "venue-24", teamId: "team-rams", isPrimary: false },
    // El Segundo
    { venueId: "venue-25", teamId: "team-chargers", isPrimary: true },
    { venueId: "venue-25", teamId: "team-lagalaxy", isPrimary: false },
  ];
  await db.insert(venueTeamAffiliations).values(affiliationData);

  // ─── Posts ──────────────────────────────────────────────────────
  const now = new Date();
  const postData = [
    { id: "post-1", userId: "user-1", teamId: "team-rams", content: "Rams game at Tom's Watch Bar was absolutely electric! Every screen locked in, the crowd was insane. Who else was there?", type: "post", createdAt: new Date(now.getTime() - 3600000) },
    { id: "post-2", userId: "user-2", teamId: "team-dodgers", content: "Found the best spot for Dodger games in Koreatown. HMS Bounty has that old-school vibe and the drinks are strong.", type: "post", createdAt: new Date(now.getTime() - 7200000) },
    { id: "post-3", userId: "user-3", teamId: "team-lafc", content: "LAFC watch party at Red Lion Tavern was incredible. German beer hall + soccer = perfection.", type: "post", createdAt: new Date(now.getTime() - 10800000) },
    { id: "post-4", userId: "user-5", teamId: "team-arsenal", content: "Any Arsenal fans in LA? Ye Olde King's Head in Santa Monica is our home. Early morning matches with proper English breakfast.", type: "post", createdAt: new Date(now.getTime() - 14400000) },
    { id: "post-5", userId: "user-7", teamId: "team-mexico", content: "La Cita Bar for every Mexico match. The energy when El Tri scores is unmatched anywhere in LA.", type: "post", createdAt: new Date(now.getTime() - 18000000) },
    { id: "post-6", userId: "user-6", teamId: "team-usa", content: "World Cup 2026 is coming to LA! Getting hyped. Tom's Watch Bar and Brickhouse are prepping already.", type: "post", createdAt: new Date(now.getTime() - 21600000) },
    { id: "post-7", userId: "user-4", teamId: "team-rams", content: "Pre-game at Brickhouse before the Rams game at SoFi. Best wings within walking distance of the stadium.", type: "post", createdAt: new Date(now.getTime() - 25200000) },
    { id: "post-8", userId: "user-8", teamId: "team-lagalaxy", content: "Galaxy game at The Auld Dubliner in Long Beach. Great Irish pub vibe and they show every MLS match.", type: "post", createdAt: new Date(now.getTime() - 28800000) },
    { id: "post-9", userId: "user-1", content: "Hot take: LA has the best sports bar scene in the country when you factor in the weather and the patio game.", type: "post", createdAt: new Date(now.getTime() - 32400000) },
    { id: "post-10", userId: "user-2", teamId: "team-dodgers", content: "Barney's Beanery for Dodger playoff games. 100+ beers and they actually turn the sound up.", type: "checkin", createdAt: new Date(now.getTime() - 36000000) },
  ];
  await db.insert(posts).values(postData);

  // ─── Comments ───────────────────────────────────────────────────
  const commentData = [
    { id: "comment-1", postId: "post-1", userId: "user-2", content: "Tom's is next level. Those screens are massive.", createdAt: new Date(now.getTime() - 3000000) },
    { id: "comment-2", postId: "post-1", userId: "user-4", content: "Was there too! Such a great crowd.", createdAt: new Date(now.getTime() - 2500000) },
    { id: "comment-3", postId: "post-4", userId: "user-3", content: "Lucky Baldwin's in Pasadena also shows early morning Premier League!", createdAt: new Date(now.getTime() - 13000000) },
    { id: "comment-4", postId: "post-5", userId: "user-6", content: "La Numero Uno in East LA is also incredible for El Tri games.", createdAt: new Date(now.getTime() - 15000000) },
    { id: "comment-5", postId: "post-6", userId: "user-7", content: "Can't wait for the World Cup! LA is going to be on fire.", createdAt: new Date(now.getTime() - 20000000) },
    { id: "comment-6", postId: "post-9", userId: "user-5", content: "The patio game is real. Patrick Molloy's ocean breeze hits different.", createdAt: new Date(now.getTime() - 30000000) },
  ];
  await db.insert(comments).values(commentData);

  // ─── Likes ──────────────────────────────────────────────────────
  const likeData = [
    { postId: "post-1", userId: "user-2" }, { postId: "post-1", userId: "user-3" }, { postId: "post-1", userId: "user-5" },
    { postId: "post-2", userId: "user-1" }, { postId: "post-3", userId: "user-1" }, { postId: "post-3", userId: "user-4" },
    { postId: "post-4", userId: "user-3" }, { postId: "post-5", userId: "user-1" }, { postId: "post-5", userId: "user-3" },
    { postId: "post-6", userId: "user-2" }, { postId: "post-6", userId: "user-4" }, { postId: "post-6", userId: "user-7" },
    { postId: "post-7", userId: "user-2" }, { postId: "post-8", userId: "user-1" }, { postId: "post-8", userId: "user-6" },
    { postId: "post-9", userId: "user-2" }, { postId: "post-9", userId: "user-5" }, { postId: "post-9", userId: "user-8" },
  ];
  await db.insert(likes).values(likeData);

  // ─── Events ─────────────────────────────────────────────────────
  const eventData = buildSeededEventData(now) as any[];
  await db.insert(events).values(withEventImages(eventData));

  // ─── Event Team Tags (multi-team per event) ─────────────────────
  const eventTeamData = eventData.flatMap(e => {
    const tags: { eventId: string; teamId: string }[] = [];
    if (e.teamId) tags.push({ eventId: e.id, teamId: e.teamId });
    if ((e as any).awayTeamId) tags.push({ eventId: e.id, teamId: (e as any).awayTeamId });
    return tags;
  });
  if (eventTeamData.length > 0) await db.insert(eventTeams).values(eventTeamData);

  // ─── Offers ─────────────────────────────────────────────────────
  const offerData = [
    { id: "offer-1", title: "Rams Game Day Happy Hour", description: "50% off all draft beers during any live Rams game broadcast.", venueId: "venue-7", teamId: "team-rams", sportId: "sport-football", discount: "50% off drafts", expiresAt: new Date(now.getTime() + 86400000 * 30), isActive: true },
    { id: "offer-2", title: "Dodger Dog & Draft Combo", description: "Dodger dog and a draft for $8 during any Dodger game.", venueId: "venue-4", teamId: "team-dodgers", sportId: "sport-baseball", discount: "$8 combo", expiresAt: new Date(now.getTime() + 86400000 * 30), isActive: true },
    { id: "offer-3", title: "Premier League Early Bird", description: "Free coffee or tea with any breakfast during morning Premier League matches.", venueId: "venue-1", sportId: "sport-soccer", discount: "Free coffee/tea", expiresAt: new Date(now.getTime() + 86400000 * 30), isActive: true },
    { id: "offer-4", title: "World Cup Watch Party Special", description: "Bucket of 5 beers for $20 during any FIFA World Cup match.", venueId: "venue-7", sportId: "sport-fifa", discount: "5 beers for $20", expiresAt: new Date(now.getTime() + 86400000 * 60), isActive: true },
    { id: "offer-5", title: "El Trafico Wing Deal", description: "Free wings with any pitcher during LAFC vs Galaxy matches.", venueId: "venue-14", teamId: "team-lafc", sportId: "sport-soccer", discount: "Free wings", expiresAt: new Date(now.getTime() + 86400000 * 21), isActive: true },
    { id: "offer-6", title: "SoFi Pre-Game Pitcher", description: "Buy one pitcher, get the second half off before any Rams or Chargers home game.", venueId: "venue-22", sportId: "sport-football", discount: "50% off 2nd pitcher", expiresAt: new Date(now.getTime() + 86400000 * 45), isActive: true },
    { id: "offer-7", title: "Liga MX Taco Tuesday", description: "Half-price tacos during any Liga MX match on Tuesday nights.", venueId: "venue-9", sportId: "sport-soccer", discount: "50% off tacos", expiresAt: new Date(now.getTime() + 86400000 * 30), isActive: true },
    { id: "offer-8", title: "Beach Cities NFL Sunday", description: "All-day happy hour pricing during NFL Sunday games.", venueId: "venue-18", sportId: "sport-football", discount: "All-day happy hour", expiresAt: new Date(now.getTime() + 86400000 * 30), isActive: true },
    { id: "offer-9", title: "First Timer Discount", description: "15% off your first visit to Lucky Baldwin's. Welcome to the pub!", venueId: "venue-12", sportId: "sport-soccer", discount: "15% off first visit", expiresAt: new Date(now.getTime() + 86400000 * 60), isActive: true },
    { id: "offer-10", title: "Korea vs Japan Watch Special", description: "Korean fried chicken platter for $12 during Korean national team matches.", venueId: "venue-11", teamId: "team-korea", sportId: "sport-fifa", discount: "$12 chicken platter", expiresAt: new Date(now.getTime() + 86400000 * 30), isActive: true },
    { id: "offer-11", title: "College Football Saturday", description: "20% off all food during college football Saturdays.", venueId: "venue-13", sportId: "sport-football", discount: "20% off food", expiresAt: new Date(now.getTime() + 86400000 * 60), isActive: true },
    { id: "offer-12", title: "Galaxy Game Night Pizza", description: "Large pizza for $10 during LA Galaxy home games.", venueId: "venue-20", teamId: "team-lagalaxy", sportId: "sport-soccer", discount: "$10 large pizza", expiresAt: new Date(now.getTime() + 86400000 * 30), isActive: true },
    { id: "offer-13", title: "Lakers Game Night Special", description: "Half-price appetizers during any Lakers game broadcast.", venueId: "venue-10", teamId: "team-lakers", sportId: "sport-basketball", discount: "50% off apps", expiresAt: new Date(now.getTime() + 86400000 * 30), isActive: true },
  ];
  await db.insert(offers).values(offerData);

  // ─── Community Rooms ────────────────────────────────────────────
  const roomData = [
    { id: "room-football", name: "Football Talk", description: "NFL, college football, and everything gridiron.", type: "sport", sportId: "sport-football", memberCount: 234 },
    { id: "room-soccer", name: "Soccer Talk", description: "MLS, Premier League, La Liga, Liga MX and more.", type: "sport", sportId: "sport-soccer", memberCount: 289 },
    { id: "room-baseball", name: "Baseball Talk", description: "MLB discussion and baseball culture.", type: "sport", sportId: "sport-baseball", memberCount: 156 },
    { id: "room-fifa", name: "World Cup 2026", description: "International football and World Cup 2026 hype.", type: "sport", sportId: "sport-fifa", memberCount: 345 },
    { id: "room-rams", name: "LA Rams Room", description: "Whose house? Rams house.", type: "team", sportId: "sport-football", leagueId: "league-nfl", teamId: "team-rams", memberCount: 456 },
    { id: "room-dodgers", name: "Dodgers Room", description: "Boys in Blue fan room.", type: "team", sportId: "sport-baseball", leagueId: "league-mlb", teamId: "team-dodgers", memberCount: 512 },
    { id: "room-lafc", name: "LAFC Room", description: "Black & Gold supporters room.", type: "team", sportId: "sport-soccer", leagueId: "league-mls", teamId: "team-lafc", memberCount: 278 },
    { id: "room-usmnt", name: "USMNT Room", description: "US Men's National Team. Road to 2026.", type: "team", sportId: "sport-fifa", leagueId: "league-fifawc", teamId: "team-usa", memberCount: 389 },
  ];
  await db.insert(communityRooms).values(roomData);

  // ─── Room Messages ──────────────────────────────────────────────
  const msgData = [
    { id: "rmsg-1", roomId: "room-rams", userId: "user-1", content: "Anyone heading to Tom's for the 49ers game Sunday?", createdAt: new Date(now.getTime() - 1800000) },
    { id: "rmsg-2", roomId: "room-rams", userId: "user-4", content: "Already got a table reserved. Drink specials start at noon!", createdAt: new Date(now.getTime() - 1500000) },
    { id: "rmsg-3", roomId: "room-dodgers", userId: "user-2", content: "Freeway Series this weekend. Where's everyone watching?", createdAt: new Date(now.getTime() - 3600000) },
    { id: "rmsg-4", roomId: "room-lafc", userId: "user-3", content: "El Trafico is going to be WILD this year.", createdAt: new Date(now.getTime() - 5400000) },
    { id: "rmsg-5", roomId: "room-usmnt", userId: "user-6", content: "World Cup 2026 in our backyard. This is our moment.", createdAt: new Date(now.getTime() - 7200000) },
    { id: "rmsg-6", roomId: "room-fifa", userId: "user-7", content: "Mexico vs USA at La Cita is going to be electric.", createdAt: new Date(now.getTime() - 10800000) },
  ];
  await db.insert(roomMessages).values(msgData);

  // ─── Reviews ────────────────────────────────────────────────────
  const reviewData = [
    { userId: "user-1", venueId: "venue-7", rating: 5, content: "Best sports bar in LA, hands down. 120+ screens and the energy is unreal on game day.", createdAt: new Date(now.getTime() - 86400000) },
    { userId: "user-2", venueId: "venue-4", rating: 4, content: "Barney's is a classic. Great beer selection and they show every game.", createdAt: new Date(now.getTime() - 172800000) },
    { userId: "user-5", venueId: "venue-1", rating: 5, content: "Best pub in LA for Premier League. Proper English atmosphere.", createdAt: new Date(now.getTime() - 259200000) },
    { userId: "user-7", venueId: "venue-9", rating: 5, content: "La Cita is the soul of Mexican soccer in LA. The atmosphere is incredible.", createdAt: new Date(now.getTime() - 345600000) },
    { userId: "user-3", venueId: "venue-14", rating: 4, content: "Red Lion is perfect for international soccer. German beer + football = heaven.", createdAt: new Date(now.getTime() - 432000000) },
    { userId: "user-4", venueId: "venue-22", rating: 4, content: "Can't beat the location. Walk to SoFi after your pre-game here.", createdAt: new Date(now.getTime() - 518400000) },
    { userId: "user-8", venueId: "venue-20", rating: 4, content: "Great Irish pub in Long Beach. Perfect for MLS matches.", createdAt: new Date(now.getTime() - 604800000) },
  ];
  await db.insert(reviews).values(reviewData);

  // ─── Check-ins ──────────────────────────────────────────────────
  const checkinData = [
    { userId: "user-1", venueId: "venue-7", createdAt: new Date(now.getTime() - 86400000) },
    { userId: "user-1", venueId: "venue-22", createdAt: new Date(now.getTime() - 172800000) },
    { userId: "user-2", venueId: "venue-4", createdAt: new Date(now.getTime() - 86400000) },
    { userId: "user-3", venueId: "venue-14", createdAt: new Date(now.getTime() - 43200000) },
    { userId: "user-5", venueId: "venue-1", createdAt: new Date(now.getTime() - 21600000) },
    { userId: "user-7", venueId: "venue-9", createdAt: new Date(now.getTime() - 129600000) },
    { userId: "user-6", venueId: "venue-7", createdAt: new Date(now.getTime() - 64800000) },
    { userId: "user-8", venueId: "venue-20", createdAt: new Date(now.getTime() - 172800000) },
  ];
  await db.insert(checkins).values(checkinData);

  console.log("Database seeded successfully with Greater Los Angeles data!");
}

// Idempotent image backfill so redesigned UI has a path to look up per-venue photos
async function refreshVenueImages() {
  await db.execute(sql`UPDATE venues SET image_url = '/venues/' || id || '.jpg' WHERE image_url IS NULL OR image_url = ''`);
}

// Idempotent sport name cleanup
async function refreshSportNames() {
  await db.execute(sql`UPDATE sports SET name = 'Football' WHERE id = 'sport-football' AND name <> 'Football'`);
  await db.execute(sql`UPDATE sports SET name = 'Soccer' WHERE id = 'sport-soccer' AND name <> 'Soccer'`);
}

// Re-seed demo events on every boot so dates/titles always look fresh.
// Only touches the canonical event-1..15 rows; user-created events (uuid ids) are preserved.
async function refreshEvents() {
  await db.delete(eventRsvps).where(inArray(eventRsvps.eventId, SEEDED_EVENT_IDS));
  await db.delete(eventTeams).where(inArray(eventTeams.eventId, SEEDED_EVENT_IDS));
  await db.delete(events).where(inArray(events.id, SEEDED_EVENT_IDS));
  const now = new Date();
  const eventData = buildSeededEventData(now) as any[];
  await db.insert(events).values(withEventImages(eventData));
  const eventTeamData = eventData.flatMap(e => {
    const tags: { eventId: string; teamId: string }[] = [];
    if (e.teamId) tags.push({ eventId: e.id, teamId: e.teamId });
    if (e.awayTeamId) tags.push({ eventId: e.id, teamId: e.awayTeamId });
    return tags;
  });
  if (eventTeamData.length > 0) await db.insert(eventTeams).values(eventTeamData);
}

// Idempotent additive column migrations — safe to run on every boot.
async function applyAdditiveMigrations() {
  await db.execute(sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE`);
  await db.execute(sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS host_user_id VARCHAR`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_business BOOLEAN DEFAULT FALSE`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS business_venue_id VARCHAR`);
}

// Push event cover images into already-seeded rows. Idempotent.
async function refreshEventImages() {
  for (const [id, url] of Object.entries(EVENT_IMAGES)) {
    await db.execute(sql`UPDATE events SET image_url = ${url} WHERE id = ${id}`);
  }
}
