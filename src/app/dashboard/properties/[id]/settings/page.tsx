import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PropertySettingsForm } from "@/components/settings/PropertySettingsForm";

interface PropertySettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertySettingsPage({
  params,
}: PropertySettingsPageProps) {
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
    include: {
      propertySettings: true,
    },
  });

  if (!property) {
    notFound();
  }

  // Create default settings if they don't exist
  let propertySettings = property.propertySettings;
  if (!propertySettings) {
    propertySettings = await prisma.propertySettings.create({
      data: {
        propertyId: property.id,
      },
    });
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-airbnb-charcoal">
          Paramètres - {property.name}
        </h1>
        <p className="text-airbnb-dark-gray mt-2">
          Configurez les paramètres spécifiques à cette propriété
        </p>
      </div>

      <PropertySettingsForm
        initialSettings={propertySettings}
        propertyId={property.id}
        propertyType={property.establishmentType}
      />
    </div>
  );
}
