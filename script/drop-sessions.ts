import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    await db.execute(sql`DROP TABLE IF EXISTS "sessions" CASCADE;`);
    console.log("Sessions table dropped");
    process.exit(0);
}
main();
