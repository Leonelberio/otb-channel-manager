import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EquipmentsClient } from "@/components/equipments/EquipmentsClient";

export default async function EquipmentsPage() {
  const session = await getServerSession(authOptions);

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

  // Flatten equipments with room and property info
  const allEquipments = properties.flatMap((property) =>
    property.rooms.flatMap((room) =>
      room.equipments.map((equipment) => ({
        ...equipment,
        roomName: room.name,
        propertyName: property.name,
      }))
    )
  );

  // Flatten rooms with property info for the dropdown
  const allRooms = properties.flatMap((property) =>
    property.rooms.map((room) => ({
      id: room.id,
      name: room.name,
      propertyName: property.name,
    }))
  );

  return (
    <EquipmentsClient initialEquipments={allEquipments} rooms={allRooms} />
  );
}
