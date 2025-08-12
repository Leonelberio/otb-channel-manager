import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: organisationId } = await context.params;

    // Verify that the organization exists
    const organisation = await prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!organisation) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    // Check if the user is the owner
    if (organisation.ownerId === session.user.id) {
      return NextResponse.json(
        { error: "Le propriétaire ne peut pas quitter sa propre organisation" },
        { status: 400 }
      );
    }

    // Find the user's membership
    const userOrganisation = await prisma.userOrganisation.findFirst({
      where: {
        userId: session.user.id,
        organisationId: organisationId,
      },
    });

    if (!userOrganisation) {
      return NextResponse.json(
        { error: "Vous n'êtes pas membre de cette organisation" },
        { status: 400 }
      );
    }

    // Remove the user from the organization
    await prisma.userOrganisation.delete({
      where: { id: userOrganisation.id },
    });

    return NextResponse.json({
      success: true,
      message: "Vous avez quitté l'organisation avec succès",
    });
  } catch (error) {
    console.error("Error leaving organisation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sortie de l'organisation" },
      { status: 500 }
    );
  }
}
