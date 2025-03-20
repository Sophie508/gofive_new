import { db } from "@/lib/db";
import { users } from "@/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs"; 
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

    // 检查用户名是否已存在
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: "Username already exists" },
        { status: 400 }
      );
    }

    // 插入新用户
    const result = await db
      .insert(users)
      .values({ username, password: hashedPassword });

    console.log("Insert result:", result);

    return NextResponse.json(
      { success: true, message: "User registered" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/auth:", error);

    // 处理 Zod 验证错误
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    // 处理其他错误
    return NextResponse.json(
      { success: false, error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const password = searchParams.get("password");

  // 检查用户名和密码是否提供
  if (!username || !password) {
    return NextResponse.json(
      { success: false, error: "Username and password are required" },
      { status: 400 }
    );
  }

  try {
    // 验证输入数据
    const parsedData = authSchema.parse({ username, password });

    // 查找用户
    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, parsedData.username));

    // 检查用户是否存在并验证密码
    if (user.length && (await bcrypt.compare(parsedData.password, user[0].password))) {
      const response = NextResponse.json(
        { success: true, userId: user[0].id },
        { status: 200 }
      );

      // 设置登录状态的 Cookie
      response.cookies.set("userId", user[0].id.toString(), {
        path: "/",
        maxAge: 86400, // 1 天
      });
      response.cookies.set("isLoggedIn", "true", {
        path: "/",
        maxAge: 86400, // 1 天
      });

      return response;
    }

    // 用户名或密码错误
    return NextResponse.json(
      { success: false, error: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Error in GET /api/auth:", error);

    // 处理 Zod 验证错误
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    // 处理其他错误
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}