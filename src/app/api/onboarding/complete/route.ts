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
      unitName,
      capacity,
      pricePerNight,
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
    // Mettre à jour les préférences utilisateur
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
    // Créer la première propriété
    const property = await prisma.property.create({
      data: {
        organisationId: userOrganisation.organisationId,
        name: propertyName,
        address: propertyAddress,
        propertyType: propertyType,
      },
    });
    console.log("✅ Propriété créée:", property.name);

    console.log("🛏️ Création de la première chambre/espace...");
    // Créer la première chambre/espace
    const room = await prisma.room.create({
      data: {
        propertyId: property.id,
        name: unitName,
        capacity: capacity,
        pricePerNight: pricePerNight,
        roomType: establishmentType === "hotel" ? "standard" : "meeting",
      },
    });
    console.log("✅ Chambre/espace créé:", room.name);

    console.log("📅 Création des disponibilités...");
    // Créer les disponibilités par défaut pour les 90 prochains jours
    const availabilities = [];
    const startDate = new Date();
    for (let i = 0; i < 90; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      availabilities.push({
        roomId: room.id,
        startDate: date,
        endDate: date,
        status: "AVAILABLE" as const,
      });
    }

    await prisma.availability.createMany({
      data: availabilities,
    });

    console.log("✅ Onboarding terminé avec succès !");

    return NextResponse.json({
      success: true,
      message: "Onboarding complété avec succès",
      property,
      room,
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
