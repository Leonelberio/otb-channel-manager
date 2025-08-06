import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Récupérer la configuration des agendas pour tous les espaces
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer toutes les configurations d'agenda pour l'utilisateur
    const configs = await prisma.calendarConfig.findMany({
      where: {
        integration: {
          userId: session.user.id,
          type: "google_calendar",
        },
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ configs });
  } catch (error) {
    console.error("Erreur lors de la récupération des configurations:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer ou mettre à jour la configuration d'un agenda
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { roomId, calendarId, calendarName } = body;

    if (!roomId || !calendarId || !calendarName) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // Récupérer l'intégration Google Calendar
    const integration = await prisma.integration.findFirst({
      where: {
        userId: session.user.id,
        type: "google_calendar",
        isActive: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Intégration Google Calendar non trouvée" },
        { status: 404 }
      );
    }

    // Créer ou mettre à jour la configuration
    const config = await prisma.calendarConfig.upsert({
      where: {
        integrationId_roomId: {
          integrationId: integration.id,
          roomId,
        },
      },
      update: {
        calendarId,
        calendarName,
        isActive: true,
      },
      create: {
        integrationId: integration.id,
        roomId,
        calendarId,
        calendarName,
        isActive: true,
      },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la configuration:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
