import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID requis" },
        { status: 400 }
      );
    }

    // Récupérer l'organisation
    const organization = await prisma.organisation.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer la devise via SQL brut
    const userPreferencesResult = await prisma.$queryRaw<
      Array<{ currency: string }>
    >`
      SELECT currency FROM user_preferences WHERE user_id = ${organization.ownerId}
    `;

    // Récupérer les espaces avec pricingType via SQL brut
    const roomsResult = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        pricePerNight: string | null;
        pricingType: string | null;
        propertyName: string;
      }>
    >`
      SELECT 
        r.id,
        r.name,
        r.price_per_night as "pricePerNight",
        r.pricing_type as "pricingType",
        p.name as "propertyName"
      FROM rooms r
      JOIN properties p ON r.property_id = p.id
      WHERE p.organisation_id = ${orgId}
      ORDER BY r.created_at DESC
    `;

    // Convertir et formater les données
    const rooms = roomsResult.map((room) => ({
      id: room.id,
      name: room.name,
      propertyName: room.propertyName,
      pricePerNight: Number(room.pricePerNight || 0),
      pricingType: room.pricingType || "night",
    }));

    // Récupérer la devise des préférences utilisateur ou utiliser EUR par défaut
    const currency = userPreferencesResult[0]?.currency || "EUR";

    return NextResponse.json({
      rooms,
      currency,
      organizationName: organization.name,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des espaces:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
