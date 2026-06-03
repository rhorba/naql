import { routing } from "@/i18n/routing";
import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

const protectedRoutes = [
  "/dashboard", "/fleet", "/missions", "/fuel",
  "/invoicing", "/payments", "/cash", "/expenses",
  "/profitability", "/hr", "/settings", "/clients",
];

// Middleware runs on the Edge runtime — use getToken (JWT, edge-compatible)
// NOT auth() which imports argon2 (Node.js native, incompatible with edge)
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const pathnameWithoutLocale = pathname.replace(/^\/(fr|ar|en)/, "");
  const isProtected = protectedRoutes.some((p) => pathnameWithoutLocale.startsWith(p));

  if (isProtected) {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });
    if (!token) {
      const locale = pathname.split("/")[1] ?? "fr";
      return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/(fr|ar|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
