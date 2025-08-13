import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Récupérer toutes les réservations de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const propertyId = searchParams.get("propertyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Construire les filtres pour les propriétés
    const propertyFilter = propertyId ? { id: propertyId } : undefined;

    // Construire les filtres pour les réservations
    const reservationFilters: any = {
      orderBy: {
        createdAt: "desc",
      },
    };

    // Ajouter les filtres de date si fournis
    if (startDate || endDate) {
      reservationFilters.where = {};
      if (startDate) {
        reservationFilters.where.startDate = {
          gte: new Date(startDate),
        };
      }
      if (endDate) {
        reservationFilters.where.endDate = {
          lte: new Date(endDate),
        };
      }
    }

    // Récupérer l'organisation de l'utilisateur
    const userOrganisation = await prisma.userOrganisation.findFirst({
      where: { userId: session.user.id },
      include: {
        organisation: {
          include: {
            properties: {
              include: {
                rooms: {
                  where: roomId ? { id: roomId } : undefined,
                  include: {
                    reservations: {
                      ...reservationFilters,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userOrganisation) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer les réservations avec SQL brut pour inclure startTime et duration
    let reservationsResult;

    if (roomId) {
      // Query with roomId filter
      reservationsResult = await prisma.$queryRaw<
        Array<{
          id: string;
          roomId: string;
          guestName: string;
          guestEmail: string | null;
          startDate: string;
          endDate: string;
          startTime: string | null;
          duration: number | null;
          status: string;
          totalPrice: string | null;
          notes: string | null;
          createdAt: string;
          updatedAt: string;
          roomName: string;
          propertyName: string;
        }>
      >`
        SELECT 
          r.id,
          r.room_id as "roomId",
          r.guest_name as "guestName",
          r.guest_email as "guestEmail",
          r.start_date as "startDate",
          r.end_date as "endDate",
          r.start_time as "startTime",
          r.duration,
          r.status,
          r.total_price as "totalPrice",
          r.notes,
          r.created_at as "createdAt",
          r.updated_at as "updatedAt",
          rm.name as "roomName",
          p.name as "propertyName"
        FROM reservations r
        JOIN rooms rm ON r.room_id = rm.id
        JOIN properties p ON rm.property_id = p.id
        WHERE p.organisation_id = ${userOrganisation.organisationId}
        AND r.room_id = ${roomId}
        ORDER BY r.created_at DESC
      `;
    } else {
      // Query without roomId filter
      reservationsResult = await prisma.$queryRaw<
        Array<{
          id: string;
          roomId: string;
          guestName: string;
          guestEmail: string | null;
          startDate: string;
          endDate: string;
          startTime: string | null;
          duration: number | null;
          status: string;
          totalPrice: string | null;
          notes: string | null;
          createdAt: string;
          updatedAt: string;
          roomName: string;
          propertyName: string;
        }>
      >`
        SELECT 
          r.id,
          r.room_id as "roomId",
          r.guest_name as "guestName",
          r.guest_email as "guestEmail",
          r.start_date as "startDate",
          r.end_date as "endDate",
          r.start_time as "startTime",
          r.duration,
          r.status,
          r.total_price as "totalPrice",
          r.notes,
          r.created_at as "createdAt",
          r.updated_at as "updatedAt",
          rm.name as "roomName",
          p.name as "propertyName"
        FROM reservations r
        JOIN rooms rm ON r.room_id = rm.id
        JOIN properties p ON rm.property_id = p.id
        WHERE p.organisation_id = ${userOrganisation.organisationId}
        ORDER BY r.created_at DESC
      `;
    }

    // Convertir les données
    const reservations = reservationsResult.map((reservation) => ({
      ...reservation,
      totalPrice: reservation.totalPrice
        ? Number(reservation.totalPrice)
        : null,
    }));

    // Récupérer la devise via SQL brut
    const userPreferencesResult = await prisma.$queryRaw<
      Array<{ currency: string }>
    >`
      SELECT currency FROM user_preferences WHERE user_id = ${session.user.id}
    `;

    const currency = userPreferencesResult[0]?.currency || "EUR";

    return NextResponse.json({ reservations, currency });
  } catch (error) {
    console.error("Erreur lors de la récupération des réservations:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle réservation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const {
      roomId,
      guestName,
      guestEmail,
      startDate,
      endDate,
      startTime,
      duration,
      status,
      totalPrice,
      notes,
    } = body;

    // Validation des champs requis
    if (!roomId || !guestName || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    // Vérifier que la room appartient à l'organisation de l'utilisateur
    const userOrganisation = await prisma.userOrganisation.findFirst({
      where: { userId: session.user.id },
      include: {
        organisation: {
          include: {
            properties: {
              include: {
                rooms: {
                  where: { id: roomId },
                },
              },
            },
          },
        },
      },
    });

    const room = userOrganisation?.organisation.properties
      .flatMap((p) => p.rooms)
      .find((r) => r.id === roomId);

    if (!room) {
      return NextResponse.json(
        { error: "Espace non trouvé ou non autorisé" },
        { status: 404 }
      );
    }

    // Vérifier les dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return NextResponse.json(
        {
          error:
            "La date de fin doit être postérieure ou égale à la date de début",
        },
        { status: 400 }
      );
    }

    // Si c'est la même journée, vérifier qu'une heure et une durée sont définies
    if (
      start.toDateString() === end.toDateString() &&
      (!startTime || !duration)
    ) {
      return NextResponse.json(
        {
          error:
            "Pour une réservation sur la même journée, veuillez spécifier l'heure et la durée",
        },
        { status: 400 }
      );
    }

    // Vérifier les conflits de réservation (optionnel mais recommandé)
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        roomId,
        status: {
          not: "CANCELLED",
        },
        OR: [
          {
            AND: [{ startDate: { lte: start } }, { endDate: { gt: start } }],
          },
          {
            AND: [{ startDate: { lt: end } }, { endDate: { gte: end } }],
          },
          {
            AND: [{ startDate: { gte: start } }, { endDate: { lte: end } }],
          },
        ],
      },
    });

    if (conflictingReservation) {
      return NextResponse.json(
        { error: "Conflit de réservation avec une réservation existante" },
        { status: 409 }
      );
    }

    // Valider le statut
    const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
    const finalStatus =
      status && validStatuses.includes(status) ? status : "PENDING";

    // Créer la réservation avec Prisma (plus sûr que SQL brut)
    const createdReservation = await prisma.reservation.create({
      data: {
        id: `reservation_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        roomId,
        guestName,
        guestEmail: guestEmail || null,
        startDate: start,
        endDate: end,
        startTime: startTime || null,
        duration: duration ? parseInt(duration) : null,
        status: finalStatus as
          | "PENDING"
          | "CONFIRMED"
          | "CANCELLED"
          | "COMPLETED",
        totalPrice: totalPrice ? parseFloat(totalPrice) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ reservation: createdReservation });
  } catch (error) {
    console.error("Erreur lors de la création de la réservation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
