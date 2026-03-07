import {
  type User, type InsertUser,
  type Team, type Post, type InsertPost,
  type Comment, type InsertComment,
  type Like, type Venue, type InsertVenue,
  type Event, type InsertEvent,
  type Offer, type InsertOffer,
  type OfferClaim, type Report, type InsertReport,
  users, teams, posts, comments, likes, venues, events, offers, offerClaims, reports,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getTeams(): Promise<Team[]>;
  getTeam(id: string): Promise<Team | undefined>;

  getPosts(teamId?: string): Promise<(Post & { user: User; likeCount: number; commentCount: number })[]>;
  getPost(id: string): Promise<(Post & { user: User; likeCount: number; commentCount: number }) | undefined>;
  createPost(userId: string, post: InsertPost): Promise<Post>;
  deletePost(id: string): Promise<void>;

  getComments(postId: string): Promise<(Comment & { user: User })[]>;
  createComment(userId: string, comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<void>;

  toggleLike(postId: string, userId: string): Promise<boolean>;
  getUserLikes(userId: string): Promise<string[]>;

  getVenues(teamId?: string, category?: string): Promise<Venue[]>;
  getVenue(id: string): Promise<Venue | undefined>;

  getEvents(teamId?: string): Promise<(Event & { venue?: Venue })[]>;
  getEvent(id: string): Promise<(Event & { venue?: Venue }) | undefined>;

  getOffers(teamId?: string): Promise<(Offer & { venue?: Venue })[]>;
  getOffer(id: string): Promise<(Offer & { venue?: Venue }) | undefined>;
  claimOffer(offerId: string, userId: string): Promise<OfferClaim>;
  getUserClaims(userId: string): Promise<(OfferClaim & { offer: Offer })[]>;
  redeemClaim(claimId: string): Promise<OfferClaim>;
  getClaimByCode(code: string): Promise<(OfferClaim & { offer: Offer; user: User }) | undefined>;

  createReport(reporterId: string, report: InsertReport): Promise<Report>;
  getReports(): Promise<Report[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getTeams(): Promise<Team[]> {
    return db.select().from(teams);
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getPosts(teamId?: string): Promise<(Post & { user: User; likeCount: number; commentCount: number })[]> {
    const conditions = teamId ? eq(posts.teamId, teamId) : undefined;
    const allPosts = conditions
      ? await db.select().from(posts).where(conditions).orderBy(desc(posts.createdAt))
      : await db.select().from(posts).orderBy(desc(posts.createdAt));

    const enriched = await Promise.all(allPosts.map(async (post) => {
      const [user] = await db.select().from(users).where(eq(users.id, post.userId));
      const likeRows = await db.select({ count: sql<number>`count(*)` }).from(likes).where(eq(likes.postId, post.id));
      const commentRows = await db.select({ count: sql<number>`count(*)` }).from(comments).where(eq(comments.postId, post.id));
      const { password: _, ...safeUser } = user!;
      return {
        ...post,
        user: safeUser as User,
        likeCount: Number(likeRows[0]?.count || 0),
        commentCount: Number(commentRows[0]?.count || 0),
      };
    }));
    return enriched;
  }

  async getPost(id: string): Promise<(Post & { user: User; likeCount: number; commentCount: number }) | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    if (!post) return undefined;
    const [user] = await db.select().from(users).where(eq(users.id, post.userId));
    const likeRows = await db.select({ count: sql<number>`count(*)` }).from(likes).where(eq(likes.postId, post.id));
    const commentRows = await db.select({ count: sql<number>`count(*)` }).from(comments).where(eq(comments.postId, post.id));
    const { password: _, ...safeUser } = user!;
    return {
      ...post,
      user: safeUser as User,
      likeCount: Number(likeRows[0]?.count || 0),
      commentCount: Number(commentRows[0]?.count || 0),
    };
  }

  async createPost(userId: string, post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values({ ...post, userId }).returning();
    return newPost;
  }

  async deletePost(id: string): Promise<void> {
    await db.delete(likes).where(eq(likes.postId, id));
    await db.delete(comments).where(eq(comments.postId, id));
    await db.delete(posts).where(eq(posts.id, id));
  }

  async getComments(postId: string): Promise<(Comment & { user: User })[]> {
    const allComments = await db.select().from(comments).where(eq(comments.postId, postId)).orderBy(desc(comments.createdAt));
    const enriched = await Promise.all(allComments.map(async (comment) => {
      const [user] = await db.select().from(users).where(eq(users.id, comment.userId));
      const { password: _, ...safeUser } = user!;
      return { ...comment, user: safeUser as User };
    }));
    return enriched;
  }

  async createComment(userId: string, comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values({ ...comment, userId }).returning();
    return newComment;
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  async toggleLike(postId: string, userId: string): Promise<boolean> {
    const existing = await db.select().from(likes).where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
    if (existing.length > 0) {
      await db.delete(likes).where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
      return false;
    }
    await db.insert(likes).values({ postId, userId });
    return true;
  }

  async getUserLikes(userId: string): Promise<string[]> {
    const rows = await db.select({ postId: likes.postId }).from(likes).where(eq(likes.userId, userId));
    return rows.map(r => r.postId);
  }

  async getVenues(teamId?: string, category?: string): Promise<Venue[]> {
    let conditions: any[] = [];
    if (teamId) conditions.push(eq(venues.teamId, teamId));
    if (category) conditions.push(eq(venues.category, category));

    if (conditions.length === 0) return db.select().from(venues);
    if (conditions.length === 1) return db.select().from(venues).where(conditions[0]);
    return db.select().from(venues).where(and(...conditions));
  }

  async getVenue(id: string): Promise<Venue | undefined> {
    const [venue] = await db.select().from(venues).where(eq(venues.id, id));
    return venue;
  }

  async getEvents(teamId?: string): Promise<(Event & { venue?: Venue })[]> {
    const conditions = teamId ? eq(events.teamId, teamId) : undefined;
    const allEvents = conditions
      ? await db.select().from(events).where(conditions).orderBy(desc(events.date))
      : await db.select().from(events).orderBy(desc(events.date));

    const enriched = await Promise.all(allEvents.map(async (event) => {
      let venue: Venue | undefined;
      if (event.venueId) {
        const [v] = await db.select().from(venues).where(eq(venues.id, event.venueId));
        venue = v;
      }
      return { ...event, venue };
    }));
    return enriched;
  }

  async getEvent(id: string): Promise<(Event & { venue?: Venue }) | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (!event) return undefined;
    let venue: Venue | undefined;
    if (event.venueId) {
      const [v] = await db.select().from(venues).where(eq(venues.id, event.venueId));
      venue = v;
    }
    return { ...event, venue };
  }

  async getOffers(teamId?: string): Promise<(Offer & { venue?: Venue })[]> {
    const conditions = teamId ? eq(offers.teamId, teamId) : undefined;
    const allOffers = conditions
      ? await db.select().from(offers).where(conditions)
      : await db.select().from(offers);

    const enriched = await Promise.all(allOffers.map(async (offer) => {
      let venue: Venue | undefined;
      if (offer.venueId) {
        const [v] = await db.select().from(venues).where(eq(venues.id, offer.venueId));
        venue = v;
      }
      return { ...offer, venue };
    }));
    return enriched;
  }

  async getOffer(id: string): Promise<(Offer & { venue?: Venue }) | undefined> {
    const [offer] = await db.select().from(offers).where(eq(offers.id, id));
    if (!offer) return undefined;
    let venue: Venue | undefined;
    if (offer.venueId) {
      const [v] = await db.select().from(venues).where(eq(venues.id, offer.venueId));
      venue = v;
    }
    return { ...offer, venue };
  }

  async claimOffer(offerId: string, userId: string): Promise<OfferClaim> {
    const claimCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const [claim] = await db.insert(offerClaims).values({ offerId, userId, claimCode }).returning();
    return claim;
  }

  async getUserClaims(userId: string): Promise<(OfferClaim & { offer: Offer })[]> {
    const allClaims = await db.select().from(offerClaims).where(eq(offerClaims.userId, userId)).orderBy(desc(offerClaims.createdAt));
    const enriched = await Promise.all(allClaims.map(async (claim) => {
      const [offer] = await db.select().from(offers).where(eq(offers.id, claim.offerId));
      return { ...claim, offer: offer! };
    }));
    return enriched;
  }

  async redeemClaim(claimId: string): Promise<OfferClaim> {
    const [claim] = await db.update(offerClaims)
      .set({ redeemed: true, redeemedAt: new Date() })
      .where(eq(offerClaims.id, claimId))
      .returning();
    return claim;
  }

  async getClaimByCode(code: string): Promise<(OfferClaim & { offer: Offer; user: User }) | undefined> {
    const [claim] = await db.select().from(offerClaims).where(eq(offerClaims.claimCode, code));
    if (!claim) return undefined;
    const [offer] = await db.select().from(offers).where(eq(offers.id, claim.offerId));
    const [user] = await db.select().from(users).where(eq(users.id, claim.userId));
    const { password: _, ...safeUser } = user!;
    return { ...claim, offer: offer!, user: safeUser as User };
  }

  async createReport(reporterId: string, report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values({ ...report, reporterId }).returning();
    return newReport;
  }

  async getReports(): Promise<Report[]> {
    return db.select().from(reports).orderBy(desc(reports.createdAt));
  }
}

export const storage = new DatabaseStorage();
