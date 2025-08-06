import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus, BedDouble, Users, Wifi, Car, Coffee } from "lucide-react";

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
                      status: "CONFIRMED",
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

  const allRooms = properties.flatMap((property) =>
    property.rooms.map((room) => ({
      ...room,
      propertyName: property.name,
    }))
  );

  const unitTerminology =
    userPreferences?.establishmentType === "hotel" ? "Chambres" : "Espaces";
  const unitTerminologySingular =
    userPreferences?.establishmentType === "hotel" ? "chambre" : "espace";

  const getEquipmentIcon = (equipmentName: string) => {
    const name = equipmentName.toLowerCase();
    if (name.includes("wifi") || name.includes("internet"))
      return <Wifi className="h-4 w-4" />;
    if (name.includes("parking") || name.includes("garage"))
      return <Car className="h-4 w-4" />;
    if (
      name.includes("café") ||
      name.includes("coffee") ||
      name.includes("cuisine")
    )
      return <Coffee className="h-4 w-4" />;
    return <BedDouble className="h-4 w-4" />;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-airbnb-charcoal">
            {unitTerminology}
          </h1>
          <p className="text-airbnb-dark-gray mt-2">
            Gérez vos {unitTerminology.toLowerCase()} et leurs équipements
          </p>
        </div>
        <Button
          variant="default"
          className="bg-airbnb-red hover:bg-airbnb-dark-red"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter {unitTerminologySingular === "chambre" ? "une" : "un"}{" "}
          {unitTerminologySingular}
        </Button>
      </div>

      {allRooms.length === 0 ? (
        <div className="text-center py-16">
          <BedDouble className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-airbnb-charcoal mb-2">
            Aucun{unitTerminologySingular === "chambre" ? "e" : ""}{" "}
            {unitTerminologySingular}
          </h3>
          <p className="text-airbnb-dark-gray mb-6">
            Commencez par ajouter votre{" "}
            {unitTerminologySingular === "chambre"
              ? "première chambre"
              : "premier espace"}
          </p>
          <Button
            variant="default"
            className="bg-airbnb-red hover:bg-airbnb-dark-red"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter {unitTerminologySingular === "chambre" ? "une" : "un"}{" "}
            {unitTerminologySingular}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-airbnb-charcoal mb-2">
                    {room.name}
                  </h3>
                  <p className="text-sm text-airbnb-dark-gray mb-2">
                    {room.propertyName}
                  </p>

                  {room.capacity && (
                    <div className="flex items-center text-sm text-airbnb-dark-gray mb-2">
                      <Users className="h-4 w-4 mr-1" />
                      {room.capacity} personne{room.capacity > 1 ? "s" : ""}
                    </div>
                  )}

                  {room.pricePerNight && (
                    <div className="text-lg font-semibold text-airbnb-red mb-3">
                      {room.pricePerNight.toString()}€ / nuit
                    </div>
                  )}

                  {/* Équipements */}
                  {room.equipments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-airbnb-charcoal mb-2">
                        Équipements
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {room.equipments.slice(0, 3).map((equipment) => (
                          <div
                            key={equipment.id}
                            className="flex items-center bg-gray-100 rounded-full px-2 py-1 text-xs"
                          >
                            {getEquipmentIcon(equipment.name)}
                            <span className="ml-1">{equipment.name}</span>
                          </div>
                        ))}
                        {room.equipments.length > 3 && (
                          <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 text-xs">
                            +{room.equipments.length - 3} autres
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Statut */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        room.reservations.length > 0
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {room.reservations.length > 0 ? "Occupé" : "Disponible"}
                    </span>
                    {room.reservations.length > 0 && (
                      <span className="text-xs text-airbnb-dark-gray">
                        {room.reservations.length} réservation
                        {room.reservations.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Planning
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
