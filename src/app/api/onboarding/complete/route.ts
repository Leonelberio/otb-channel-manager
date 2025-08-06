import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
    }

    const data = await req.json();
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

    // Mettre à jour l'organisation
    const userOrganisation = await prisma.userOrganisation.findFirst({
      where: {
        userId: session.user.id,
        role: "ADMIN",
      },
      include: {
        organisation: true,
      },
    });

    if (!userOrganisation) {
      return NextResponse.json(
        { message: "Organisation introuvable" },
        { status: 404 }
      );
    }

    // Mettre à jour le nom de l'organisation
    await prisma.organisation.update({
      where: { id: userOrganisation.organisationId },
      data: { name: organizationName },
    });

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

    // Créer la première propriété
    const property = await prisma.property.create({
      data: {
        organisationId: userOrganisation.organisationId,
        name: propertyName,
        address: propertyAddress,
        propertyType: propertyType,
      },
    });

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

    return NextResponse.json({
      message: "Onboarding complété avec succès",
      property,
      room,
    });
  } catch (error) {
    console.error("Erreur lors de l'onboarding:", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
