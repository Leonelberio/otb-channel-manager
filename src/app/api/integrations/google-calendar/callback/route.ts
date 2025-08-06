import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.NEXTAUTH_URL + "/api/integrations/google-calendar/callback";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId
    const error = searchParams.get("error");

    if (error) {
      console.error("Erreur OAuth Google:", error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/calendar?error=oauth_error`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/calendar?error=missing_params`
      );
    }

    // Échanger le code contre un token d'accès
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      console.error(
        "Erreur lors de l'échange du token:",
        await tokenResponse.text()
      );
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/calendar?error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();

    // Sauvegarder l'intégration en base de données
    await prisma.integration.upsert({
      where: {
        userId_type: {
          userId: state,
          type: "google_calendar",
        },
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        lastSyncAt: new Date(),
        isActive: true,
      },
      create: {
        userId: state,
        type: "google_calendar",
        name: "Google Calendar",
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        lastSyncAt: new Date(),
        isActive: true,
      },
    });

    // Rediriger vers le dashboard avec un message de succès
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/calendar?success=google_calendar_connected`
    );
  } catch (error) {
    console.error("Erreur lors du callback Google Calendar:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/calendar?error=callback_failed`
    );
  }
}
