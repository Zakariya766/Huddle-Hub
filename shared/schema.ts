import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Sports Hierarchy ─────────────────────────────────────────────
export const sports = pgTable("sports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"), // lucide icon name
  createdAt: timestamp("created_at").defaultNow(),
});

export const leagues = pgTable("leagues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sportId: varchar("sport_id").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  country: text("country"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Core Tables ──────────────────────────────────────────────────
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  avatar: text("avatar"),
  teamId: varchar("team_id"),
  isAdmin: boolean("is_admin").default(false),
});

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  leagueId: varchar("league_id"),
  city: text("city"),
  abbreviation: text("abbreviation"),
  description: text("description"),
  memberCount: integer("member_count").default(0),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  teamId: varchar("team_id"),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  type: text("type").default("post"), // post, checkin, event, venue_update
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const likes = pgTable("likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Venues ───────────────────────────────────────────────────────
export const venues = pgTable("venues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: text("city").default("Los Angeles"),
  neighborhood: text("neighborhood"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  imageUrl: text("image_url"),
  category: text("category").default("Bar"),
  phone: text("phone"),
  website: text("website"),
  hours: text("hours"),
  verified: boolean("verified").default(false),
  rating: doublePrecision("rating").default(0),
  reviewCount: integer("review_count").default(0),
});

export const venueTeamAffiliations = pgTable("venue_team_affiliations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  venueId: varchar("venue_id").notNull(),
  teamId: varchar("team_id").notNull(),
  isPrimary: boolean("is_primary").default(false),
});

// ─── Events ───────────────────────────────────────────────────────
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  venueId: varchar("venue_id"),
  teamId: varchar("team_id"),
  awayTeamId: varchar("away_team_id"),
  sportId: varchar("sport_id"),
  leagueId: varchar("league_id"),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  imageUrl: text("image_url"),
  matchId: varchar("match_id"), // link to ingested match
  rsvpCount: integer("rsvp_count").default(0),
});

export const eventRsvps = pgTable("event_rsvps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Offers ───────────────────────────────────────────────────────
export const offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  venueId: varchar("venue_id"),
  teamId: varchar("team_id"),
  sportId: varchar("sport_id"),
  discount: text("discount").notNull(),
  expiresAt: timestamp("expires_at"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
});

export const offerClaims = pgTable("offer_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  offerId: varchar("offer_id").notNull(),
  userId: varchar("user_id").notNull(),
  claimCode: text("claim_code").notNull(),
  redeemed: boolean("redeemed").default(false),
  redeemedAt: timestamp("redeemed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Reviews & Check-ins ──────────────────────────────────────────
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  venueId: varchar("venue_id").notNull(),
  rating: integer("rating").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const checkins = pgTable("checkins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  venueId: varchar("venue_id").notNull(),
  eventId: varchar("event_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Community ────────────────────────────────────────────────────
export const communityRooms = pgTable("community_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // sport, league, team, venue, event
  sportId: varchar("sport_id"),
  leagueId: varchar("league_id"),
  teamId: varchar("team_id"),
  venueId: varchar("venue_id"),
  eventId: varchar("event_id"),
  memberCount: integer("member_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const roomMessages = pgTable("room_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  parentMessageId: varchar("parent_message_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const roomMessageReactions = pgTable("room_message_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull(),
  userId: varchar("user_id").notNull(),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Reports & Messages ──────────────────────────────────────────
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").notNull(),
  targetType: text("target_type").notNull(),
  targetId: varchar("target_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull(),
  receiverId: varchar("receiver_id").notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Match Ingestion ─────────────────────────────────────────────
export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  externalId: text("external_id").notNull(),
  provider: text("provider").notNull(), // sportradar, mlb_stats, api_football
  sportId: varchar("sport_id"),
  leagueId: varchar("league_id"),
  homeTeamId: varchar("home_team_id"),
  awayTeamId: varchar("away_team_id"),
  homeTeamName: text("home_team_name").notNull(),
  awayTeamName: text("away_team_name").notNull(),
  matchName: text("match_name"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, live, final, postponed, cancelled
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  venueName: text("venue_name"),
  venueCity: text("venue_city"),
  venueCountry: text("venue_country"),
  broadcastInfo: text("broadcast_info"),
  season: text("season"),
  week: text("week"), // NFL week, round number, etc.
  stage: text("stage"), // regular_season, playoffs, group_stage, etc.
  isPlayoff: boolean("is_playoff").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matchRawPayloads = pgTable("match_raw_payloads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(),
  endpoint: text("endpoint").notNull(),
  sportSlug: text("sport_slug"),
  leagueSlug: text("league_slug"),
  payload: text("payload").notNull(), // raw JSON string
  matchCount: integer("match_count"),
  fetchedAt: timestamp("fetched_at").defaultNow(),
});

export const teamProviderMappings = pgTable("team_provider_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull(),
  provider: text("provider").notNull(),
  providerTeamId: text("provider_team_id").notNull(),
  providerTeamName: text("provider_team_name"),
});

export const ingestionRuns = pgTable("ingestion_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(),
  sportSlug: text("sport_slug"),
  leagueSlug: text("league_slug"),
  status: text("status").notNull().default("running"), // running, completed, failed
  matchesFound: integer("matches_found").default(0),
  matchesUpserted: integer("matches_upserted").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ─── Insert Schemas ───────────────────────────────────────────────
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  avatar: true,
  teamId: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  content: true,
  teamId: true,
  imageUrl: true,
  type: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  postId: true,
  content: true,
});

export const insertVenueSchema = createInsertSchema(venues).pick({
  name: true,
  description: true,
  address: true,
  city: true,
  neighborhood: true,
  lat: true,
  lng: true,
  imageUrl: true,
  category: true,
  phone: true,
  website: true,
  hours: true,
  verified: true,
});

export const insertEventSchema = createInsertSchema(events).pick({
  venueId: true,
  teamId: true,
  awayTeamId: true,
  sportId: true,
  leagueId: true,
  title: true,
  description: true,
  date: true,
  imageUrl: true,
});

export const insertOfferSchema = createInsertSchema(offers).pick({
  title: true,
  description: true,
  venueId: true,
  teamId: true,
  sportId: true,
  discount: true,
  expiresAt: true,
  imageUrl: true,
});

export const insertReportSchema = createInsertSchema(reports).pick({
  targetType: true,
  targetId: true,
  reason: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  receiverId: true,
  content: true,
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  venueId: true,
  rating: true,
  content: true,
});

export const insertRoomMessageSchema = createInsertSchema(roomMessages).pick({
  roomId: true,
  content: true,
  parentMessageId: true,
});

// ─── Types ────────────────────────────────────────────────────────
export type Sport = typeof sports.$inferSelect;
export type League = typeof leagues.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Like = typeof likes.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type VenueTeamAffiliation = typeof venueTeamAffiliations.$inferSelect;
export type Event = typeof events.$inferSelect;
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type OfferClaim = typeof offerClaims.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Checkin = typeof checkins.$inferSelect;
export type CommunityRoom = typeof communityRooms.$inferSelect;
export type RoomMessage = typeof roomMessages.$inferSelect;
export type RoomMessageReaction = typeof roomMessageReactions.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type MatchRawPayload = typeof matchRawPayloads.$inferSelect;
export type TeamProviderMapping = typeof teamProviderMappings.$inferSelect;
export type IngestionRun = typeof ingestionRuns.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertRoomMessage = z.infer<typeof insertRoomMessageSchema>;
