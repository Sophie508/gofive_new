import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// 手动加载环境变

// 从环境变量中读取 DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

// 调试：检查 DATABASE_URL 是否正确加载
console.log("DATABASE_URL:", databaseUrl);

// 确保 DATABASE_URL 已定义
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

// 初始化 postgres 客户端
const client = postgres(databaseUrl);

// 使用 drizzle 初始化数据库
export const db = drizzle(client);