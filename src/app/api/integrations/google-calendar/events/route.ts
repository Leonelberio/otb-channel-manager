import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
}

interface GoogleCalendarResponse {
  items?: GoogleCalendarEvent[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'intégration Google Calendar de l'utilisateur
    const integration = await prisma.integration.findFirst({
      where: {
        userId: session.user.id,
        type: "google_calendar",
        isActive: true,
      },
    });

    if (!integration || !integration.accessToken) {
      return NextResponse.json(
        { error: "Intégration Google Calendar non trouvée ou non connectée" },
        { status: 404 }
      );
    }

    // Récupérer les paramètres de date et d'espace depuis la requête
    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get("timeMin") || new Date().toISOString();
    const timeMax =
      searchParams.get("timeMax") ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const roomId = searchParams.get("roomId");

    // Déterminer quel agenda utiliser
    let calendarId = "primary"; // Agenda principal par défaut

    if (roomId) {
      // Récupérer la configuration de l'agenda pour cet espace
      const calendarConfig = await prisma.calendarConfig.findFirst({
        where: {
          integrationId: integration.id,
          roomId,
          isActive: true,
        },
      });

      if (calendarConfig) {
        calendarId = calendarConfig.calendarId;
      }
    }

    // Appeler l'API Google Calendar avec l'agenda spécifique
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events?` +
        `timeMin=${encodeURIComponent(timeMin)}&` +
        `timeMax=${encodeURIComponent(timeMax)}&` +
        `singleEvents=true&` +
        `orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!calendarResponse.ok) {
      console.error(
        "Erreur API Google Calendar:",
        await calendarResponse.text()
      );
      return NextResponse.json(
        {
          error:
            "Erreur lors de la récupération des événements Google Calendar",
        },
        { status: 500 }
      );
    }

    const calendarData =
      (await calendarResponse.json()) as GoogleCalendarResponse;

    // Transformer les événements Google en format compatible
    const events =
      calendarData.items?.map((event: GoogleCalendarEvent) => ({
        id: event.id,
        title: event.summary || "Sans titre",
        description: event.description || "",
        startDate: event.start.dateTime || event.start.date,
        endDate: event.end.dateTime || event.end.date,
        eventType: "external",
        source: "google_calendar",
        location: event.location || "",
        attendees:
          event.attendees?.map((attendee) => ({
            email: attendee.email,
            name: attendee.displayName,
            responseStatus: attendee.responseStatus,
          })) || [],
      })) || [];

    // Mettre à jour lastSyncAt
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({ events, calendarId });
  } catch (error) {
    console.error("Erreur lors de la récupération des événements:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
