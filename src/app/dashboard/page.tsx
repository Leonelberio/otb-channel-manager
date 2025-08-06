import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Calendar, Users } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Récupérer les données de l'utilisateur
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
  const totalRooms = properties.reduce(
    (acc, property) => acc + property.rooms.length,
    0
  );
  const totalReservations = properties.reduce(
    (acc, property) =>
      acc +
      property.rooms.reduce(
        (roomAcc, room) => roomAcc + room.reservations.length,
        0
      ),
    0
  );

  const unitTerminology =
    userPreferences?.establishmentType === "hotel" ? "chambres" : "espaces";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-airbnb-charcoal">
              Tableau de bord
            </h1>
            <p className="text-airbnb-dark-gray mt-2">
              Bienvenue, {session?.user?.name}
            </p>
          </div>
          <Button
            variant="default"
            className="bg-airbnb-red hover:bg-airbnb-dark-red"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle réservation
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-airbnb-dark-gray">
                Propriétés
              </p>
              <p className="text-3xl font-bold text-airbnb-charcoal">
                {properties.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-airbnb-dark-gray">
                Total {unitTerminology}
              </p>
              <p className="text-3xl font-bold text-airbnb-charcoal">
                {totalRooms}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-airbnb-dark-gray">
                Réservations actives
              </p>
              <p className="text-3xl font-bold text-airbnb-charcoal">
                {totalReservations}
              </p>
            </div>
            <div className="w-12 h-12 bg-airbnb-red/10 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-airbnb-red" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-airbnb-dark-gray">
                Taux d&apos;occupation
              </p>
              <p className="text-3xl font-bold text-airbnb-charcoal">78%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Properties List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-airbnb-charcoal">
              Vos propriétés
            </h2>
            <Button variant="outline" size="sm">
              Voir tout
            </Button>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-airbnb-dark-gray mb-4">
                Aucune propriété trouvée
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
            <div className="space-y-4">
              {properties.slice(0, 3).map((property) => (
                <div
                  key={property.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-airbnb-charcoal">
                        {property.name}
                      </h3>
                      {property.address && (
                        <p className="text-sm text-airbnb-dark-gray mt-1">
                          {property.address}
                        </p>
                      )}
                      <p className="text-sm text-airbnb-dark-gray mt-2">
                        {property.rooms.length} {unitTerminology.toLowerCase()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Gérer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-airbnb-charcoal mb-4">
            Actions rapides
          </h2>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              📅 Voir le planning
            </Button>
            <Button variant="outline" className="w-full justify-start">
              ➕ Nouvelle réservation
            </Button>
            <Button variant="outline" className="w-full justify-start">
              🏠 Ajouter une propriété
            </Button>
            <Button variant="outline" className="w-full justify-start">
              ⚙️ Paramètres
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-airbnb-charcoal mb-3">
              Prochaines étapes
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-airbnb-red rounded-full"></div>
                <span>Connecter Google Calendar</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>Ajouter des équipements</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>Configurer les règles de check-in</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
