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

    // Récupérer les préférences utilisateur
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
    });

    // Si pas de préférences, créer des préférences par défaut
    if (!preferences) {
      const defaultPreferences = await prisma.userPreferences.create({
        data: {
          userId: session.user.id,
          establishmentType: "hotel",
          preferredLanguage: "fr",
          currency: "EUR",
          onboardingCompleted: false,
          widgetPrimaryColor: "#8ABF37",
          widgetButtonColor: "#8ABF37",
        },
      });
      return NextResponse.json({ preferences: defaultPreferences });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Erreur lors de la récupération des préférences:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const {
      establishmentType,
      preferredLanguage,
      currency,
      widgetPrimaryColor,
      widgetButtonColor,
    } = body;

    // Validation
    if (!establishmentType || !preferredLanguage || !currency) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que les valeurs sont valides
    const validEstablishmentTypes = ["hotel", "espace"];
    const validLanguages = ["fr", "en"];
    const validCurrencies = ["EUR", "USD", "XOF"];

    if (!validEstablishmentTypes.includes(establishmentType)) {
      return NextResponse.json(
        { error: "Type d'établissement invalide" },
        { status: 400 }
      );
    }

    if (!validLanguages.includes(preferredLanguage)) {
      return NextResponse.json({ error: "Langue invalide" }, { status: 400 });
    }

    if (!validCurrencies.includes(currency)) {
      return NextResponse.json({ error: "Devise invalide" }, { status: 400 });
    }

    // Validation des couleurs (format hexadécimal)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (widgetPrimaryColor && !hexColorRegex.test(widgetPrimaryColor)) {
      return NextResponse.json(
        { error: "Couleur principale invalide" },
        { status: 400 }
      );
    }

    if (widgetButtonColor && !hexColorRegex.test(widgetButtonColor)) {
      return NextResponse.json(
        { error: "Couleur de bouton invalide" },
        { status: 400 }
      );
    }

    // Mettre à jour ou créer les préférences utilisateur
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        establishmentType,
        preferredLanguage,
        currency,
        widgetPrimaryColor: widgetPrimaryColor || "#8ABF37",
        widgetButtonColor: widgetButtonColor || "#8ABF37",
      },
      create: {
        userId: session.user.id,
        establishmentType,
        preferredLanguage,
        currency,
        widgetPrimaryColor: widgetPrimaryColor || "#8ABF37",
        widgetButtonColor: widgetButtonColor || "#8ABF37",
      },
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des préférences:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
