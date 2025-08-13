import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EquipmentsClient } from "@/components/equipments/EquipmentsClient";

interface PropertyEquipmentsPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyEquipmentsPage({
  params,
}: PropertyEquipmentsPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  // Verify property belongs to user's organization and get property details
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
    select: {
      id: true,
      name: true,
      establishmentType: true,
    },
  });

  if (!property) {
    notFound();
  }

  // Get all equipments for rooms in this property
  const equipments = await prisma.equipment.findMany({
    where: {
      room: {
        propertyId: id,
      },
    },
    include: {
      room: {
        select: {
          id: true,
          name: true,
          property: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  // Transform the data to match the expected format
  const transformedEquipments = equipments.map((equipment) => ({
    ...equipment,
    propertyName: equipment.room.property.name,
    roomName: equipment.room.name,
  }));

  // Get all rooms in this property for the equipment creation modal
  const rooms = await prisma.room.findMany({
    where: {
      propertyId: id,
    },
    select: {
      id: true,
      name: true,
      property: {
        select: {
          name: true,
        },
      },
    },
  });

  const transformedRooms = rooms.map((room) => ({
    id: room.id,
    name: room.name,
    propertyName: room.property.name,
  }));

  const unitTerminology =
    property.establishmentType === "hotel" ? "chambres" : "espaces";

  return (
    <EquipmentsClient
      initialEquipments={transformedEquipments}
      rooms={transformedRooms}
      unitTerminology={unitTerminology}
    />
  );
}
