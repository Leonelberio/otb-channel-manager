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

    // Vérifier que l'utilisateur a accès à cette chambre/espace
    const userOrganisation = await prisma.userOrganisation.findFirst({
      where: { userId: session.user.id },
    });

    if (!userOrganisation) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que la chambre/espace existe et appartient à l'organisation
    const existingRoom = await prisma.room.findFirst({
      where: {
        id,
        property: {
          organisationId: userOrganisation.organisationId,
        },
      },
    });

    if (!existingRoom) {
      return NextResponse.json(
        { error: "Chambre/Espace introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que la nouvelle propriété appartient à l'organisation
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

    // Mettre à jour la chambre/espace
    const room = await prisma.room.update({
      where: { id },
      data: {
        name: name.trim(),
        capacity: capacity || null,
        pricePerNight: pricePerNight || null,
        description: description?.trim() || null,
        propertyId,
      },
    });

    return NextResponse.json({ room });
  } catch (error) {
    console.error("Erreur lors de la modification de la chambre:", error);
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

    // Vérifier que l'utilisateur a accès à cette chambre/espace
    const userOrganisation = await prisma.userOrganisation.findFirst({
      where: { userId: session.user.id },
    });

    if (!userOrganisation) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que la chambre/espace existe et appartient à l'organisation
    const existingRoom = await prisma.room.findFirst({
      where: {
        id,
        property: {
          organisationId: userOrganisation.organisationId,
        },
      },
      include: {
        reservations: true,
      },
    });

    if (!existingRoom) {
      return NextResponse.json(
        { error: "Chambre/Espace introuvable" },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des réservations actives
    const activeReservations = existingRoom.reservations.filter(
      (reservation) =>
        reservation.status === "CONFIRMED" || reservation.status === "PENDING"
    );

    if (activeReservations.length > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer cette chambre/espace car elle contient des réservations actives",
        },
        { status: 400 }
      );
    }

    // Supprimer la chambre/espace (cascade supprimera automatiquement les équipements, etc.)
    await prisma.room.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Chambre/Espace supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la chambre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
