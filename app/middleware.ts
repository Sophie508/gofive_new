import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/schema";
import { eq } from "drizzle-orm";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 跳过某些路径（例如首页、API 路由、静态资源）
  if (
    pathname === "/" || // 调整为新的首页路径
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  // 从 cookies 获取 userId
  const userId = request.cookies.get("userId")?.value;

  if (!userId || userId === "0") {
    console.log("No valid userId in cookies, redirecting to /");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 验证 userId 是否存在于数据库
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId)));
    if (!user.length) {
      console.log("UserId not found in database, redirecting to /");
      return NextResponse.redirect(new URL("/", request.url));
    }
  } catch (error) {
    console.error("Database error in middleware:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }

  console.log("UserId validated:", userId);
  return NextResponse.next();
}

export const config = {
  matcher: ["/game/:path*"],
};