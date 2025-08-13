import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Set a custom header to identify the properties listing page
  if (request.nextUrl.pathname === "/dashboard/properties") {
    response.headers.set("x-is-properties-page", "true");
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
