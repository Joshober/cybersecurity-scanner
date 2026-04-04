import { NextResponse } from "next/server";

export function GET(request) {
  return NextResponse.redirect(request.nextUrl.searchParams.get("next") || "/");
}
