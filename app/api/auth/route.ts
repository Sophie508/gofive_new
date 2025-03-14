import { db } from "@/lib/db";
import { users } from "@/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";

const authSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Username must contain only letters and numbers"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must not exceed 100 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = authSchema.parse(body);
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入之前显式检查用户是否存在
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (existingUser.length > 0) {
      return NextResponse.json({ success: false, error: "Username already exists" }, { status: 400 });
    }

    // 插入新用户
    const result = await db.insert(users).values({ username, password: hashedPassword });
    console.log("Insert result:", result);

    return NextResponse.json({ success: true, message: "User registered" }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/auth:", error); // 打印详细错误
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: (error as Error).message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const password = searchParams.get("password");

  if (!username || !password) {
    return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 });
  }

  try {
    const parsedData = authSchema.parse({ username, password });
    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, parsedData.username));

    if (user.length && (await bcrypt.compare(parsedData.password, user[0].password))) {
      return NextResponse.json({ success: true, userId: user[0].id }, { status: 200 });
    }
    return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
  } catch (error) {
    console.error("Error in GET /api/auth:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}