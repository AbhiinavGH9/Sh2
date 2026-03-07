import { sql } from "drizzle-orm";
import { pgTable, text, serial, timestamp, varchar } from "drizzle-orm/pg-core";
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
  frequency: text("frequency").notNull(), // e.g., "32.48"
  color: text("color"), // hex or tailwind class
  icon: text("icon"), // lucide icon name
  creatorId: varchar("creator_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });

// Exports
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

// Request types
export type UpdateProfileRequest = Partial<InsertProfile>;
export type CreateGroupRequest = InsertGroup;

// Response types
export type ActiveFrequency = {
  frequency: string;
  userCount: number;
};
