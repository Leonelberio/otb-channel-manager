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
      startTime,
      duration,
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

    // Calculer les dates/heures de début et fin réelles
    const actualStart = new Date(start);
    let actualEnd = new Date(end);

    // Si c'est la même journée, ajuster avec l'heure et la durée
    if (start.toDateString() === end.toDateString()) {
      if (startTime) {
        const [hours, minutes] = startTime.split(":").map(Number);
        actualStart.setHours(hours, minutes, 0, 0);
      }

      if (duration) {
        if (duration >= 8) {
          // Journée complète
          actualEnd = new Date(actualStart);
          actualEnd.setDate(actualEnd.getDate() + 1);
        } else {
          // Durée horaire
          actualEnd = new Date(actualStart);
          actualEnd.setHours(actualEnd.getHours() + duration);
        }
      }
    } else {
      // Plusieurs jours, utiliser la date de fin avec fin de journée
      actualEnd.setHours(23, 59, 59, 999);
    }

    // Vérifier les conflits de réservation avec les heures/durées
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        roomId,
        status: {
          not: "CANCELLED",
        },
        OR: [
          {
            AND: [
              { startDate: { lte: actualStart } },
              { endDate: { gt: actualStart } },
            ],
          },
          {
            AND: [
              { startDate: { lt: actualEnd } },
              { endDate: { gte: actualEnd } },
            ],
          },
          {
            AND: [
              { startDate: { gte: actualStart } },
              { endDate: { lte: actualEnd } },
            ],
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

    // Créer la réservation avec les dates/heures calculées
    const reservation = await prisma.reservation.create({
      data: {
        roomId,
        guestName,
        guestEmail: guestEmail || null,
        startDate: actualStart,
        endDate: actualEnd,
        startTime: startTime || null,
        duration: duration ? parseInt(duration) : null,
        status: "PENDING",
        totalPrice: totalPrice ? parseFloat(totalPrice) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      reservation: {
        ...reservation,
        totalPrice: reservation.totalPrice
          ? Number(reservation.totalPrice)
          : null,
      },
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
