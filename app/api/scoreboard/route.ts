import { db } from "@/lib/db";
import { scores, users } from "@/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db
      .select({ username: users.username, steps: scores.steps, time: scores.time })
      .from(scores)
      .leftJoin(users, eq(scores.userId, users.id))
      .orderBy(asc(scores.steps), asc(scores.time))
      .limit(10);

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("Error fetching scores:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch scores" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, steps, time } = await request.json();
    await db.insert(scores).values({ userId, steps, time });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Error saving score:", error);
    return new Response(JSON.stringify({ error: "Failed to save score" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}