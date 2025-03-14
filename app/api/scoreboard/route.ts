import { db } from "@/lib/db";
import { scores, users } from "@/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const result = await db
    .select({ username: users.username, steps: scores.steps, time: scores.time })
    .from(scores)
    .leftJoin(users, eq(scores.userId, users.id))
    .orderBy(asc(scores.steps), asc(scores.time))
    .limit(10);
  return new Response(JSON.stringify(result), { status: 200 });
}

export async function POST(request: Request) {
  const { userId, steps, time } = await request.json();
  await db.insert(scores).values({ userId, steps, time });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}