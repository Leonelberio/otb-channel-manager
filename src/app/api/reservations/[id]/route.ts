import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Mettre à jour une réservation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
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

    // Vérifier que la réservation existe et appartient à l'utilisateur
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        id,
        room: {
          property: {
            organisation: {
              userOrganisations: {
                some: {
                  userId: session.user.id,
                },
              },
            },
          },
        },
      },
    });

    if (!existingReservation) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      );
    }

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

    // Vérifier les conflits de réservation (exclure la réservation actuelle)
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        id: { not: id }, // Exclure la réservation actuelle
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

    // Mettre à jour la réservation
    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: {
        roomId,
        guestName,
        guestEmail: guestEmail || null,
        startDate: start,
        endDate: end,
        startTime: startTime || null,
        duration: duration ? parseInt(duration) : null,
        status: status || "PENDING",
        totalPrice: totalPrice ? parseFloat(totalPrice) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ reservation: updatedReservation });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la réservation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une réservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que la réservation existe et appartient à l'utilisateur
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        id,
        room: {
          property: {
            organisation: {
              userOrganisations: {
                some: {
                  userId: session.user.id,
                },
              },
            },
          },
        },
      },
    });

    if (!existingReservation) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      );
    }

    // Supprimer la réservation
    await prisma.reservation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de la réservation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
