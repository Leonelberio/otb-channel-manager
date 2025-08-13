import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RoomsClient } from "@/components/rooms/RoomsClient";

interface PropertyRoomsPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyRoomsPage({
  params,
}: PropertyRoomsPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  // Verify property belongs to user's organization and get property details including settings
  const property = await prisma.property.findFirst({
    where: {
      id,
      organisation: {
        userOrganisations: {
          some: {
            userId: session!.user.id,
          },
        },
      },
    },
    include: {
      propertySettings: true,
    },
  });

  if (!property) {
    notFound();
  }

  // Get property currency (default to XOF if no settings)
  const propertyCurrency = property.propertySettings?.currency || "XOF";

  // Get rooms for this specific property
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
    WHERE p.id = ${id}
    ORDER BY r.created_at DESC
  `;

  const allRooms = roomsResult.map((room) => ({
    ...room,
    pricePerNight: room.pricePerNight ? Number(room.pricePerNight) : null,
  }));

  // Get all properties for the room creation modal (user can move rooms between properties)
  const userOrganisation = await prisma.userOrganisation.findFirst({
    where: { userId: session!.user.id },
    include: {
      organisation: {
        include: {
          properties: true,
        },
      },
    },
  });

  const allProperties =
    userOrganisation?.organisation?.properties.map((prop) => ({
      id: prop.id,
      name: prop.name,
      propertyType: prop.propertyType,
    })) || [];

  const unitTerminology =
    property.establishmentType === "hotel" ? "Chambres" : "Espaces";

  return (
    <RoomsClient
      initialRooms={allRooms}
      properties={allProperties}
      unitTerminology={unitTerminology}
      currency={propertyCurrency}
    />
  );
}
