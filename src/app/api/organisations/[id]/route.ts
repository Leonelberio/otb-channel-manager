import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: organisationId } = await context.params;

    // Verify that the current user is the owner of this organization
    const organisation = await prisma.organisation.findUnique({
      where: { id: organisationId },
      include: {
        _count: {
          select: {
            properties: true,
            userOrganisations: true,
          },
        },
      },
    });

    if (!organisation) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    if (organisation.ownerId !== session.user.id) {
      return NextResponse.json(
        {
          error:
            "Vous n'avez pas l'autorisation de supprimer cette organisation",
        },
        { status: 403 }
      );
    }

    // Check if there are any properties associated with this organization
    if (organisation._count.properties > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer une organisation qui contient des propriétés",
        },
        { status: 400 }
      );
    }

    // Delete the organization (this will cascade delete user associations)
    await prisma.organisation.delete({
      where: { id: organisationId },
    });

    return NextResponse.json({
      success: true,
      message: "Organisation supprimée avec succès",
    });
  } catch (error) {
    console.error("Error deleting organisation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'organisation" },
      { status: 500 }
    );
  }
}
