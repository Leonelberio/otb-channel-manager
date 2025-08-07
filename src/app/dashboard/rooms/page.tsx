import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoomsClient } from "@/components/rooms/RoomsClient";

export default async function RoomsPage() {
  const session = await getServerSession(authOptions);

  // Récupérer les préférences utilisateur pour la terminologie
  const userPreferences = await prisma.userPreferences.findUnique({
    where: { userId: session!.user.id },
  });

  const userOrganisation = await prisma.userOrganisation.findFirst({
    where: { userId: session!.user.id },
  });

  if (!userOrganisation) {
    return <div>Organisation introuvable</div>;
  }

  // Récupérer les espaces avec SQL brut pour inclure pricingType
  const roomsResult = await prisma.$queryRaw<
    Array<{
      id: string;
      propertyId: string;
      name: string;
      roomNumber: string | null;
      roomType: string | null;
      description: string | null;
      capacity: number | null;
      pricePerNight: string | null;
      pricingType: string | null;
      images: string[];
      createdAt: Date;
      updatedAt: Date;
      propertyName: string;
      equipmentCount: number;
      reservationCount: number;
    }>
  >`
    SELECT 
      r.id,
      r.property_id as "propertyId",
      r.name,
      r.room_number as "roomNumber",
      r.room_type as "roomType",
      r.description,
      r.capacity,
      r.price_per_night as "pricePerNight",
      r.pricing_type as "pricingType",
      r.images,
      r.created_at as "createdAt",
      r.updated_at as "updatedAt",
      p.name as "propertyName",
      COALESCE(eq.equipment_count, 0) as "equipmentCount",
      COALESCE(res.reservation_count, 0) as "reservationCount"
    FROM rooms r
    JOIN properties p ON r.property_id = p.id
    LEFT JOIN (
      SELECT room_id, COUNT(*) as equipment_count
      FROM equipments
      GROUP BY room_id
    ) eq ON r.id = eq.room_id
    LEFT JOIN (
      SELECT room_id, COUNT(*) as reservation_count
      FROM reservations
      WHERE status IN ('CONFIRMED', 'PENDING')
      GROUP BY room_id
    ) res ON r.id = res.room_id
    WHERE p.organisation_id = ${userOrganisation.organisationId}
    ORDER BY r.created_at DESC
  `;

  const allRooms = roomsResult.map((room) => ({
    ...room,
    pricePerNight: room.pricePerNight ? Number(room.pricePerNight) : null,
  }));

  // Récupérer les propriétés pour le dropdown du modal
  const properties = await prisma.property.findMany({
    where: { organisationId: userOrganisation.organisationId },
    select: {
      id: true,
      name: true,
    },
  });

  const unitTerminology =
    userPreferences?.establishmentType === "hotel" ? "Chambres" : "Espaces";

  // Récupérer la devise via SQL brut
  const userPreferencesResult = await prisma.$queryRaw<
    Array<{ currency: string }>
  >`
    SELECT currency FROM user_preferences WHERE user_id = ${session!.user.id}
  `;

  const currency = userPreferencesResult[0]?.currency || "EUR";

  return (
    <RoomsClient
      initialRooms={allRooms}
      properties={properties}
      unitTerminology={unitTerminology}
      currency={currency}
    />
  );
}
