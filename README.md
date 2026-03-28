# Huddle Hub

A multi-sport fan discovery and community platform. Find where fans watch the game.

Built for the **NFL Innovation Hub Challenge**.

## What It Does

Huddle Hub connects sports fans with venues, events, and each other. The core loop:

**Fan -> Discovers event or venue -> Claims offer -> Attends -> Redeems**

This is not Yelp. This is fan identity, sports discovery, and real-world engagement.

## Supported Sports

| Sport | Leagues |
|---|---|
| American Football | NFL, College Football |
| Basketball | NBA, College Basketball |
| Baseball | MLB |
| Hockey | NHL |
| Soccer | Premier League, La Liga, MLS |
| Mixed Martial Arts | UFC |
| Boxing | - |
| College Sports | CFB, CBB |

Teams are displayed as **text labels only** — no official logos, team colors, or copyrighted imagery.

## Features

- **Discovery** — Browse Sport -> League -> Team -> Venues with filters (category, neighborhood, verified, etc.)
- **Events** — Multi-sport watch parties, game nights, and more with RSVP
- **Offers** — Claim venue offers, get a code, redeem at the venue
- **Community** — Chat rooms organized by sport, league, team, venue, and event with reactions and threads
- **Latest Feed** — Strictly chronological social feed (ORDER BY created_at DESC, no algorithmic ranking)
- **Venue Profiles** — Reviews, check-ins, team affiliations, upcoming events, active offers
- **Admin Dashboard** — Stats, user management, report moderation
- **Multi-team venues** — Venues can be affiliated with multiple teams across sports

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query
- **Backend**: Express 5 with session-based authentication
- **Database**: PostgreSQL (Supabase) with Drizzle ORM
- **Routing**: wouter (client-side)
- **Maps**: Leaflet
- **Build**: Vite 7

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your-secret-key
```

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up a PostgreSQL database (we use Supabase) and add `DATABASE_URL` to `.env`
4. Push the database schema:
   ```bash
   npx drizzle-kit push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

The app will start on port 3000, serving both the API and frontend.

## Demo Accounts

The database is seeded automatically on first run with multi-sport data:

| Username | Password | Role | Team |
|---|---|---|---|
| `alex_fan` | demo123 | User | Chicago Bears |
| `sam_sports` | demo123 | User | Chicago Bulls |
| `jordan_hub` | demo123 | User | Chicago Cubs |
| `casey_mod` | demo123 | Admin | Chicago Bears |
| `riley_cheers` | demo123 | User | Manchester United |
| `taylor_kicks` | demo123 | User | Kansas City Chiefs |
| `drew_slam` | demo123 | User | Los Angeles Lakers |
| `morgan_puck` | demo123 | User | Chicago Blackhawks |

## Demo Data

The seed includes:
- 8 sports, 10 leagues, 35 teams across NFL, NBA, MLB, NHL, Premier League, La Liga, MLS, UFC, and college sports
- 25 real Chicago venues with addresses and coordinates
- 50+ venue-team affiliations (venues can show multiple sports/teams)
- 10 upcoming events across multiple sports
- 12 active offers tied to venues and sports
- 15 community rooms (by sport, league, team, and event)
- 10 posts, reviews, check-ins, and room messages

## Navigation

| Tab | Description |
|---|---|
| Discover | Sport -> League -> Team -> Venue drill-down |
| Events | Upcoming events with sport/league filters |
| Community | Chat rooms by sport, league, team, venue, event |
| Offers | Browse and claim venue offers |
| Profile | Account, messages, admin dashboard |

Additional routes: `/latest` (chronological feed), `/venues/:id` (venue detail), `/admin` (admin dashboard)

## Design

- Apple-like polish with sports playbook vibe
- Paper textures, rounded cards, pill buttons, clean typography
- iMessage-like chat bubbles in community rooms
- No team colors or logos — neutral design language
- Mobile-first responsive layout

## AI Disclosure

This project was developed with assistance from AI tools:
- Claude (Anthropic) was used for code generation, architecture planning, and implementation
- All code was reviewed and tested by the development team
- AI-generated code follows the same quality standards as human-written code

## API Endpoints

### Sports & Leagues
- `GET /api/sports` — List all sports
- `GET /api/leagues` — List leagues (optional `?sportId=`)
- `GET /api/teams` — List teams (optional `?leagueId=`, `?sportId=`)

### Venues
- `GET /api/venues` — List venues (filters: `teamId`, `sportId`, `leagueId`, `category`, `neighborhood`, `verified`)
- `GET /api/venues/:id/affiliations` — Team affiliations for a venue
- `GET /api/venues/:id/reviews` — Venue reviews
- `POST /api/venues/:id/reviews` — Write review (auth)
- `POST /api/venues/:id/checkin` — Check in (auth)

### Events
- `GET /api/events` — List events (filters: `teamId`, `sportId`, `leagueId`)
- `POST /api/events/:id/rsvp` — Toggle RSVP (auth)

### Offers
- `GET /api/offers` — List offers (filters: `teamId`, `sportId`, `venueId`)
- `POST /api/offers/:id/claim` — Claim offer (auth)
- `GET /api/claims` — User's claims (auth)
- `POST /api/claims/:id/redeem` — Redeem (admin)

### Community
- `GET /api/community/rooms` — List rooms (filters: `type`, `sportId`, `leagueId`, `teamId`)
- `GET /api/community/rooms/:id/messages` — Room messages
- `POST /api/community/rooms/:id/messages` — Send message (auth)
- `POST /api/community/messages/:id/react` — Add reaction (auth)

### Admin
- `GET /api/admin/stats` — Dashboard stats (admin)
- `GET /api/admin/users` — List users (admin)
- `PATCH /api/admin/users/:id` — Update user (admin)
- `POST /api/admin/venues` — Create venue (admin)
- `POST /api/admin/events` — Create event (admin)
- `POST /api/admin/offers` — Create offer (admin)
