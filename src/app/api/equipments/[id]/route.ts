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

    // Vérifier que l'utilisateur a accès à cet équipement
    const userOrganisation = await prisma.userOrganisation.findFirst({
      where: { userId: session.user.id },
    });

    if (!userOrganisation) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que l'équipement existe et appartient à l'organisation
    const existingEquipment = await prisma.equipment.findFirst({
      where: {
        id,
        room: {
          property: {
            organisationId: userOrganisation.organisationId,
          },
        },
      },
    });

    if (!existingEquipment) {
      return NextResponse.json(
        { error: "Équipement introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que la nouvelle chambre/espace appartient à l'organisation
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

    // Mettre à jour l'équipement
    const equipment = await prisma.equipment.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || "package",
        roomId,
      },
    });

    return NextResponse.json({ equipment });
  } catch (error) {
    console.error("Erreur lors de la modification de l'équipement:", error);
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

    // Vérifier que l'utilisateur a accès à cet équipement
    const userOrganisation = await prisma.userOrganisation.findFirst({
      where: { userId: session.user.id },
    });

    if (!userOrganisation) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que l'équipement existe et appartient à l'organisation
    const existingEquipment = await prisma.equipment.findFirst({
      where: {
        id,
        room: {
          property: {
            organisationId: userOrganisation.organisationId,
          },
        },
      },
    });

    if (!existingEquipment) {
      return NextResponse.json(
        { error: "Équipement introuvable" },
        { status: 404 }
      );
    }

    // Supprimer l'équipement
    await prisma.equipment.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Équipement supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'équipement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
