"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Building2, MapPin, Calendar, Users, Coins } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { formatCurrency, type Currency } from "@/lib/currency";
import { RoomModal } from "@/components/rooms/RoomModal";
import Link from "next/link";

interface Reservation {
  id: string;
  totalPrice: number | null;
}

interface Equipment {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  capacity: number | null;
  pricePerNight: number | null;
  reservations: Reservation[];
  equipments: Equipment[];
}

interface Property {
  id: string;
  name: string;
  establishmentType: string;
  address: string | null;
  description: string | null;
  rooms: Room[];
  propertySettings: {
    currency: string;
  } | null;
}

interface PropertyOverviewClientProps {
  property: Property;
  allProperties: Array<{
    id: string;
    name: string;
    propertyType: string | null;
  }>;
}

export function PropertyOverviewClient({
  property,
  allProperties,
}: PropertyOverviewClientProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Get property currency (default to XOF if no settings)
  const propertyCurrency = property.propertySettings?.currency || "XOF";

  const unitTerminology =
    property.establishmentType === "hotel" ? "Chambres" : "Espaces";
  const totalRooms = property.rooms.length;
  const totalReservations = property.rooms.reduce(
    (acc, room) => acc + room.reservations.length,
    0
  );
  const totalEquipments = property.rooms.reduce(
    (acc, room) => acc + room.equipments.length,
    0
  );

  // Calculate revenue for this property
  const totalRevenue = property.rooms.reduce(
    (acc, room) =>
      acc +
      room.reservations.reduce(
        (resAcc: number, reservation: Reservation) =>
          resAcc +
          (reservation.totalPrice ? Number(reservation.totalPrice) : 0),
        0
      ),
    0
  );

  const handleCreateRoom = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Building2 className="h-8 w-8 text-main" />
              <h1 className="text-3xl font-bold text-airbnb-charcoal">
                {property.name}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {property.establishmentType === "hotel" ? "Hôtel" : "Espace"}
              </span>
            </div>
            {property.address && (
              <div className="flex items-center text-airbnb-dark-gray">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{property.address}</span>
              </div>
            )}
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={handleCreateRoom}
              className="bg-main hover:bg-main-dark"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter{" "}
              {unitTerminology === "Chambres" ? "une chambre" : "un espace"}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title={unitTerminology}
          value={totalRooms}
          icon={<Building2 className="h-5 w-5" />}
          isMonetary={false}
        />
        <StatsCard
          title="Réservations actives"
          value={totalReservations}
          icon={<Calendar className="h-5 w-5" />}
          isMonetary={false}
        />
        <StatsCard
          title="Équipements"
          value={totalEquipments}
          icon={<Users className="h-5 w-5" />}
          isMonetary={false}
        />
        <StatsCard
          title="Revenus"
          value={totalRevenue}
          currency={propertyCurrency as Currency}
          icon={<Coins className="h-5 w-5" />}
          isMonetary={true}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rooms Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-airbnb-charcoal">
              {unitTerminology}
            </h2>
            <Link href={`/dashboard/properties/${property.id}/rooms`}>
              <Button variant="outline" size="sm">
                Voir tout
              </Button>
            </Link>
          </div>

          {property.rooms.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-airbnb-dark-gray mb-4">
                Aucun {unitTerminology.toLowerCase()} trouvé
              </p>
              <Button
                onClick={handleCreateRoom}
                className="bg-main hover:bg-main-dark"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter{" "}
                {unitTerminology === "Chambres" ? "une chambre" : "un espace"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {property.rooms.slice(0, 5).map((room) => (
                <div
                  key={room.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-airbnb-charcoal">
                      {room.name}
                    </h3>
                    <p className="text-sm text-airbnb-dark-gray">
                      {room.capacity
                        ? `${room.capacity} personnes`
                        : "Capacité non définie"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-main">
                      {room.pricePerNight
                        ? formatCurrency(
                            room.pricePerNight,
                            propertyCurrency as Currency
                          )
                        : "Prix non défini"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {room.reservations.length} réservation
                      {room.reservations.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-airbnb-charcoal mb-6">
            Actions rapides
          </h2>
          <div className="space-y-4">
            <Link href={`/dashboard/properties/${property.id}/rooms`}>
              <Button variant="outline" className="w-full justify-start">
                🛏️ Gérer les {unitTerminology.toLowerCase()}
              </Button>
            </Link>
            <Link href={`/dashboard/properties/${property.id}/equipments`}>
              <Button variant="outline" className="w-full justify-start">
                🛠️ Gérer les équipements
              </Button>
            </Link>
            <Link href={`/dashboard/properties/${property.id}/calendar`}>
              <Button variant="outline" className="w-full justify-start">
                📅 Voir le planning
              </Button>
            </Link>
            <Link href={`/dashboard/properties/${property.id}/reservations`}>
              <Button variant="outline" className="w-full justify-start">
                📋 Gérer les réservations
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Room Creation Modal */}
      <RoomModal
        room={{
          propertyId: property.id,
          name: "",
          capacity: null,
          pricePerNight: null,
          pricingType: "night",
          description: null,
        }}
        properties={allProperties}
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        mode="create"
        unitTerminology={unitTerminology}
        currency={propertyCurrency as Currency}
      />
    </div>
  );
}
