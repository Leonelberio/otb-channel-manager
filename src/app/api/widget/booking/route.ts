import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      roomId,
      guestName,
      guestEmail,
      startDate,
      endDate,
      totalPrice,
      notes,
      organizationId,
    } = body;

    // Validation des champs requis
    if (!roomId || !guestName || !startDate || !endDate || !organizationId) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    // Vérifier que la room appartient à l'organisation
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        property: {
          organisation: {
            id: organizationId,
          },
        },
      },
    });

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

    // Vérifier les conflits de réservation
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

    // Créer la réservation avec le statut PENDING par défaut
    const reservation = await prisma.reservation.create({
      data: {
        roomId,
        guestName,
        guestEmail: guestEmail || null,
        startDate: start,
        endDate: end,
        status: "PENDING",
        totalPrice: totalPrice ? parseFloat(totalPrice) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      reservation,
      message:
        "Réservation créée avec succès ! Vous recevrez une confirmation bientôt.",
    });
  } catch (error) {
    console.error("Erreur lors de la création de la réservation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
