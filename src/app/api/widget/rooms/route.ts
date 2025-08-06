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

    // Récupérer l'organisation
    const organization = await prisma.organisation.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer la devise via SQL brut
    const userPreferencesResult = await prisma.$queryRaw<
      Array<{ currency: string }>
    >`
      SELECT currency FROM user_preferences WHERE user_id = ${organization.ownerId}
    `;

    // Récupérer les propriétés et leurs espaces
    const properties = await prisma.property.findMany({
      where: { organisationId: orgId },
      include: {
        rooms: {
          select: {
            id: true,
            name: true,
            pricePerNight: true,
          },
        },
      },
    });

    // Aplatir les espaces avec les informations des propriétés
    const rooms = properties.flatMap((property) =>
      property.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        propertyName: property.name,
        pricePerNight: Number(room.pricePerNight || 0),
      }))
    );

    // Récupérer la devise des préférences utilisateur ou utiliser EUR par défaut
    const currency = userPreferencesResult[0]?.currency || "EUR";

    return NextResponse.json({
      rooms,
      currency,
      organizationName: organization.name,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des espaces:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
