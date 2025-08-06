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

    // Récupérer l'organisation de l'utilisateur
    const userOrganisation = await prisma.userOrganisation.findFirst({
      where: { userId: session.user.id },
      include: {
        organisation: {
          include: {
            properties: {
              include: {
                rooms: {
                  include: {
                    reservations: {
                      orderBy: {
                        createdAt: "desc",
                      },
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

    // Aplatir les réservations avec les informations des rooms et propriétés
    const reservations = userOrganisation.organisation.properties.flatMap(
      (property) =>
        property.rooms.flatMap((room) =>
          room.reservations.map((reservation) => ({
            ...reservation,
            totalPrice: reservation.totalPrice
              ? Number(reservation.totalPrice)
              : null,
            roomName: room.name,
            propertyName: property.name,
          }))
        )
    );

    return NextResponse.json({ reservations });
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

    if (start >= end) {
      return NextResponse.json(
        { error: "La date de fin doit être postérieure à la date de début" },
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

    // Créer la réservation
    const reservation = await prisma.reservation.create({
      data: {
        roomId,
        guestName,
        guestEmail: guestEmail || null,
        startDate: start,
        endDate: end,
        status: status || "PENDING",
        totalPrice: totalPrice ? parseFloat(totalPrice) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ reservation });
  } catch (error) {
    console.error("Erreur lors de la création de la réservation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
