import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    const roomId = searchParams.get("roomId");

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID requis" },
        { status: 400 }
      );
    }

    // Récupérer l'organisation
    const organization = await prisma.organisation.findUnique({
      where: { id: orgId },
      include: {
        properties: {
          include: {
            rooms: {
              where: roomId ? { id: roomId } : undefined,
              include: {
                reservations: {
                  where: {
                    status: {
                      in: ["CONFIRMED", "PENDING"],
                    },
                  },
                  select: {
                    startDate: true,
                    endDate: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Aplatir toutes les réservations
    const reservations = organization.properties.flatMap((property) =>
      property.rooms.flatMap((room) =>
        room.reservations.map((reservation) => ({
          startDate: reservation.startDate.toISOString(),
          endDate: reservation.endDate.toISOString(),
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
