import { defineConfig } from "drizzle-kit";

// Use environment variables directly to avoid typescript errors in drizzle-kit
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in environment variables");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
