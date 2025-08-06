import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PropertiesClient } from "@/components/properties/PropertiesClient";

export default async function PropertiesPage() {
  const session = await getServerSession(authOptions);

  const userOrganisation = await prisma.userOrganisation.findFirst({
    where: { userId: session!.user.id },
    include: {
      organisation: {
        include: {
          properties: {
            include: {
              rooms: true,
            },
          },
        },
      },
    },
  });

  const properties =
    userOrganisation?.organisation?.properties.map((property) => ({
      ...property,
      roomCount: property.rooms.length,
    })) || [];

  return <PropertiesClient initialProperties={properties} />;
}
