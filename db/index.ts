import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

const db = drizzle({ connection: process.env.DATABASE_URL!, schema });

// Test database connection
(async () => {
  try {
    await db.execute(sql`SELECT 1`);
    console.log('Database connection test successful');
  } catch (error) {
    console.error('Database connection test failed:', error);
  }
})();

export { db };
