import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // Set a custom header to identify the properties listing page
  if (pathname === "/dashboard/properties") {
    response.headers.set("x-is-properties-page", "true");
  }

  // Handle auth redirects for signed-in users
  if (pathname.startsWith("/auth/")) {
    try {
      const token = await getToken({ req: request });

      if (token) {
        // User is authenticated, redirect to dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch (error) {
      // If there's an error getting the token, continue to auth page
      console.error("Auth check error:", error);
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
