import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /dashboard to /dashboard/properties immediately
  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/dashboard/properties", request.url));
  }

  const response = NextResponse.next();

  // Set header for properties page to prevent sidebar flash
  if (pathname === "/dashboard/properties") {
    response.headers.set("x-hide-sidebar", "true");
  }

  // Handle auth redirects for signed-in users
  if (pathname.startsWith("/auth/")) {
    try {
      const token = await getToken({ req: request });

      if (token) {
        // User is authenticated, redirect to dashboard properties
        return NextResponse.redirect(
          new URL("/dashboard/properties", request.url)
        );
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
