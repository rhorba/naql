import { auth } from "@/auth";
import { routing } from "@/i18n/routing";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

const protectedRoutes = [
  "/dashboard",
  "/fleet",
  "/missions",
  "/fuel",
  "/invoicing",
  "/payments",
  "/cash",
  "/expenses",
  "/profitability",
  "/hr",
  "/settings",
];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Strip locale prefix to check if the path is protected
  const pathnameWithoutLocale = pathname.replace(/^\/(fr|ar|en)/, "");
  const isProtected = protectedRoutes.some((p) => pathnameWithoutLocale.startsWith(p));

  if (isProtected) {
    const session = await auth();
    if (!session) {
      const locale = pathname.split("/")[1] ?? "fr";
      return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/(fr|ar|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
