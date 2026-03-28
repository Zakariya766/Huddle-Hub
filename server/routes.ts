import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { storage } from "./storage";
import { insertPostSchema, insertCommentSchema, insertReportSchema, insertMessageSchema, insertReviewSchema, insertRoomMessageSchema, insertEventSchema, insertOfferSchema, insertVenueSchema } from "@shared/schema";
import session from "express-session";
import { seedDatabase } from "./seed";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

function qs(val: unknown): string | undefined {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val[0] as string;
  return undefined;
}

function p(val: string | string[]): string {
  return Array.isArray(val) ? val[0] : val;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "thehuddle-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
    })
  );

  await seedDatabase();

  // ─── Auth ──────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    req.session.userId = user.id;
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/register", async (req, res) => {
    const { username, password, displayName, teamId } = req.body;
    const existing = await storage.getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ message: "Username already taken" });
    }
    const user = await storage.createUser({ username, password, displayName, teamId });
    req.session.userId = user.id;
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  // ─── Sports & Leagues ─────────────────────────────────────────
  app.get("/api/sports", async (_req, res) => {
    const allSports = await storage.getSports();
    res.json(allSports);
  });

  app.get("/api/sports/:id", async (req, res) => {
    const sport = await storage.getSport(p(req.params.id));
    if (!sport) return res.status(404).json({ message: "Sport not found" });
    res.json(sport);
  });

  app.get("/api/sports/slug/:slug", async (req, res) => {
    const sport = await storage.getSportBySlug(p(req.params.slug));
    if (!sport) return res.status(404).json({ message: "Sport not found" });
    res.json(sport);
  });

  app.get("/api/sports/:id/leagues", async (req, res) => {
    const sportLeagues = await storage.getLeagues(p(req.params.id));
    res.json(sportLeagues);
  });

  app.get("/api/leagues", async (req, res) => {
    const sportId = qs(req.query.sportId);
    const allLeagues = await storage.getLeagues(sportId);
    res.json(allLeagues);
  });

  app.get("/api/leagues/:id", async (req, res) => {
    const league = await storage.getLeague(p(req.params.id));
    if (!league) return res.status(404).json({ message: "League not found" });
    res.json(league);
  });

  app.get("/api/leagues/slug/:slug", async (req, res) => {
    const league = await storage.getLeagueBySlug(p(req.params.slug));
    if (!league) return res.status(404).json({ message: "League not found" });
    res.json(league);
  });

  app.get("/api/leagues/:id/teams", async (req, res) => {
    const leagueTeams = await storage.getTeams(p(req.params.id));
    res.json(leagueTeams);
  });

  // ─── Teams ─────────────────────────────────────────────────────
  app.get("/api/teams", async (req, res) => {
    const leagueId = qs(req.query.leagueId);
    const sportId = qs(req.query.sportId);
    const allTeams = await storage.getTeams(leagueId, sportId);
    res.json(allTeams);
  });

  app.get("/api/teams/:id", async (req, res) => {
    const team = await storage.getTeam(p(req.params.id));
    if (!team) return res.status(404).json({ message: "Team not found" });
    res.json(team);
  });

  // ─── Posts ─────────────────────────────────────────────────────
  app.get("/api/posts", async (req, res) => {
    const teamId = qs(req.query.teamId);
    const allPosts = await storage.getPosts(teamId);
    res.json(allPosts);
  });

  app.get("/api/posts/:id", async (req, res) => {
    const post = await storage.getPost(p(req.params.id));
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  });

  app.post("/api/posts", requireAuth, async (req, res) => {
    const parsed = insertPostSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid post data" });
    const post = await storage.createPost(req.session.userId!, parsed.data);
    res.json(post);
  });

  app.delete("/api/posts/:id", requireAuth, async (req, res) => {
    const post = await storage.getPost(p(req.params.id));
    if (!post) return res.status(404).json({ message: "Post not found" });
    const user = await storage.getUser(req.session.userId!);
    if (post.userId !== req.session.userId && !user?.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await storage.deletePost(p(req.params.id));
    res.json({ message: "Post deleted" });
  });

  // ─── Comments & Likes ─────────────────────────────────────────
  app.get("/api/posts/:id/comments", async (req, res) => {
    const allComments = await storage.getComments(p(req.params.id));
    res.json(allComments);
  });

  app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
    const parsed = insertCommentSchema.safeParse({ ...req.body, postId: p(req.params.id) });
    if (!parsed.success) return res.status(400).json({ message: "Invalid comment data" });
    const comment = await storage.createComment(req.session.userId!, parsed.data);
    res.json(comment);
  });

  app.delete("/api/comments/:commentId", requireAuth, async (req, res) => {
    await storage.deleteComment(p(req.params.commentId));
    res.json({ message: "Comment deleted" });
  });

  app.post("/api/posts/:id/like", requireAuth, async (req, res) => {
    const liked = await storage.toggleLike(p(req.params.id), req.session.userId!);
    res.json({ liked });
  });

  app.get("/api/likes", requireAuth, async (req, res) => {
    const userLikes = await storage.getUserLikes(req.session.userId!);
    res.json(userLikes);
  });

  // ─── Venues ────────────────────────────────────────────────────
  app.get("/api/venues", async (req, res) => {
    const filters = {
      teamId: qs(req.query.teamId),
      category: qs(req.query.category),
      sportId: qs(req.query.sportId),
      leagueId: qs(req.query.leagueId),
      city: qs(req.query.city),
      neighborhood: qs(req.query.neighborhood),
      verified: qs(req.query.verified) === "true" ? true : undefined,
    };
    const allVenues = await storage.getVenues(filters);
    res.json(allVenues);
  });

  app.get("/api/venues/:id", async (req, res) => {
    const venue = await storage.getVenue(p(req.params.id));
    if (!venue) return res.status(404).json({ message: "Venue not found" });
    res.json(venue);
  });

  app.get("/api/venues/:id/affiliations", async (req, res) => {
    const affs = await storage.getVenueAffiliations(p(req.params.id));
    res.json(affs);
  });

  app.get("/api/venues/:id/reviews", async (req, res) => {
    const venueReviews = await storage.getVenueReviews(p(req.params.id));
    res.json(venueReviews);
  });

  app.post("/api/venues/:id/reviews", requireAuth, async (req, res) => {
    const parsed = insertReviewSchema.safeParse({ ...req.body, venueId: p(req.params.id) });
    if (!parsed.success) return res.status(400).json({ message: "Invalid review data" });
    const review = await storage.createReview(req.session.userId!, parsed.data);
    res.json(review);
  });

  app.get("/api/venues/:id/checkins", async (req, res) => {
    const venueCheckins = await storage.getVenueCheckins(p(req.params.id));
    res.json(venueCheckins);
  });

  app.post("/api/venues/:id/checkin", requireAuth, async (req, res) => {
    const eventId = req.body.eventId as string;
    const checkin = await storage.createCheckin(req.session.userId!, p(req.params.id), eventId);
    res.json(checkin);
  });

  // ─── Events ────────────────────────────────────────────────────
  app.get("/api/events", async (req, res) => {
    const filters = {
      teamId: qs(req.query.teamId),
      sportId: qs(req.query.sportId),
      leagueId: qs(req.query.leagueId),
    };
    const allEvents = await storage.getEvents(filters);
    res.json(allEvents);
  });

  app.get("/api/events/:id", async (req, res) => {
    const event = await storage.getEvent(p(req.params.id));
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  });

  app.post("/api/events/:id/rsvp", requireAuth, async (req, res) => {
    const rsvpd = await storage.rsvpEvent(p(req.params.id), req.session.userId!);
    res.json({ rsvpd });
  });

  app.get("/api/events/:id/rsvps", async (req, res) => {
    const rsvps = await storage.getEventRsvps(p(req.params.id));
    res.json(rsvps);
  });

  // ─── Offers ────────────────────────────────────────────────────
  app.get("/api/offers", async (req, res) => {
    const filters = {
      teamId: qs(req.query.teamId),
      sportId: qs(req.query.sportId),
      venueId: qs(req.query.venueId),
    };
    const allOffers = await storage.getOffers(filters);
    res.json(allOffers);
  });

  app.get("/api/offers/:id", async (req, res) => {
    const offer = await storage.getOffer(p(req.params.id));
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    res.json(offer);
  });

  app.post("/api/offers/:id/claim", requireAuth, async (req, res) => {
    const claim = await storage.claimOffer(p(req.params.id), req.session.userId!);
    res.json(claim);
  });

  app.get("/api/claims", requireAuth, async (req, res) => {
    const claims = await storage.getUserClaims(req.session.userId!);
    res.json(claims);
  });

  app.get("/api/claims/code/:code", async (req, res) => {
    const claim = await storage.getClaimByCode(p(req.params.code));
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    res.json(claim);
  });

  app.post("/api/claims/:id/redeem", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user?.isAdmin) return res.status(403).json({ message: "Admin only" });
    const claim = await storage.redeemClaim(p(req.params.id));
    res.json(claim);
  });

  // ─── Community ─────────────────────────────────────────────────
  app.get("/api/community/rooms", async (req, res) => {
    const filters = {
      type: qs(req.query.type),
      sportId: qs(req.query.sportId),
      leagueId: qs(req.query.leagueId),
      teamId: qs(req.query.teamId),
    };
    const rooms = await storage.getCommunityRooms(filters);
    res.json(rooms);
  });

  app.get("/api/community/rooms/:id", async (req, res) => {
    const room = await storage.getCommunityRoom(p(req.params.id));
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  });

  app.get("/api/community/rooms/:id/messages", async (req, res) => {
    const msgs = await storage.getRoomMessages(p(req.params.id));
    res.json(msgs);
  });

  app.post("/api/community/rooms/:id/messages", requireAuth, async (req, res) => {
    const parsed = insertRoomMessageSchema.safeParse({ ...req.body, roomId: p(req.params.id) });
    if (!parsed.success) return res.status(400).json({ message: "Invalid message data" });
    const msg = await storage.createRoomMessage(req.session.userId!, parsed.data);
    res.json(msg);
  });

  app.post("/api/community/messages/:id/react", requireAuth, async (req, res) => {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: "Emoji required" });
    await storage.addReaction(req.session.userId!, p(req.params.id), emoji);
    res.json({ message: "Reaction added" });
  });

  app.delete("/api/community/messages/:id/react", requireAuth, async (req, res) => {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: "Emoji required" });
    await storage.removeReaction(req.session.userId!, p(req.params.id), emoji);
    res.json({ message: "Reaction removed" });
  });

  // ─── Reports ───────────────────────────────────────────────────
  app.post("/api/reports", requireAuth, async (req, res) => {
    const parsed = insertReportSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid report data" });
    const report = await storage.createReport(req.session.userId!, parsed.data);
    res.json(report);
  });

  app.get("/api/reports", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user?.isAdmin) return res.status(403).json({ message: "Admin only" });
    const allReports = await storage.getReports();
    res.json(allReports);
  });

  app.patch("/api/reports/:id", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user?.isAdmin) return res.status(403).json({ message: "Admin only" });
    const { status } = req.body;
    const updated = await storage.updateReportStatus(p(req.params.id), status);
    res.json(updated);
  });

  // ─── User Profiles ────────────────────────────────────────────
  app.get("/api/users/:id", async (req, res) => {
    const profile = await storage.getUserPublicProfile(p(req.params.id));
    if (!profile) return res.status(404).json({ message: "User not found" });
    res.json(profile);
  });

  // ─── DM Messaging ─────────────────────────────────────────────
  app.get("/api/messages/conversations", requireAuth, async (req, res) => {
    const conversations = await storage.getConversations(req.session.userId!);
    res.json(conversations);
  });

  app.get("/api/messages/unread-count", requireAuth, async (req, res) => {
    const count = await storage.getUnreadCount(req.session.userId!);
    res.json({ count });
  });

  app.get("/api/messages/:userId", requireAuth, async (req, res) => {
    const msgs = await storage.getMessages(req.session.userId!, p(req.params.userId));
    await storage.markMessagesRead(req.session.userId!, p(req.params.userId));
    res.json(msgs);
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    const parsed = insertMessageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid message data" });
    const msg = await storage.sendMessage(req.session.userId!, parsed.data);
    res.json(msg);
  });

  // ─── Admin ─────────────────────────────────────────────────────
  app.get("/api/admin/stats", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user?.isAdmin) return res.status(403).json({ message: "Admin only" });
    const stats = await storage.getAdminStats();
    res.json(stats);
  });

  app.get("/api/admin/users", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user?.isAdmin) return res.status(403).json({ message: "Admin only" });
    const allUsers = await storage.getAllUsers();
    res.json(allUsers);
  });

  app.patch("/api/admin/users/:id", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user?.isAdmin) return res.status(403).json({ message: "Admin only" });
    const updated = await storage.updateUser(p(req.params.id), req.body);
    res.json(updated);
  });

  app.post("/api/admin/venues", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user?.isAdmin) return res.status(403).json({ message: "Admin only" });
    const parsed = insertVenueSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid venue data" });
    const venue = await storage.createVenue(parsed.data);
    res.json(venue);
  });

  app.patch("/api/admin/venues/:id", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user?.isAdmin) return res.status(403).json({ message: "Admin only" });
    const venue = await storage.updateVenue(p(req.params.id), req.body);
    res.json(venue);
  });

  app.post("/api/admin/events", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user?.isAdmin) return res.status(403).json({ message: "Admin only" });
    const parsed = insertEventSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid event data" });
    const event = await storage.createEvent(parsed.data);
    res.json(event);
  });

  app.post("/api/admin/offers", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user?.isAdmin) return res.status(403).json({ message: "Admin only" });
    const parsed = insertOfferSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid offer data" });
    const offer = await storage.createOffer(parsed.data);
    res.json(offer);
  });

  // ─── Matches (read from ingested data) ───────────────────────
  app.get("/api/matches", async (req, res) => {
    const { matches: matchesTable } = await import("@shared/schema");
    const { desc, eq, and, gte, lte, or } = await import("drizzle-orm");

    let query = db.select().from(matchesTable);
    const conditions: any[] = [];

    const sportId = qs(req.query.sportId);
    const leagueId = qs(req.query.leagueId);
    const teamId = qs(req.query.teamId);
    const status = qs(req.query.status);
    const fromDate = qs(req.query.from);
    const toDate = qs(req.query.to);

    if (sportId) conditions.push(eq(matchesTable.sportId, sportId));
    if (leagueId) conditions.push(eq(matchesTable.leagueId, leagueId));
    if (teamId) {
      conditions.push(or(
        eq(matchesTable.homeTeamId, teamId),
        eq(matchesTable.awayTeamId, teamId)
      ));
    }
    if (status) conditions.push(eq(matchesTable.status, status));
    if (fromDate) conditions.push(gte(matchesTable.scheduledAt, new Date(fromDate)));
    if (toDate) conditions.push(lte(matchesTable.scheduledAt, new Date(toDate)));

    const result = conditions.length > 0
      ? await db.select().from(matchesTable).where(and(...conditions)).orderBy(matchesTable.scheduledAt).limit(100)
      : await db.select().from(matchesTable).orderBy(matchesTable.scheduledAt).limit(100);

    res.json(result);
  });

  // ─── Admin Ingestion ────────────────────────────────────────────
  app.post("/api/admin/ingestion/sync", requireAdmin, async (_req, res) => {
    try {
      const { syncAll } = await import("./ingestion/index");
      // Run sync in background, return immediately
      syncAll().catch(err => console.error("[ingestion] Sync error:", err.message));
      res.json({ message: "Sync started in background" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/ingestion/sync-sport", requireAdmin, async (req, res) => {
    const sport = req.body.sport;
    if (!sport) return res.status(400).json({ message: "sport is required" });
    try {
      const { syncSport } = await import("./ingestion/index");
      syncSport(sport).catch(err => console.error("[ingestion] Sync error:", err.message));
      res.json({ message: `Sync started for sport: ${sport}` });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/ingestion/runs", requireAdmin, async (_req, res) => {
    const { ingestionRuns } = await import("@shared/schema");
    const { desc } = await import("drizzle-orm");
    const runs = await db.select().from(ingestionRuns).orderBy(desc(ingestionRuns.startedAt)).limit(50);
    res.json(runs);
  });

  return httpServer;
}
