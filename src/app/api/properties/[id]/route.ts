import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { name, address, description, propertyType, establishmentType } =
      body;

    // If only establishmentType is being updated
    if (
      establishmentType &&
      !name &&
      !address &&
      !description &&
      !propertyType
    ) {
      // Validate establishment type
      const validEstablishmentTypes = ["hotel", "espace"];
      if (!validEstablishmentTypes.includes(establishmentType)) {
        return NextResponse.json(
          { error: "Type d'établissement invalide" },
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

      const existingProperty = await prisma.property.findFirst({
        where: {
          id,
          organisationId: userOrganisation.organisationId,
        },
      });

      if (!existingProperty) {
        return NextResponse.json(
          { error: "Propriété introuvable" },
          { status: 404 }
        );
      }

      // Mettre à jour seulement le type d'établissement
      const property = await prisma.property.update({
        where: { id },
        data: {
          establishmentType: establishmentType.trim(),
        },
      });

      return NextResponse.json({ property });
    }

    // Original validation for full property updates
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

    const existingProperty = await prisma.property.findFirst({
      where: {
        id,
        organisationId: userOrganisation.organisationId,
      },
    });

    if (!existingProperty) {
      return NextResponse.json(
        { error: "Propriété introuvable" },
        { status: 404 }
      );
    }

    // Mettre à jour la propriété
    const property = await prisma.property.update({
      where: { id },
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        description: description?.trim() || null,
        propertyType: propertyType.trim(),
      },
    });

    return NextResponse.json({ property });
  } catch (error) {
    console.error("Erreur lors de la modification de la propriété:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
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

    const existingProperty = await prisma.property.findFirst({
      where: {
        id,
        organisationId: userOrganisation.organisationId,
      },
      include: {
        rooms: {
          include: {
            reservations: true,
          },
        },
      },
    });

    if (!existingProperty) {
      return NextResponse.json(
        { error: "Propriété introuvable" },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des réservations actives
    const activeReservations = existingProperty.rooms.flatMap((room) =>
      room.reservations.filter(
        (reservation) =>
          reservation.status === "CONFIRMED" || reservation.status === "PENDING"
      )
    );

    if (activeReservations.length > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer cette propriété car elle contient des réservations actives",
        },
        { status: 400 }
      );
    }

    // Supprimer la propriété (cascade supprimera automatiquement les chambres, équipements, etc.)
    await prisma.property.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Propriété supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la propriété:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
