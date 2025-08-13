import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  console.log("🚀 API onboarding/complete appelée");

  try {
    const session = await getServerSession(authOptions);
    console.log("📝 Session:", session ? "✅ Présente" : "❌ Absente");

    if (!session?.user?.id) {
      console.log("❌ Non authentifié");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log("👤 User ID:", session.user.id);

    const data = await request.json();
    console.log("📦 Données reçues:", JSON.stringify(data, null, 2));
    const {
      organizationName,
      preferredLanguage,
      establishmentType,
      propertyName,
      propertyAddress,
      propertyType,
    } = data;

    console.log("👥 Vérification de l'utilisateur en base...");
    // Vérifier si l'utilisateur existe, sinon le créer
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      console.log("⚠️ Utilisateur non trouvé en base, création...");
      user = await prisma.user.create({
        data: {
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.name || "",
        },
      });
      console.log("✅ Utilisateur créé en base");
    } else {
      console.log("✅ Utilisateur trouvé en base");
    }

    console.log("🔍 Recherche de l'organisation utilisateur...");
    // Mettre à jour l'organisation
    let userOrganisation = await prisma.userOrganisation.findFirst({
      where: {
        userId: session.user.id,
        role: "ADMIN",
      },
      include: {
        organisation: true,
      },
    });

    if (!userOrganisation) {
      console.log(
        "⚠️ Aucune organisation trouvée, création d'une nouvelle organisation..."
      );

      // Créer une nouvelle organisation
      const newOrganisation = await prisma.organisation.create({
        data: {
          name: organizationName,
          ownerId: session.user.id,
        },
      });

      // Créer la relation UserOrganisation
      userOrganisation = await prisma.userOrganisation.create({
        data: {
          userId: session.user.id,
          organisationId: newOrganisation.id,
          role: "ADMIN",
        },
        include: {
          organisation: true,
        },
      });

      console.log("✅ Nouvelle organisation créée:", newOrganisation.name);
    } else {
      console.log(
        "✅ Organisation trouvée:",
        userOrganisation.organisation.name
      );

      console.log("📝 Mise à jour du nom de l'organisation...");
      // Mettre à jour le nom de l'organisation
      await prisma.organisation.update({
        where: { id: userOrganisation.organisationId },
        data: { name: organizationName },
      });
      console.log("✅ Nom de l'organisation mis à jour");
    }

    console.log("⚙️ Mise à jour des préférences utilisateur...");
    // Mettre à jour les préférences utilisateur (keep establishmentType for backwards compatibility)
    await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        establishmentType,
        preferredLanguage,
        onboardingCompleted: true,
      },
      create: {
        userId: session.user.id,
        establishmentType,
        preferredLanguage,
        onboardingCompleted: true,
      },
    });
    console.log("✅ Préférences utilisateur mises à jour");

    // Mettre à jour la devise séparément (contournement temporaire)
    console.log("💰 Mise à jour de la devise...");
    try {
      await prisma.$executeRaw`
        UPDATE user_preferences 
        SET currency = 'EUR' 
        WHERE user_id = ${session.user.id}
      `;
      console.log("✅ Devise mise à jour");
    } catch (error) {
      console.log(
        "⚠️ Note: Impossible de mettre à jour la devise, probablement car le champ n'existe pas encore"
      );
    }

    console.log("🏠 Création de la première propriété...");
    // Créer la première propriété avec le type d'établissement spécifique
    const property = await prisma.property.create({
      data: {
        organisationId: userOrganisation.organisationId,
        name: propertyName,
        address: propertyAddress,
        propertyType: propertyType,
        establishmentType: establishmentType, // Set property-specific establishment type
      },
    });
    console.log("✅ Propriété créée:", property.name);

    // Create default property settings
    console.log("⚙️ Création des paramètres par défaut de la propriété...");
    await prisma.propertySettings.create({
      data: {
        propertyId: property.id,
        currency: "XOF",
        timezone: "Europe/Paris",
        language: preferredLanguage,
        // Set appropriate default times based on establishment type
        defaultCheckinTime: establishmentType === "hotel" ? "15:00" : "08:00",
        defaultCheckoutTime: establishmentType === "hotel" ? "11:00" : "18:00",
      },
    });
    console.log("✅ Paramètres de propriété créés");

    // Set this property as the user's last active property
    console.log("🎯 Définition de la propriété comme propriété active...");
    await prisma.userPreferences.update({
      where: { userId: session.user.id },
      data: {
        lastActivePropertyId: property.id,
      },
    });
    console.log("✅ Propriété définie comme active");

    console.log("✅ Onboarding terminé avec succès !");

    return NextResponse.json({
      success: true,
      message: "Onboarding complété avec succès",
      property: {
        id: property.id,
        name: property.name,
        establishmentType: property.establishmentType,
      },
    });
  } catch (error) {
    console.error("💥 Erreur lors de l'onboarding:", error);
    console.error(
      "📍 Stack trace:",
      error instanceof Error ? error.stack : "Pas de stack trace"
    );
    return NextResponse.json(
      {
        error: "Erreur interne du serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
