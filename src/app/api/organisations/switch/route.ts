import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { organisationId } = await request.json();

    if (!organisationId) {
      return NextResponse.json(
        { error: "L'ID de l'organisation est requis" },
        { status: 400 }
      );
    }

    // Verify that the user is a member of this organization
    const userOrganisation = await prisma.userOrganisation.findFirst({
      where: {
        userId: session.user.id,
        organisationId: organisationId,
      },
      include: {
        organisation: true,
      },
    });

    if (!userOrganisation) {
      return NextResponse.json(
        { error: "Vous n'êtes pas membre de cette organisation" },
        { status: 403 }
      );
    }

    // For now, we'll just return success since the current system doesn't store active org
    // The dashboard layout will pick the first organization the user has access to
    return NextResponse.json({
      success: true,
      organisation: userOrganisation.organisation,
    });
  } catch (error) {
    console.error("Error switching organisation:", error);
    return NextResponse.json(
      { error: "Erreur lors du changement d'organisation" },
      { status: 500 }
    );
  }
}
