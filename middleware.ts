import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const roleRoutes: Record<string, string[]> = {
  "/student": ["student", "faculty", "coordinator", "admin"],
  "/faculty": ["faculty", "admin"],
  "/coordinator": ["coordinator", "admin"],
  "/admin": ["admin"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const matchedPrefix = Object.keys(roleRoutes).find((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!matchedPrefix) {
    return NextResponse.next();
  }

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowedRoles = roleRoutes[matchedPrefix];
  const userRole = session.user.role;

  if (!allowedRoles.includes(userRole)) {
    return NextResponse.redirect(new URL(`/${userRole}`, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/student/:path*", "/faculty/:path*", "/coordinator/:path*", "/admin/:path*"],
};