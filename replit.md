# TheHuddle - Sports Fan Community App

## Overview
Mobile-first web application for sports fans to connect, discover local venues/events, and claim exclusive offers. Built with Express + Vite + React.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui, using wouter for routing
- **Backend**: Express.js with session-based auth
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Mobile-first responsive design

## Key Features
1. **Feed**: Chronological posts with likes, comments, team tags
2. **Team Hubs**: Browse teams, view team-specific posts
3. **Discover**: Venues + Events with team/category filters, list/map views
4. **Offers**: Claim offers, get codes, admin redeem flow
5. **Moderation**: Report posts, comments, venues
6. **Auth**: Session-based login/register with demo accounts

## File Structure
- `shared/schema.ts` - Data models (users, teams, posts, comments, likes, venues, events, offers, reports)
- `server/db.ts` - PostgreSQL connection
- `server/storage.ts` - Database CRUD operations
- `server/routes.ts` - API endpoints with session auth
- `server/seed.ts` - Demo data seeding
- `client/src/App.tsx` - Router + providers
- `client/src/lib/auth.tsx` - Auth context/provider
- `client/src/components/` - Reusable components (bottom-nav, post-card, comment-section, create-post, report-dialog)
- `client/src/pages/` - Feed, Teams, TeamHub, Discover, Offers, Profile

## Demo Accounts
- `alex_fan` / demo123 (Team Alpha fan)
- `sam_sports` / demo123 (Team Bravo fan)
- `casey_mod` / demo123 (Admin, Team Alpha)

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session secret
