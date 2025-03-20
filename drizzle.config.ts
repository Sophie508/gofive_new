import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: "localhost",
    port: 5433,
    user: "postgres",
    database: "gofive_db",
    ssl: false,
  },
});