import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Building2 } from "lucide-react";

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

  const properties = userOrganisation?.organisation?.properties || [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-airbnb-charcoal">
            Propriétés
          </h1>
          <p className="text-airbnb-dark-gray mt-2">
            Gérez vos propriétés et leurs caractéristiques
          </p>
        </div>
        <Button
          variant="default"
          className="bg-airbnb-red hover:bg-airbnb-dark-red"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une propriété
        </Button>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-airbnb-charcoal mb-2">
            Aucune propriété
          </h3>
          <p className="text-airbnb-dark-gray mb-6">
            Commencez par ajouter votre première propriété
          </p>
          <Button
            variant="default"
            className="bg-airbnb-red hover:bg-airbnb-dark-red"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une propriété
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-airbnb-charcoal mb-2">
                    {property.name}
                  </h3>
                  {property.address && (
                    <div className="flex items-center text-sm text-airbnb-dark-gray mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property.address}
                    </div>
                  )}
                  <div className="text-sm text-airbnb-dark-gray">
                    {property.rooms.length} unité
                    {property.rooms.length > 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Gérer
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Modifier
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
