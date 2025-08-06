import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: string;
  backgroundColor?: string;
  foregroundColor?: string;
}

interface GoogleCalendarListResponse {
  items?: GoogleCalendar[];
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

    // Appeler l'API Google Calendar pour récupérer la liste des agendas
    const calendarResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
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
        { error: "Erreur lors de la récupération des agendas Google Calendar" },
        { status: 500 }
      );
    }

    const calendarData =
      (await calendarResponse.json()) as GoogleCalendarListResponse;

    // Transformer les agendas en format compatible
    const calendars =
      calendarData.items?.map((calendar: GoogleCalendar) => ({
        id: calendar.id,
        name: calendar.summary,
        description: calendar.description || "",
        isPrimary: calendar.primary || false,
        accessRole: calendar.accessRole,
        backgroundColor: calendar.backgroundColor || "#4285f4",
        foregroundColor: calendar.foregroundColor || "#ffffff",
      })) || [];

    return NextResponse.json({ calendars });
  } catch (error) {
    console.error("Erreur lors de la récupération des agendas:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
