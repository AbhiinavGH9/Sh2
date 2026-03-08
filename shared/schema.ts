import { sql } from "drizzle-orm";
import { pgTable, text, serial, timestamp, varchar, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  bio: text("bio"),
  interests: text("interests").array(), // e.g., ["Gaming", "Anime"]
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  frequency: text("frequency").notNull().unique(), // e.g., "32.48"
  color: text("color"), // hex or tailwind class
  icon: text("icon"), // lucide icon name
  creatorId: varchar("creator_id").references(() => users.id),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const frequencies = pgTable("frequencies", {
  id: serial("id").primaryKey(),
  frequency: text("frequency").notNull().unique(),
  mode: varchar("mode", { length: 20 }).notNull().default("public"), // public, duo, group
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  frequencyId: integer("frequency_id").references(() => frequencies.id), // Using integer here as serial would create a sequence
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
});

export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId1: varchar("user_id_1").notNull().references(() => users.id),
  userId2: varchar("user_id_2").notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
export const insertFrequencySchema = createInsertSchema(frequencies).omit({ id: true, createdAt: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true, joinedAt: true, leftAt: true });
export const insertFriendSchema = createInsertSchema(friends).omit({ id: true, createdAt: true });

// Exports
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Frequency = typeof frequencies.$inferSelect;
export type InsertFrequency = z.infer<typeof insertFrequencySchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Friend = typeof friends.$inferSelect;
export type InsertFriend = z.infer<typeof insertFriendSchema>;

// Request types
export type UpdateProfileRequest = Partial<InsertProfile>;
export type CreateGroupRequest = InsertGroup;

// Response types
export type ActiveFrequency = {
  frequency: string;
  userCount: number;
};
