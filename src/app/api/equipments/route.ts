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

    // Flatten equipments with room and property info
    const equipments = userOrganisation.organisation.properties.flatMap(
      (property) =>
        property.rooms.flatMap((room) =>
          room.equipments.map((equipment) => ({
            ...equipment,
            roomName: room.name,
            propertyName: property.name,
          }))
        )
    );

    return NextResponse.json({ equipments });
  } catch (error) {
    console.error("Erreur lors de la récupération des équipements:", error);
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
    const { name, description, icon, roomId } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Le nom de l'équipement est requis" },
        { status: 400 }
      );
    }

    if (!roomId) {
      return NextResponse.json(
        { error: "La chambre/espace est requise" },
        { status: 400 }
      );
    }

    // Vérifier que la chambre/espace appartient à l'utilisateur
    const userOrganisation = await prisma.userOrganisation.findFirst({
      where: { userId: session.user.id },
    });

    if (!userOrganisation) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        property: {
          organisationId: userOrganisation.organisationId,
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Chambre/Espace introuvable" },
        { status: 404 }
      );
    }

    // Créer l'équipement
    const equipment = await prisma.equipment.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || "package",
        roomId,
      },
    });

    return NextResponse.json({ equipment }, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'équipement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
