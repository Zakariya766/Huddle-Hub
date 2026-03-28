import {
  type User, type InsertUser,
  type Sport, type League,
  type Team, type Post, type InsertPost,
  type Comment, type InsertComment,
  type Like, type Venue, type InsertVenue, type VenueTeamAffiliation,
  type Event, type InsertEvent, type EventRsvp,
  type Offer, type InsertOffer,
  type OfferClaim, type Report, type InsertReport,
  type Message, type InsertMessage,
  type Review, type InsertReview,
  type Checkin,
  type CommunityRoom, type RoomMessage, type InsertRoomMessage, type RoomMessageReaction,
  users, sports, leagues, teams, posts, comments, likes,
  venues, venueTeamAffiliations, events, eventRsvps,
  offers, offerClaims, reports, messages,
  reviews, checkins,
  communityRooms, roomMessages, roomMessageReactions,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Sports hierarchy
  getSports(): Promise<Sport[]>;
  getSport(id: string): Promise<Sport | undefined>;
  getSportBySlug(slug: string): Promise<Sport | undefined>;
  getLeagues(sportId?: string): Promise<League[]>;
  getLeague(id: string): Promise<League | undefined>;
  getLeagueBySlug(slug: string): Promise<League | undefined>;

  // Teams
  getTeams(leagueId?: string, sportId?: string): Promise<Team[]>;
  getTeam(id: string): Promise<Team | undefined>;

  // Posts
  getPosts(teamId?: string): Promise<(Post & { user: User; likeCount: number; commentCount: number })[]>;
  getPost(id: string): Promise<(Post & { user: User; likeCount: number; commentCount: number }) | undefined>;
  createPost(userId: string, post: InsertPost): Promise<Post>;
  deletePost(id: string): Promise<void>;

  // Comments & Likes
  getComments(postId: string): Promise<(Comment & { user: User })[]>;
  createComment(userId: string, comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
  toggleLike(postId: string, userId: string): Promise<boolean>;
  getUserLikes(userId: string): Promise<string[]>;

  // Venues
  getVenues(filters?: { teamId?: string; category?: string; sportId?: string; leagueId?: string; city?: string; neighborhood?: string; verified?: boolean; hasEvents?: boolean; hasOffers?: boolean }): Promise<Venue[]>;
  getVenue(id: string): Promise<Venue | undefined>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: string, data: Partial<InsertVenue>): Promise<Venue>;
  getVenueAffiliations(venueId: string): Promise<(VenueTeamAffiliation & { team: Team })[]>;
  getVenuesByTeam(teamId: string): Promise<Venue[]>;

  // Events
  getEvents(filters?: { teamId?: string; sportId?: string; leagueId?: string }): Promise<(Event & { venue?: Venue; homeTeam?: Team; awayTeam?: Team })[]>;
  getEvent(id: string): Promise<(Event & { venue?: Venue; homeTeam?: Team; awayTeam?: Team }) | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  rsvpEvent(eventId: string, userId: string): Promise<boolean>;
  getEventRsvps(eventId: string): Promise<string[]>;

  // Offers
  getOffers(filters?: { teamId?: string; sportId?: string; venueId?: string }): Promise<(Offer & { venue?: Venue })[]>;
  getOffer(id: string): Promise<(Offer & { venue?: Venue }) | undefined>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  claimOffer(offerId: string, userId: string): Promise<OfferClaim>;
  getUserClaims(userId: string): Promise<(OfferClaim & { offer: Offer })[]>;
  redeemClaim(claimId: string): Promise<OfferClaim>;
  getClaimByCode(code: string): Promise<(OfferClaim & { offer: Offer; user: User }) | undefined>;

  // Reviews & Checkins
  getVenueReviews(venueId: string): Promise<(Review & { user: User })[]>;
  createReview(userId: string, review: InsertReview): Promise<Review>;
  getVenueCheckins(venueId: string): Promise<(Checkin & { user: User })[]>;
  createCheckin(userId: string, venueId: string, eventId?: string): Promise<Checkin>;

  // Community
  getCommunityRooms(filters?: { type?: string; sportId?: string; leagueId?: string; teamId?: string }): Promise<CommunityRoom[]>;
  getCommunityRoom(id: string): Promise<CommunityRoom | undefined>;
  getRoomMessages(roomId: string): Promise<(RoomMessage & { user: User; reactions: RoomMessageReaction[] })[]>;
  createRoomMessage(userId: string, message: InsertRoomMessage): Promise<RoomMessage>;
  addReaction(userId: string, messageId: string, emoji: string): Promise<void>;
  removeReaction(userId: string, messageId: string, emoji: string): Promise<void>;

  // Reports
  createReport(reporterId: string, report: InsertReport): Promise<Report>;
  getReports(): Promise<Report[]>;
  updateReportStatus(id: string, status: string): Promise<Report>;

  // DM Messages
  getConversations(userId: string): Promise<{ user: User; lastMessage: Message; unreadCount: number }[]>;
  getMessages(userId: string, otherUserId: string): Promise<(Message & { sender: User })[]>;
  sendMessage(senderId: string, message: InsertMessage): Promise<Message>;
  markMessagesRead(userId: string, otherUserId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;

  // Profiles
  getUserPublicProfile(userId: string): Promise<(User & { team?: Team; postCount: number }) | undefined>;

  // Admin
  getAdminStats(): Promise<{ users: number; posts: number; venues: number; events: number; offers: number; claims: number; reports: number; rooms: number }>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<{ isAdmin: boolean; displayName: string }>): Promise<User>;
}

