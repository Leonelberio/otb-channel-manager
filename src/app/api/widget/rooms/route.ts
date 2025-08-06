import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID requis" },
        { status: 400 }
      );
    }

    // Récupérer les espaces de l'organisation
    const organization = await prisma.organisation.findUnique({
      where: { id: orgId },
      include: {
        properties: {
          include: {
            rooms: {
              select: {
                id: true,
                name: true,
                pricePerNight: true,
                property: {
                  select: {
                    name: true,
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

    // Aplatir les espaces avec les informations des propriétés
    const rooms = organization.properties.flatMap((property) =>
      property.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        propertyName: property.name,
        pricePerNight: Number(room.pricePerNight),
      }))
    );

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Erreur lors de la récupération des espaces:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
