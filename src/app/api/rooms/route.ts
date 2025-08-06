import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
                    equipments: true,
                    reservations: {
                      where: {
                        status: {
                          in: ["CONFIRMED", "PENDING"],
                        },
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
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    // Flatten rooms with property info
    const rooms = userOrganisation.organisation.properties.flatMap((property) =>
      property.rooms.map((room) => ({
        ...room,
        propertyName: property.name,
        equipmentCount: room.equipments.length,
        reservationCount: room.reservations.length,
      }))
    );

    // Récupérer la devise via SQL brut
    const userPreferencesResult = await prisma.$queryRaw<
      Array<{ currency: string }>
    >`
      SELECT currency FROM user_preferences WHERE user_id = ${session.user.id}
    `;

    const currency = userPreferencesResult[0]?.currency || "EUR";

    return NextResponse.json({ rooms, currency });
  } catch (error) {
    console.error("Erreur lors de la récupération des chambres:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { name, capacity, pricePerNight, description, propertyId } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Le nom de la chambre/espace est requis" },
        { status: 400 }
      );
    }

    if (!propertyId) {
      return NextResponse.json(
        { error: "La propriété est requise" },
        { status: 400 }
      );
    }

    // Vérifier que la propriété appartient à l'utilisateur
    const userOrganisation = await prisma.userOrganisation.findFirst({
      where: { userId: session.user.id },
    });

    if (!userOrganisation) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        organisationId: userOrganisation.organisationId,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Propriété introuvable" },
        { status: 404 }
      );
    }

    // Créer la chambre/espace
    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        capacity: capacity || null,
        pricePerNight: pricePerNight || null,
        description: description?.trim() || null,
        propertyId,
      },
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la chambre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
