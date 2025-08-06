import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPreferencesWithDefaults } from "@/lib/user-preferences";
import { ReservationsClient } from "@/components/reservations/ReservationsClient";

export default async function ReservationsPage() {
  const session = await getServerSession(authOptions);

  // Récupérer les réservations
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
          id: reservation.id,
          roomId: reservation.roomId,
          guestName: reservation.guestName,
          guestEmail: reservation.guestEmail || undefined,
          startDate: reservation.startDate.toISOString(),
          endDate: reservation.endDate.toISOString(),
          status: reservation.status,
          totalPrice: reservation.totalPrice
            ? Number(reservation.totalPrice)
            : undefined,
          notes: reservation.notes || undefined,
          roomName: room.name,
          propertyName: property.name,
        }))
      )
    ) || [];

  // Récupérer les espaces pour le formulaire
  const rooms =
    userOrganisation?.organisation?.properties.flatMap((property) =>
      property.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        propertyName: property.name,
        pricePerNight: Number(room.pricePerNight),
      }))
    ) || [];

  // Récupérer les préférences utilisateur pour la devise
  const userPreferences = await getUserPreferencesWithDefaults(
    session!.user.id
  );

  return (
    <ReservationsClient
      initialReservations={allReservations}
      rooms={rooms}
      currency={userPreferences.currency}
    />
  );
}
