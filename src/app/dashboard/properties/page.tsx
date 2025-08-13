import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  Plus,
  Building2,
  MapPin,
  Hotel,
  Building,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default async function PropertiesPage() {
  const session = await getServerSession(authOptions);

  // Get user's organizations
  const userOrganisations = await prisma.userOrganisation.findMany({
    where: { userId: session!.user.id },
    include: {
      organisation: {
        include: {
          properties: {
            include: {
              rooms: true,
              propertySettings: true,
            },
          },
        },
      },
    },
  });

  // For now, use the first organization (in future, implement org switching)
  const currentUserOrg = userOrganisations[0];
  const organisation = currentUserOrg?.organisation;
  const properties = organisation?.properties || [];

  // Prepare organizations list for header
  const organizations = userOrganisations.map((uo) => ({
    id: uo.organisation.id,
    name: uo.organisation.name,
  }));

  const getPropertyIcon = (establishmentType: string) => {
    return establishmentType === "hotel" ? Hotel : Building;
  };

  const headerRightContent = (
    <div className="flex items-center space-x-3">
      <Link href="/dashboard/properties/new">
        <Button className="bg-main hover:bg-main-dark">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle propriété
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with org switch and user menu */}
      <AppHeader
        currentOrganisation={
          organisation
            ? { id: organisation.id, name: organisation.name }
            : undefined
        }
        organizations={organizations}
        showOrgSwitch={organizations.length > 1}
        title="Mes Propriétés"
        subtitle={
          organisation
            ? `${organisation.name} • ${properties.length} propriété${
                properties.length > 1 ? "s" : ""
              }`
            : undefined
        }
        rightContent={headerRightContent}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {properties.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-airbnb-charcoal mb-2">
              Aucune propriété trouvée
            </h2>
            <p className="text-airbnb-dark-gray mb-6 max-w-md mx-auto">
              Commencez par ajouter votre première propriété pour gérer vos
              chambres et réservations.
            </p>
            <Link href="/dashboard/properties/new">
              <Button className="bg-main hover:bg-main-dark">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter ma première propriété
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property: any) => {
              const PropertyIcon = getPropertyIcon(property.establishmentType);
              const unitTerminology =
                property.establishmentType === "hotel" ? "chambres" : "espaces";
              const currency = property.propertySettings?.currency || "XOF";

              return (
                <Link
                  key={property.id}
                  href={`/dashboard/properties/${property.id}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group-hover:border-main">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg ${
                            property.establishmentType === "hotel"
                              ? "bg-blue-100"
                              : "bg-green-100"
                          }`}
                        >
                          <PropertyIcon
                            className={`h-6 w-6 ${
                              property.establishmentType === "hotel"
                                ? "text-blue-600"
                                : "text-green-600"
                            }`}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-airbnb-charcoal text-lg group-hover:text-main transition-colors">
                            {property.name}
                          </h3>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {property.establishmentType === "hotel"
                              ? "Hôtel"
                              : "Espace"}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-main transition-colors" />
                    </div>

                    {property.address && (
                      <div className="flex items-start text-sm text-airbnb-dark-gray mb-4">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="break-words">{property.address}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-airbnb-charcoal">
                          {property.rooms.length}
                        </span>
                        <span className="text-airbnb-dark-gray ml-1">
                          {unitTerminology}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-airbnb-charcoal">
                          {currency}
                        </span>
                        <span className="text-airbnb-dark-gray ml-1">
                          devise
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-airbnb-dark-gray">
                          Gérer cette propriété
                        </span>
                        <ArrowRight className="h-4 w-4 text-main opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
