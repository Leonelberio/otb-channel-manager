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
    include: {
      organisation: {
        include: {
          properties: {
            include: {
              rooms: {
                include: {
                  equipments: true,
                  reservations: {
                    where: {
                      status: {
                        in: ["CONFIRMED", "PENDING"],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const organisation = userOrganisation?.organisation;
  const properties = organisation?.properties || [];

  // Flatten rooms with property info
  const allRooms = properties.flatMap((property) =>
    property.rooms.map((room) => ({
      ...room,
      pricePerNight: room.pricePerNight ? Number(room.pricePerNight) : null,
      propertyName: property.name,
      equipmentCount: room.equipments.length,
      reservationCount: room.reservations.length,
    }))
  );

  // Extract properties for the modal dropdown
  const propertiesForModal = properties.map((property) => ({
    id: property.id,
    name: property.name,
  }));

  const unitTerminology =
    userPreferences?.establishmentType === "hotel" ? "Chambres" : "Espaces";

  const currency = (userPreferences?.currency as any) || "EUR";

  return (
    <RoomsClient
      initialRooms={allRooms}
      properties={propertiesForModal}
      unitTerminology={unitTerminology}
      currency={currency}
    />
  );
}
