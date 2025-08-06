import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus, Users, Calendar, Mail } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function ReservationsPage() {
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
                  reservations: {
                    orderBy: {
                      createdAt: "desc",
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

  const allReservations =
    userOrganisation?.organisation?.properties.flatMap((property) =>
      property.rooms.flatMap((room) =>
        room.reservations.map((reservation) => ({
          ...reservation,
          roomName: room.name,
          propertyName: property.name,
        }))
      )
    ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "Confirmée";
      case "PENDING":
        return "En attente";
      case "CANCELLED":
        return "Annulée";
      case "COMPLETED":
        return "Terminée";
      default:
        return status;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-airbnb-charcoal">
            Réservations
          </h1>
          <p className="text-airbnb-dark-gray mt-2">
            Gérez toutes vos réservations
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

      {allReservations.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-airbnb-charcoal mb-2">
            Aucune réservation
          </h3>
          <p className="text-airbnb-dark-gray mb-6">
            Les réservations apparaîtront ici
          </p>
          <Button
            variant="default"
            className="bg-airbnb-red hover:bg-airbnb-dark-red"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle réservation
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-airbnb-charcoal">
              Toutes les réservations
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {allReservations.map((reservation) => (
              <div key={reservation.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-airbnb-charcoal">
                          {reservation.guestName}
                        </h3>
                        {reservation.guestEmail && (
                          <div className="flex items-center text-sm text-airbnb-dark-gray mt-1">
                            <Mail className="h-4 w-4 mr-1" />
                            {reservation.guestEmail}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-airbnb-dark-gray mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(
                            new Date(reservation.startDate),
                            "dd MMM yyyy",
                            { locale: fr }
                          )}{" "}
                          -{" "}
                          {format(
                            new Date(reservation.endDate),
                            "dd MMM yyyy",
                            { locale: fr }
                          )}
                        </div>
                        <div className="text-sm text-airbnb-dark-gray mt-1">
                          {reservation.propertyName} • {reservation.roomName}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            reservation.status
                          )}`}
                        >
                          {getStatusLabel(reservation.status)}
                        </span>
                        {reservation.totalPrice && (
                          <div className="text-lg font-semibold text-airbnb-charcoal mt-2">
                            {reservation.totalPrice.toString()}€
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
