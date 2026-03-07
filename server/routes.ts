import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPostSchema, insertCommentSchema, insertReportSchema } from "@shared/schema";
import session from "express-session";
import { seedDatabase } from "./seed";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
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

  app.get("/api/teams", async (_req, res) => {
    const allTeams = await storage.getTeams();
    res.json(allTeams);
  });

  app.get("/api/teams/:id", async (req, res) => {
    const team = await storage.getTeam(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    res.json(team);
  });

  app.get("/api/posts", async (req, res) => {
    const teamId = req.query.teamId as string | undefined;
    const allPosts = await storage.getPosts(teamId);
    res.json(allPosts);
  });

  app.get("/api/posts/:id", async (req, res) => {
    const post = await storage.getPost(req.params.id);
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
    const post = await storage.getPost(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const user = await storage.getUser(req.session.userId!);
    if (post.userId !== req.session.userId && !user?.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await storage.deletePost(req.params.id);
    res.json({ message: "Post deleted" });
  });

  app.get("/api/posts/:id/comments", async (req, res) => {
    const allComments = await storage.getComments(req.params.id);
    res.json(allComments);
  });

  app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
    const parsed = insertCommentSchema.safeParse({ ...req.body, postId: req.params.id });
    if (!parsed.success) return res.status(400).json({ message: "Invalid comment data" });
    const comment = await storage.createComment(req.session.userId!, parsed.data);
    res.json(comment);
  });

  app.delete("/api/comments/:commentId", requireAuth, async (req, res) => {
    await storage.deleteComment(req.params.commentId);
    res.json({ message: "Comment deleted" });
  });

  app.post("/api/posts/:id/like", requireAuth, async (req, res) => {
    const liked = await storage.toggleLike(req.params.id, req.session.userId!);
    res.json({ liked });
  });

  app.get("/api/likes", requireAuth, async (req, res) => {
    const userLikes = await storage.getUserLikes(req.session.userId!);
    res.json(userLikes);
  });

  app.get("/api/venues", async (req, res) => {
    const teamId = req.query.teamId as string | undefined;
    const category = req.query.category as string | undefined;
    const allVenues = await storage.getVenues(teamId, category);
    res.json(allVenues);
  });

  app.get("/api/venues/:id", async (req, res) => {
    const venue = await storage.getVenue(req.params.id);
    if (!venue) return res.status(404).json({ message: "Venue not found" });
    res.json(venue);
  });

  app.get("/api/events", async (req, res) => {
    const teamId = req.query.teamId as string | undefined;
    const allEvents = await storage.getEvents(teamId);
    res.json(allEvents);
  });

  app.get("/api/events/:id", async (req, res) => {
    const event = await storage.getEvent(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  });

  app.get("/api/offers", async (req, res) => {
    const teamId = req.query.teamId as string | undefined;
    const allOffers = await storage.getOffers(teamId);
    res.json(allOffers);
  });

  app.get("/api/offers/:id", async (req, res) => {
    const offer = await storage.getOffer(req.params.id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    res.json(offer);
  });

  app.post("/api/offers/:id/claim", requireAuth, async (req, res) => {
    const claim = await storage.claimOffer(req.params.id, req.session.userId!);
    res.json(claim);
  });

  app.get("/api/claims", requireAuth, async (req, res) => {
    const claims = await storage.getUserClaims(req.session.userId!);
    res.json(claims);
  });

  app.get("/api/claims/code/:code", async (req, res) => {
    const claim = await storage.getClaimByCode(req.params.code);
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    res.json(claim);
  });

  app.post("/api/claims/:id/redeem", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user?.isAdmin) return res.status(403).json({ message: "Admin only" });
    const claim = await storage.redeemClaim(req.params.id);
    res.json(claim);
  });

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

  return httpServer;
}
