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
                rooms: true,
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

    const properties = userOrganisation.organisation.properties.map(
      (property) => ({
        ...property,
        roomCount: property.rooms.length,
        rooms: property.rooms.map((room) => ({
          ...room,
          // Convert Decimal objects to regular numbers
          pricePerNight: room.pricePerNight ? Number(room.pricePerNight) : null,
          // Convert Date objects to ISO strings
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        })),
        // Convert Date objects to ISO strings for property
        createdAt: property.createdAt.toISOString(),
        updatedAt: property.updatedAt.toISOString(),
      })
    );

    return NextResponse.json({ properties });
  } catch (error) {
    console.error("Erreur lors de la récupération des propriétés:", error);
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
    const { name, address, description, propertyType } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Le nom de la propriété est requis" },
        { status: 400 }
      );
    }

    if (!propertyType || !propertyType.trim()) {
      return NextResponse.json(
        { error: "Le type de propriété est requis" },
        { status: 400 }
      );
    }

    // Validate property type
    const validPropertyTypes = ["hotel", "espace"];
    if (!validPropertyTypes.includes(propertyType)) {
      return NextResponse.json(
        { error: "Type de propriété invalide" },
        { status: 400 }
      );
    }

    // Récupérer l'organisation de l'utilisateur
    const userOrganisation = await prisma.userOrganisation.findFirst({
      where: { userId: session.user.id },
    });

    if (!userOrganisation) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    // Créer la propriété
    const property = await prisma.property.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        description: description?.trim() || null,
        propertyType: propertyType.trim(),
        organisationId: userOrganisation.organisationId,
      },
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la propriété:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
