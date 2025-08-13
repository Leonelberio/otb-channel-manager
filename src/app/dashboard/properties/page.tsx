import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PropertiesPageClient } from "@/components/properties/PropertiesPageClient";

export default async function PropertiesPage() {
  const session = await getServerSession(authOptions);

  // Get user's organizations
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

  const organisation = userOrganisation?.organisation;
  const properties = organisation?.properties || [];

  return (
    <PropertiesPageClient
      organisation={organisation}
      properties={properties.map((property) => ({
        id: property.id,
        name: property.name,
        address: property.address,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        establishmentType: (property as any).establishmentType,
        rooms: property.rooms,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        propertySettings: (property as any).propertySettings,
      }))}
    />
  );
}
