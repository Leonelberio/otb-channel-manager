import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PropertyOverviewClient } from "@/components/property/PropertyOverviewClient";

interface PropertyPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  // Get property with all related data including settings
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
      rooms: {
        include: {
          reservations: {
            where: {
              status: "CONFIRMED",
            },
          },
          equipments: true,
        },
      },
    },
  });

  if (!property) {
    notFound();
  }

  // Get all properties for the room creation modal
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

  return (
    <PropertyOverviewClient
      property={{
        id: property.id,
        name: property.name,
        establishmentType: property.establishmentType,
        address: property.address,
        description: property.description,
        rooms: property.rooms.map((room) => ({
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          pricePerNight: room.pricePerNight ? Number(room.pricePerNight) : null,
          reservations: room.reservations,
          equipments: room.equipments,
        })),
        propertySettings: property.propertySettings,
      }}
      allProperties={allProperties}
    />
  );
}
