// Provider configuration and league mappings

export const PROVIDER_CONFIG = {
  sportradar: {
    baseUrl: "https://api.sportradar.com",
    nfl: {
      path: "/nfl/official/trial/v7/en",
      sportSlug: "football",
      leagueSlug: "nfl",
    },
    nba: {
      path: "/nba/trial/v8/en",
      sportSlug: "basketball",
      leagueSlug: "nba",
    },
  },
  mlb_stats: {
    baseUrl: "https://statsapi.mlb.com/api/v1",
    sportSlug: "baseball",
    leagueSlug: "mlb",
  },
  api_football: {
    baseUrl: "https://v3.football.api-sports.io",
    leagues: {
      // Premier League
      39: { sportSlug: "soccer", leagueSlug: "premier-league" },
      // La Liga
      140: { sportSlug: "soccer", leagueSlug: "la-liga" },
      // MLS
      253: { sportSlug: "soccer", leagueSlug: "mls" },
      // Liga MX
      262: { sportSlug: "soccer", leagueSlug: "liga-mx" },
      // FIFA World Cup
      1: { sportSlug: "fifa", leagueSlug: "fifa-world-cup" },
      // FIFA World Cup Qualifiers - CONCACAF
      31: { sportSlug: "fifa", leagueSlug: "fifa-world-cup" },
    } as Record<number, { sportSlug: string; leagueSlug: string }>,
  },
} as const;

// How many ms to wait between API calls to avoid rate limits
export const RATE_LIMIT_DELAY: Record<string, number> = {
  sportradar: 1100, // Sportradar free tier: 1 req/sec
  mlb_stats: 200,   // MLB Stats API is generous
  api_football: 350, // API-Football: ~10 req/min on free tier
};

// Map internal sport slugs to sport IDs (matches seed data)
export const SPORT_SLUG_TO_ID: Record<string, string> = {
  football: "sport-football",
  basketball: "sport-basketball",
  soccer: "sport-soccer",
  baseball: "sport-baseball",
  fifa: "sport-fifa",
};

// Map internal league slugs to league IDs (matches seed data)
export const LEAGUE_SLUG_TO_ID: Record<string, string> = {
  nfl: "league-nfl",
  "college-football": "league-cfb",
  nba: "league-nba",
  mls: "league-mls",
  "premier-league": "league-epl",
  "la-liga": "league-laliga",
  "liga-mx": "league-ligamx",
  mlb: "league-mlb",
  "fifa-world-cup": "league-fifawc",
  "fifa-womens-world-cup": "league-fifawwc",
};