function safeUser(user: User): User {
  const { password: _, ...safe } = user;
  return safe as User;
}

export class DatabaseStorage implements IStorage {
  // ─── Auth ───────────────────────────────────────────────────────
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

  // ─── Sports Hierarchy ──────────────────────────────────────────
  async getSports(): Promise<Sport[]> {
    return db.select().from(sports);
  }

  async getSport(id: string): Promise<Sport | undefined> {
    const [sport] = await db.select().from(sports).where(eq(sports.id, id));
    return sport;
  }

  async getSportBySlug(slug: string): Promise<Sport | undefined> {
    const [sport] = await db.select().from(sports).where(eq(sports.slug, slug));
    return sport;
  }

  async getLeagues(sportId?: string): Promise<League[]> {
    if (sportId) {
      return db.select().from(leagues).where(eq(leagues.sportId, sportId));
    }
    return db.select().from(leagues);
  }

  async getLeague(id: string): Promise<League | undefined> {
    const [league] = await db.select().from(leagues).where(eq(leagues.id, id));
    return league;
  }

  async getLeagueBySlug(slug: string): Promise<League | undefined> {
    const [league] = await db.select().from(leagues).where(eq(leagues.slug, slug));
    return league;
  }

  // ─── Teams ─────────────────────────────────────────────────────
  async getTeams(leagueId?: string, sportId?: string): Promise<Team[]> {
    if (leagueId) {
      return db.select().from(teams).where(eq(teams.leagueId, leagueId));
    }
    if (sportId) {
      const sportLeagues = await db.select().from(leagues).where(eq(leagues.sportId, sportId));
      const leagueIds = sportLeagues.map(l => l.id);
      if (leagueIds.length === 0) return [];
      return db.select().from(teams).where(inArray(teams.leagueId, leagueIds));
    }
    return db.select().from(teams);
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  // ─── Posts ─────────────────────────────────────────────────────
  async getPosts(teamId?: string): Promise<(Post & { user: User; likeCount: number; commentCount: number })[]> {
    const conditions = teamId ? eq(posts.teamId, teamId) : undefined;
    const allPosts = conditions
      ? await db.select().from(posts).where(conditions).orderBy(desc(posts.createdAt))
      : await db.select().from(posts).orderBy(desc(posts.createdAt));

    const enriched = await Promise.all(allPosts.map(async (post) => {
      const [user] = await db.select().from(users).where(eq(users.id, post.userId));
      const likeRows = await db.select({ count: sql<number>`count(*)` }).from(likes).where(eq(likes.postId, post.id));
      const commentRows = await db.select({ count: sql<number>`count(*)` }).from(comments).where(eq(comments.postId, post.id));
      return {
        ...post,
        user: safeUser(user!),
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
    return {
      ...post,
      user: safeUser(user!),
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

  // ─── Comments & Likes ─────────────────────────────────────────
  async getComments(postId: string): Promise<(Comment & { user: User })[]> {
    const allComments = await db.select().from(comments).where(eq(comments.postId, postId)).orderBy(desc(comments.createdAt));
    const enriched = await Promise.all(allComments.map(async (comment) => {
      const [user] = await db.select().from(users).where(eq(users.id, comment.userId));
      return { ...comment, user: safeUser(user!) };
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

  // ─── Venues ────────────────────────────────────────────────────
  async getVenues(filters?: { teamId?: string; category?: string; sportId?: string; leagueId?: string; city?: string; neighborhood?: string; verified?: boolean; hasEvents?: boolean; hasOffers?: boolean }): Promise<Venue[]> {
    if (filters?.teamId) {
      // Get venues via affiliation
      const affs = await db.select().from(venueTeamAffiliations).where(eq(venueTeamAffiliations.teamId, filters.teamId));
      if (affs.length === 0) return [];
      const venueIds = affs.map(a => a.venueId);
      let result = await db.select().from(venues).where(inArray(venues.id, venueIds));
      if (filters.category) result = result.filter(v => v.category === filters.category);
      if (filters.city) result = result.filter(v => v.city === filters.city);
      if (filters.neighborhood) result = result.filter(v => v.neighborhood === filters.neighborhood);
      if (filters.verified) result = result.filter(v => v.verified);
      return result;
    }

    if (filters?.sportId || filters?.leagueId) {
      // Get teams for sport/league, then venues via affiliations
      let teamIds: string[] = [];
      if (filters.leagueId) {
        const leagueTeams = await db.select().from(teams).where(eq(teams.leagueId, filters.leagueId));
        teamIds = leagueTeams.map(t => t.id);
      } else if (filters.sportId) {
        const sportLeagues = await db.select().from(leagues).where(eq(leagues.sportId, filters.sportId));
        const leagueIds = sportLeagues.map(l => l.id);
        if (leagueIds.length > 0) {
          const sportTeams = await db.select().from(teams).where(inArray(teams.leagueId, leagueIds));
          teamIds = sportTeams.map(t => t.id);
        }
      }
      if (teamIds.length === 0) return [];
      const affs = await db.select().from(venueTeamAffiliations).where(inArray(venueTeamAffiliations.teamId, teamIds));
      const venueIds = Array.from(new Set(affs.map(a => a.venueId)));
      if (venueIds.length === 0) return [];
      let result = await db.select().from(venues).where(inArray(venues.id, venueIds));
      if (filters?.category) result = result.filter(v => v.category === filters.category);
      if (filters?.city) result = result.filter(v => v.city === filters.city);
      if (filters?.neighborhood) result = result.filter(v => v.neighborhood === filters.neighborhood);
      if (filters?.verified) result = result.filter(v => v.verified);
      return result;
    }

    let conditions: any[] = [];
    if (filters?.category) conditions.push(eq(venues.category, filters.category));
    if (filters?.city) conditions.push(eq(venues.city, filters.city));
    if (filters?.neighborhood) conditions.push(eq(venues.neighborhood, filters.neighborhood));
    if (filters?.verified) conditions.push(eq(venues.verified, true));

    if (conditions.length === 0) return db.select().from(venues);
    if (conditions.length === 1) return db.select().from(venues).where(conditions[0]);
    return db.select().from(venues).where(and(...conditions));
  }

  async getVenue(id: string): Promise<Venue | undefined> {
    const [venue] = await db.select().from(venues).where(eq(venues.id, id));
    return venue;
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const [newVenue] = await db.insert(venues).values(venue).returning();
    return newVenue;
  }

  async updateVenue(id: string, data: Partial<InsertVenue>): Promise<Venue> {
    const [updated] = await db.update(venues).set(data).where(eq(venues.id, id)).returning();
    return updated;
  }

  async getVenueAffiliations(venueId: string): Promise<(VenueTeamAffiliation & { team: Team })[]> {
    const affs = await db.select().from(venueTeamAffiliations).where(eq(venueTeamAffiliations.venueId, venueId));
    const enriched = await Promise.all(affs.map(async (aff) => {
      const [team] = await db.select().from(teams).where(eq(teams.id, aff.teamId));
      return { ...aff, team: team! };
    }));
    return enriched;
  }

  async getVenuesByTeam(teamId: string): Promise<Venue[]> {
    const affs = await db.select().from(venueTeamAffiliations).where(eq(venueTeamAffiliations.teamId, teamId));
    if (affs.length === 0) return [];
    const venueIds = affs.map(a => a.venueId);
    return db.select().from(venues).where(inArray(venues.id, venueIds));
  }

  // ─── Events ────────────────────────────────────────────────────
  async getEvents(filters?: { teamId?: string; sportId?: string; leagueId?: string }): Promise<(Event & { venue?: Venue; homeTeam?: Team; awayTeam?: Team })[]> {
    let conditions: any = undefined;
    if (filters?.teamId) {
      conditions = sql`${events.teamId} = ${filters.teamId} OR ${events.awayTeamId} = ${filters.teamId}`;
    } else if (filters?.leagueId) {
      conditions = eq(events.leagueId, filters.leagueId);
    } else if (filters?.sportId) {
      conditions = eq(events.sportId, filters.sportId);
    }

    const allEvents = conditions
      ? await db.select().from(events).where(conditions).orderBy(desc(events.date))
      : await db.select().from(events).orderBy(desc(events.date));

    const enriched = await Promise.all(allEvents.map(async (event) => {
      let venue: Venue | undefined;
      let homeTeam: Team | undefined;
      let awayTeam: Team | undefined;
      if (event.venueId) {
        const [v] = await db.select().from(venues).where(eq(venues.id, event.venueId));
        venue = v;
      }
      if (event.teamId) {
        const [t] = await db.select().from(teams).where(eq(teams.id, event.teamId));
        homeTeam = t;
      }
      if (event.awayTeamId) {
        const [t] = await db.select().from(teams).where(eq(teams.id, event.awayTeamId));
        awayTeam = t;
      }
      return { ...event, venue, homeTeam, awayTeam };
    }));
    return enriched;
  }

  async getEvent(id: string): Promise<(Event & { venue?: Venue; homeTeam?: Team; awayTeam?: Team }) | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (!event) return undefined;
    let venue: Venue | undefined;
    let homeTeam: Team | undefined;
    let awayTeam: Team | undefined;
    if (event.venueId) {
      const [v] = await db.select().from(venues).where(eq(venues.id, event.venueId));
      venue = v;
    }
    if (event.teamId) {
      const [t] = await db.select().from(teams).where(eq(teams.id, event.teamId));
      homeTeam = t;
    }
    if (event.awayTeamId) {
      const [t] = await db.select().from(teams).where(eq(teams.id, event.awayTeamId));
      awayTeam = t;
    }
    return { ...event, venue, homeTeam, awayTeam };
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async rsvpEvent(eventId: string, userId: string): Promise<boolean> {
    const existing = await db.select().from(eventRsvps).where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));
    if (existing.length > 0) {
      await db.delete(eventRsvps).where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));
      await db.update(events).set({ rsvpCount: sql`GREATEST(${events.rsvpCount} - 1, 0)` }).where(eq(events.id, eventId));
      return false;
    }
    await db.insert(eventRsvps).values({ eventId, userId });
    await db.update(events).set({ rsvpCount: sql`${events.rsvpCount} + 1` }).where(eq(events.id, eventId));
    return true;
  }

  async getEventRsvps(eventId: string): Promise<string[]> {
    const rows = await db.select({ userId: eventRsvps.userId }).from(eventRsvps).where(eq(eventRsvps.eventId, eventId));
    return rows.map(r => r.userId);
  }

  // ─── Offers ────────────────────────────────────────────────────
  async getOffers(filters?: { teamId?: string; sportId?: string; venueId?: string }): Promise<(Offer & { venue?: Venue })[]> {
    let conditions: any[] = [];
    if (filters?.teamId) conditions.push(eq(offers.teamId, filters.teamId));
    if (filters?.sportId) conditions.push(eq(offers.sportId, filters.sportId));
    if (filters?.venueId) conditions.push(eq(offers.venueId, filters.venueId));

    let allOffers: Offer[];
    if (conditions.length === 0) allOffers = await db.select().from(offers);
    else if (conditions.length === 1) allOffers = await db.select().from(offers).where(conditions[0]);
    else allOffers = await db.select().from(offers).where(and(...conditions));

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

  async createOffer(offer: InsertOffer): Promise<Offer> {
    const [newOffer] = await db.insert(offers).values(offer).returning();
    return newOffer;
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
    return { ...claim, offer: offer!, user: safeUser(user!) };
  }

  // ─── Reviews & Checkins ────────────────────────────────────────
  async getVenueReviews(venueId: string): Promise<(Review & { user: User })[]> {
    const allReviews = await db.select().from(reviews).where(eq(reviews.venueId, venueId)).orderBy(desc(reviews.createdAt));
    const enriched = await Promise.all(allReviews.map(async (review) => {
      const [user] = await db.select().from(users).where(eq(users.id, review.userId));
      return { ...review, user: safeUser(user!) };
    }));
    return enriched;
  }

  async createReview(userId: string, review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values({ ...review, userId }).returning();
    // Update venue rating
    const allReviews = await db.select().from(reviews).where(eq(reviews.venueId, review.venueId));
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await db.update(venues).set({ rating: Math.round(avg * 10) / 10, reviewCount: allReviews.length }).where(eq(venues.id, review.venueId));
    return newReview;
  }

  async getVenueCheckins(venueId: string): Promise<(Checkin & { user: User })[]> {
    const allCheckins = await db.select().from(checkins).where(eq(checkins.venueId, venueId)).orderBy(desc(checkins.createdAt));
    const enriched = await Promise.all(allCheckins.map(async (checkin) => {
      const [user] = await db.select().from(users).where(eq(users.id, checkin.userId));
      return { ...checkin, user: safeUser(user!) };
    }));
    return enriched;
  }

  async createCheckin(userId: string, venueId: string, eventId?: string): Promise<Checkin> {
    const [checkin] = await db.insert(checkins).values({ userId, venueId, eventId }).returning();
    return checkin;
  }

  // ─── Community ─────────────────────────────────────────────────
  async getCommunityRooms(filters?: { type?: string; sportId?: string; leagueId?: string; teamId?: string }): Promise<CommunityRoom[]> {
    let conditions: any[] = [];
    if (filters?.type) conditions.push(eq(communityRooms.type, filters.type));
    if (filters?.sportId) conditions.push(eq(communityRooms.sportId, filters.sportId));
    if (filters?.leagueId) conditions.push(eq(communityRooms.leagueId, filters.leagueId));
    if (filters?.teamId) conditions.push(eq(communityRooms.teamId, filters.teamId));

    if (conditions.length === 0) return db.select().from(communityRooms).orderBy(desc(communityRooms.memberCount));
    if (conditions.length === 1) return db.select().from(communityRooms).where(conditions[0]).orderBy(desc(communityRooms.memberCount));
    return db.select().from(communityRooms).where(and(...conditions)).orderBy(desc(communityRooms.memberCount));
  }

  async getCommunityRoom(id: string): Promise<CommunityRoom | undefined> {
    const [room] = await db.select().from(communityRooms).where(eq(communityRooms.id, id));
    return room;
  }

  async getRoomMessages(roomId: string): Promise<(RoomMessage & { user: User; reactions: RoomMessageReaction[] })[]> {
    const msgs = await db.select().from(roomMessages).where(eq(roomMessages.roomId, roomId)).orderBy(roomMessages.createdAt);
    const enriched = await Promise.all(msgs.map(async (msg) => {
      const [user] = await db.select().from(users).where(eq(users.id, msg.userId));
      const reactions = await db.select().from(roomMessageReactions).where(eq(roomMessageReactions.messageId, msg.id));
      return { ...msg, user: safeUser(user!), reactions };
    }));
    return enriched;
  }

  async createRoomMessage(userId: string, message: InsertRoomMessage): Promise<RoomMessage> {
    const [msg] = await db.insert(roomMessages).values({ ...message, userId }).returning();
    return msg;
  }

  async addReaction(userId: string, messageId: string, emoji: string): Promise<void> {
    const existing = await db.select().from(roomMessageReactions)
      .where(and(eq(roomMessageReactions.messageId, messageId), eq(roomMessageReactions.userId, userId), eq(roomMessageReactions.emoji, emoji)));
    if (existing.length === 0) {
      await db.insert(roomMessageReactions).values({ messageId, userId, emoji });
    }
  }

  async removeReaction(userId: string, messageId: string, emoji: string): Promise<void> {
    await db.delete(roomMessageReactions)
      .where(and(eq(roomMessageReactions.messageId, messageId), eq(roomMessageReactions.userId, userId), eq(roomMessageReactions.emoji, emoji)));
  }

  // ─── Reports ───────────────────────────────────────────────────
  async createReport(reporterId: string, report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values({ ...report, reporterId }).returning();
    return newReport;
  }

  async getReports(): Promise<Report[]> {
    return db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async updateReportStatus(id: string, status: string): Promise<Report> {
    const [updated] = await db.update(reports).set({ status }).where(eq(reports.id, id)).returning();
    return updated;
  }

  // ─── DM Messages ──────────────────────────────────────────────
  async getConversations(userId: string): Promise<{ user: User; lastMessage: Message; unreadCount: number }[]> {
    const allMessages = await db.select().from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));

    const convMap = new Map<string, Message>();
    for (const msg of allMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!convMap.has(partnerId)) convMap.set(partnerId, msg);
    }

    const result = await Promise.all(
      Array.from(convMap.entries()).map(async ([partnerId, lastMessage]) => {
        const [partner] = await db.select().from(users).where(eq(users.id, partnerId));
        const unreadRows = await db.select({ count: sql<number>`count(*)` }).from(messages)
          .where(and(eq(messages.senderId, partnerId), eq(messages.receiverId, userId), eq(messages.read, false)));
        return { user: safeUser(partner), lastMessage, unreadCount: Number(unreadRows[0]?.count || 0) };
      })
    );
    return result;
  }

  async getMessages(userId: string, otherUserId: string): Promise<(Message & { sender: User })[]> {
    const allMessages = await db.select().from(messages)
      .where(or(
        and(eq(messages.senderId, userId), eq(messages.receiverId, otherUserId)),
        and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId))
      ))
      .orderBy(messages.createdAt);

    const enriched = await Promise.all(allMessages.map(async (msg) => {
      const [sender] = await db.select().from(users).where(eq(users.id, msg.senderId));
      return { ...msg, sender: safeUser(sender) };
    }));
    return enriched;
  }

  async sendMessage(senderId: string, message: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values({ ...message, senderId }).returning();
    return msg;
  }

  async markMessagesRead(userId: string, otherUserId: string): Promise<void> {
    await db.update(messages)
      .set({ read: true })
      .where(and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId), eq(messages.read, false)));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const rows = await db.select({ count: sql<number>`count(*)` }).from(messages)
      .where(and(eq(messages.receiverId, userId), eq(messages.read, false)));
    return Number(rows[0]?.count || 0);
  }

  // ─── Profiles ──────────────────────────────────────────────────
  async getUserPublicProfile(userId: string): Promise<(User & { team?: Team; postCount: number }) | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return undefined;
    let team: Team | undefined;
    if (user.teamId) {
      const [t] = await db.select().from(teams).where(eq(teams.id, user.teamId));
      team = t;
    }
    const postRows = await db.select({ count: sql<number>`count(*)` }).from(posts).where(eq(posts.userId, userId));
    return { ...safeUser(user), team, postCount: Number(postRows[0]?.count || 0) };
  }

  // ─── Admin ─────────────────────────────────────────────────────
  async getAdminStats(): Promise<{ users: number; posts: number; venues: number; events: number; offers: number; claims: number; reports: number; rooms: number }> {
    const [u] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [p] = await db.select({ count: sql<number>`count(*)` }).from(posts);
    const [v] = await db.select({ count: sql<number>`count(*)` }).from(venues);
    const [e] = await db.select({ count: sql<number>`count(*)` }).from(events);
    const [o] = await db.select({ count: sql<number>`count(*)` }).from(offers);
    const [c] = await db.select({ count: sql<number>`count(*)` }).from(offerClaims);
    const [r] = await db.select({ count: sql<number>`count(*)` }).from(reports);
    const [rm] = await db.select({ count: sql<number>`count(*)` }).from(communityRooms);
    return {
      users: Number(u.count), posts: Number(p.count), venues: Number(v.count),
      events: Number(e.count), offers: Number(o.count), claims: Number(c.count),
      reports: Number(r.count), rooms: Number(rm.count),
    };
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users);
    return allUsers.map(safeUser);
  }

  async updateUser(id: string, data: Partial<{ isAdmin: boolean; displayName: string }>): Promise<User> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return safeUser(updated);
  }
}

export const storage = new DatabaseStorage();
