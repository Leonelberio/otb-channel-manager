import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { type Currency } from "@/lib/currency";
import { ReservationsClient } from "@/components/reservations/ReservationsClient";

interface PropertyReservationsPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyReservationsPage({
  params,
}: PropertyReservationsPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  // Get user organization and check property access
  const userOrganisation = await prisma.userOrganisation.findFirst({
    where: { userId: session!.user.id },
    include: {
      organisation: {
        include: {
          properties: {
            where: { id }, // Filter for specific property
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

  const property = userOrganisation?.organisation?.properties[0];
  if (!property) {
    notFound();
  }

  const allReservations = property.rooms.flatMap((room) =>
    room.reservations.map((reservation) => ({
      id: reservation.id,
      roomId: reservation.roomId,
      guestName: reservation.guestName,
      guestEmail: reservation.guestEmail || undefined,
      startDate: reservation.startDate.toISOString(),
      endDate: reservation.endDate.toISOString(),
      startTime: reservation.startTime || undefined,
      duration: reservation.duration || undefined,
      status: reservation.status,
      totalPrice: reservation.totalPrice
        ? Number(reservation.totalPrice)
        : undefined,
      notes: reservation.notes || undefined,
      roomName: room.name,
      propertyName: property.name,
    }))
  );

  // Transform rooms for this specific property
  const rooms = property.rooms.map((room) => ({
    id: room.id,
    name: room.name,
    propertyName: property.name,
    pricePerNight: room.pricePerNight ? Number(room.pricePerNight) : 0,
    type: "space" as const, // Default to space type for now
  }));

  // Get currency from user preferences
  const userPreferencesResult = await prisma.$queryRaw<
    Array<{ currency: string }>
  >`
    SELECT currency FROM user_preferences WHERE user_id = ${session!.user.id}
  `;

  const currency = (userPreferencesResult[0]?.currency as Currency) || "XOF";

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Réservations - {property.name}
        </h1>
        <p className="text-gray-600 mt-2">
          Gérez toutes les réservations de cette propriété
        </p>
      </div>

      <ReservationsClient
        initialReservations={allReservations}
        rooms={rooms}
        currency={currency}
      />
    </div>
  );
}
