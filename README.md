# TheHuddle

A mobile-first web application for sports fans to connect with their community, discover local venues and events, and claim exclusive offers.

## Features

- **Chronological Feed** - Posts with likes, comments, and team tags in strict chronological order
- **Team Hubs** - Browse placeholder teams (Team Alpha through Team Echo) and view team-specific posts
- **Local Discovery** - Find venues and events with team/category filters, list view and map view
- **Offers** - Claim offers, generate QR codes and claim codes, admin-only redeem flow
- **Moderation** - Report posts, comments, and venues
- **Mobile-First UI** - Bottom navigation, responsive design optimized for mobile screens

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js with session-based authentication
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: wouter (client-side)

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret key for Express sessions |

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up a PostgreSQL database and set `DATABASE_URL` environment variable
4. Push the database schema:
   ```bash
   npm run db:push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

The app will start on port 5000, serving both the API and frontend.

## Demo Accounts

The database is seeded with demo data on first run:

| Username | Password | Role | Team |
|---|---|---|---|
| `alex_fan` | demo123 | User | Team Alpha |
| `sam_sports` | demo123 | User | Team Bravo |
| `jordan_hub` | demo123 | User | Team Charlie |
| `casey_mod` | demo123 | Admin | Team Alpha |
| `riley_cheers` | demo123 | User | Team Echo |

## API Endpoints

### Auth
- `POST /api/auth/login` - Sign in
- `POST /api/auth/register` - Create account
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Sign out

### Posts
- `GET /api/posts` - List posts (optional `?teamId=`)
- `POST /api/posts` - Create post (auth required)
- `DELETE /api/posts/:id` - Delete post (owner/admin)

### Comments
- `GET /api/posts/:id/comments` - List comments
- `POST /api/posts/:id/comments` - Add comment (auth required)

### Likes
- `POST /api/posts/:id/like` - Toggle like (auth required)
- `GET /api/likes` - Get user's liked post IDs

### Teams
- `GET /api/teams` - List all teams
- `GET /api/teams/:id` - Get team details

### Venues & Events
- `GET /api/venues` - List venues (optional `?teamId=`, `?category=`)
- `GET /api/events` - List events (optional `?teamId=`)

### Offers
- `GET /api/offers` - List offers
- `POST /api/offers/:id/claim` - Claim an offer (auth required)
- `GET /api/claims` - List user's claims
- `GET /api/claims/code/:code` - Look up claim by code
- `POST /api/claims/:id/redeem` - Redeem claim (admin only)

### Reports
- `POST /api/reports` - Submit a report (auth required)
- `GET /api/reports` - List all reports (admin only)

## Seed Data

The database is automatically seeded with:
- 5 placeholder teams
- 5 demo users
- 7 sample posts with comments and likes
- 5 venues across different categories
- 5 upcoming events
- 4 active offers
