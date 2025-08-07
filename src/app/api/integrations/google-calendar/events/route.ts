import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Configuration pour éviter le pré-rendu
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

interface TransformedEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  eventType: string;
  source: string;
  location: string;
  calendarId: string;
  attendees: Array<{
    email: string;
    name?: string;
    responseStatus?: string;
  }>;
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

    let calendarsToFetch: string[] = [];

    if (roomId && roomId !== "all") {
      // Cas spécifique : un espace sélectionné
      const calendarConfig = await prisma.calendarConfig.findFirst({
        where: {
          integrationId: integration.id,
          roomId,
          isActive: true,
        },
      });

      if (calendarConfig) {
        calendarsToFetch = [calendarConfig.calendarId];
      } else {
        // Si pas de config spécifique, utiliser l'agenda principal
        calendarsToFetch = ["primary"];
      }
    } else {
      // Cas "Tous les espaces" : récupérer tous les agendas configurés
      const allConfigs = await prisma.calendarConfig.findMany({
        where: {
          integrationId: integration.id,
          isActive: true,
        },
      });

      if (allConfigs.length > 0) {
        // Utiliser tous les agendas configurés, en supprimant les doublons
        calendarsToFetch = [
          ...new Set(allConfigs.map((config: any) => config.calendarId)),
        ];
      } else {
        // Si aucune configuration, ne pas afficher d'événements pour "Tous les espaces"
        console.log(
          "🚫 No calendar configurations found - showing no events for 'all spaces'"
        );
        return NextResponse.json({ events: [], calendarsUsed: [] });
      }
    }

    console.log("📅 Calendars to fetch:", calendarsToFetch);

    // Récupérer les événements de tous les agendas
    const allEvents: TransformedEvent[] = [];
    const calendarsUsed: string[] = [];

    for (const calendarId of calendarsToFetch) {
      try {
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

        if (calendarResponse.ok) {
          const calendarData =
            (await calendarResponse.json()) as GoogleCalendarResponse;

          // Transformer les événements Google en format compatible
          const calendarEvents: TransformedEvent[] =
            calendarData.items?.map((event: GoogleCalendarEvent) => ({
              id: `${calendarId}_${event.id}`, // Préfixer avec l'ID du calendrier pour éviter les doublons
              title: event.summary || "Sans titre",
              description: event.description || "",
              startDate: event.start.dateTime || event.start.date || "",
              endDate: event.end.dateTime || event.end.date || "",
              eventType: "external",
              source: "google_calendar",
              location: event.location || "",
              calendarId: calendarId, // Ajouter l'ID du calendrier source
              attendees:
                event.attendees?.map((attendee) => ({
                  email: attendee.email,
                  name: attendee.displayName,
                  responseStatus: attendee.responseStatus,
                })) || [],
            })) || [];

          allEvents.push(...calendarEvents);
          calendarsUsed.push(calendarId);

          console.log(
            `📊 Calendar ${calendarId}: ${calendarEvents.length} events`
          );
        } else {
          console.error(
            `❌ Error fetching calendar ${calendarId}:`,
            await calendarResponse.text()
          );
        }
      } catch (error) {
        console.error(`❌ Error processing calendar ${calendarId}:`, error);
      }
    }

    // Trier tous les événements par date de début
    allEvents.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    console.log(`🚀 API Response for roomId=${roomId}:`);
    console.log(
      `📊 Total events from ${calendarsUsed.length} calendars: ${allEvents.length}`
    );
    console.log(`📅 Sample event:`, allEvents[0] || "No events");
    console.log(`🗓️ Time range: ${timeMin} to ${timeMax}`);
    console.log(`🎯 Calendars used:`, calendarsUsed);

    // Mettre à jour lastSyncAt
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      events: allEvents,
      calendarsUsed,
      totalCalendars: calendarsUsed.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des événements:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
