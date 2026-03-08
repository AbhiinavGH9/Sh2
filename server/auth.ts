import type { Express, RequestHandler } from "express";
import { AppConfig } from "../shared/app.config";
import { storage } from "./storage";
import { createClient } from "@supabase/supabase-js";
import { db, pool } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Initialize Supabase Client
const supabase = createClient(AppConfig.SUPABASE_URL, AppConfig.SUPABASE_ANON_KEY);

export async function setupAuth(app: Express) {
    // No longer using stateful session auth (express-session / passport)
    // We are now verifying JWTs via Supabase
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
    // Expect Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized: Missing Authorization header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Malformed token" });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
        }

        // Sync Supabase user with local database to satisfy foreign keys for profiles/groups
        const [existingUser] = await db.select().from(users).where(eq(users.id, user.id));
        if (!existingUser) {
            await db.insert(users).values({
                id: user.id,
                email: user.email,
                firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(" ")[0] || null,
                lastName: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(" ")[1] || null,
                profileImageUrl: user.user_metadata?.avatar_url || null,
            });
        }

        // Attach user info to request
        (req as any).user = { claims: { sub: user.id }, email: user.email, user_metadata: user.user_metadata };
        return next();
    } catch (err: any) {
        console.error("Auth Middleware Error:", err);
        return res.status(500).json({ message: "Internal server error during authentication", error: err.message });
    }
};

export function registerAuthRoutes(app: Express): void {
    // The frontend should now hit Supabase directly to log in/register,
    // so we don't need extensive endpoints here anymore.
    // However, the frontend relies on /api/auth/user to quickly fetch the DB profile.

    app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
        try {
            const userId = req.user.claims.sub;

            // Get user from DB
            const [dbUser] = await db.select().from(users).where(eq(users.id, userId));

            res.json(dbUser || { id: userId, email: req.user.email });
        } catch (error: any) {
            console.error("Error fetching user data:", error);
            res.status(500).json({ message: "Failed to fetch user", error: error.message });
        }
    });

    app.put("/api/auth/user", isAuthenticated, async (req: any, res) => {
        try {
            const userId = req.user.claims.sub;
            const { firstName, profileImageUrl } = req.body;

            const [updatedUser] = await db.update(users)
                .set({
                    firstName: firstName !== undefined ? firstName : undefined,
                    profileImageUrl: profileImageUrl !== undefined ? profileImageUrl : undefined,
                    updatedAt: new Date()
                })
                .where(eq(users.id, userId))
                .returning();

            res.json(updatedUser);
        } catch (error) {
            console.error("Error updating user data:", error);
            res.status(500).json({ message: "Failed to update user" });
        }
    });

    app.delete("/api/auth/account", isAuthenticated, async (req: any, res) => {
        try {
            const userId = req.user.claims.sub;

            // Delete from public schema to trigger group foreign key cascades safely
            await db.delete(users).where(eq(users.id, userId));

            // Execute destruction against the secure auth schema to wipe the actual login credentials
            await pool.query('DELETE FROM auth.users WHERE id = $1', [userId]);

            res.status(200).json({ message: "Account explicitly deleted" });
        } catch (error) {
            console.error("Error deleting user account:", error);
            res.status(500).json({ message: "Failed to purge user from the system" });
        }
    });
}
