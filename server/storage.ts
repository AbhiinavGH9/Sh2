import { db } from "./db";
import {
  profiles,
  groups,
  type Profile,
  type InsertProfile,
  type UpdateProfileRequest,
  type Group,
  type CreateGroupRequest,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
  updateProfile(userId: string, updates: UpdateProfileRequest): Promise<Profile>;

  // Groups
  getGroups(): Promise<Group[]>;
  createGroup(group: CreateGroupRequest & { creatorId: string }): Promise<Group>;
  deleteGroup(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // --- Profiles ---
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async updateProfile(userId: string, updates: UpdateProfileRequest): Promise<Profile> {
    const existing = await this.getProfile(userId);

    if (!existing) {
      // Create if doesn't exist
      const [newProfile] = await db.insert(profiles)
        .values({
          userId,
          bio: updates.bio || null,
          interests: updates.interests || [],
        })
        .returning();
      return newProfile;
    }

    // Update
    const [updated] = await db.update(profiles)
      .set({
        bio: updates.bio !== undefined ? updates.bio : existing.bio,
        interests: updates.interests !== undefined ? updates.interests : existing.interests,
      })
      .where(eq(profiles.userId, userId))
      .returning();

    return updated;
  }

  // --- Groups ---
  async getGroups(): Promise<Group[]> {
    return await db.select().from(groups);
  }

  async createGroup(groupData: CreateGroupRequest & { creatorId: string }): Promise<Group> {
    const [group] = await db.insert(groups).values(groupData).returning();
    return group;
  }

  async deleteGroup(id: number): Promise<boolean> {
    const [deleted] = await db.delete(groups).where(eq(groups.id, id)).returning();
    return !!deleted;
  }
}

export const storage = new DatabaseStorage();
