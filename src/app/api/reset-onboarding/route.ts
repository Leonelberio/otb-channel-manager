import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Réinitialiser l'onboarding
    await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        onboardingCompleted: false,
      },
      create: {
        userId: session.user.id,
        establishmentType: "hotel",
        preferredLanguage: "fr",
        currency: "EUR",
        onboardingCompleted: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Onboarding réinitialisé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la réinitialisation de l'onboarding:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
