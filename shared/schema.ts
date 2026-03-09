import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  color: text("color").notNull(),
  description: text("description"),
  memberCount: integer("member_count").default(0),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  teamId: varchar("team_id"),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
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

export const venues = pgTable("venues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  teamId: varchar("team_id"),
  imageUrl: text("image_url"),
  category: text("category").default("bar"),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  venueId: varchar("venue_id"),
  teamId: varchar("team_id"),
  awayTeamId: varchar("away_team_id"),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  imageUrl: text("image_url"),
});

export const offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  venueId: varchar("venue_id"),
  teamId: varchar("team_id"),
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

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").notNull(),
  targetType: text("target_type").notNull(),
  targetId: varchar("target_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

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
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  postId: true,
  content: true,
});

export const insertVenueSchema = createInsertSchema(venues).pick({
  name: true,
  description: true,
  address: true,
  lat: true,
  lng: true,
  teamId: true,
  imageUrl: true,
  category: true,
});

export const insertEventSchema = createInsertSchema(events).pick({
  venueId: true,
  teamId: true,
  awayTeamId: true,
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
  discount: true,
  expiresAt: true,
  imageUrl: true,
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull(),
  receiverId: varchar("receiver_id").notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Like = typeof likes.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type OfferClaim = typeof offerClaims.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
