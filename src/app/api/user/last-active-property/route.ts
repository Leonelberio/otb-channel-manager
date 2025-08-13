import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { propertyId } = await request.json();

    if (!propertyId) {
      return NextResponse.json({ error: "PropertyId requis" }, { status: 400 });
    }

    // Verify the property belongs to the user's organization
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        organisation: {
          userOrganisations: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Propriété non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    // Update user's last active property
    await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        lastActivePropertyId: propertyId,
      },
      create: {
        userId: session.user.id,
        lastActivePropertyId: propertyId,
        establishmentType: "hotel",
        preferredLanguage: "fr",
        currency: "XOF",
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Propriété active mise à jour",
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour de la propriété active:",
      error
    );
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
