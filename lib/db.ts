import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres("postgres://qinsuliu@localhost:5432/gofive_db", { ssl: false });
export const db = drizzle(client);