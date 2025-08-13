"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Building2,
  MapPin,
  Calendar,
  Users,
  Coins,
  Clock,
  CreditCard,
  CheckCircle,
  Settings,
  BookOpen,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { formatCurrency, type Currency } from "@/lib/currency";
import { RoomModal } from "@/components/rooms/RoomModal";
import Link from "next/link";
import {
  isToday,
  isThisWeek,
  isThisMonth,
  isThisYear,
  parseISO,
  startOfDay,
  endOfDay,
  subDays,
  subWeeks,
  subMonths,
  subYears,
} from "date-fns";

interface Reservation {
  id: string;
  status: string;
  totalPrice: number | null;
  createdAt: string | Date;
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
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  // Get property currency (default to XOF if no settings)
  const propertyCurrency = property.propertySettings?.currency || "XOF";

  const unitTerminology =
    property.establishmentType === "hotel" ? "Chambres" : "Espaces";
  const totalRooms = property.rooms.length;

  // Calculate reservations by status
  const allReservations = property.rooms.flatMap((room) => room.reservations);

  // Filter reservations by selected period
  const filterReservationsByPeriod = (reservations: typeof allReservations) => {
    if (selectedPeriod === "all") return reservations;

    const now = new Date();

    return reservations.filter((reservation) => {
      // Handle both string and Date types for createdAt
      let createdDate: Date;

      try {
        if (reservation.createdAt instanceof Date) {
          createdDate = reservation.createdAt;
        } else if (typeof reservation.createdAt === "string") {
          createdDate = parseISO(reservation.createdAt);
        } else {
          // Fallback to current date if createdAt is invalid
          createdDate = new Date();
        }
      } catch (error) {
        // If parsing fails, use current date as fallback
        createdDate = new Date();
      }

      switch (selectedPeriod) {
        case "today":
          return isToday(createdDate);
        case "week":
          return isThisWeek(createdDate, { weekStartsOn: 1 });
        case "month":
          return isThisMonth(createdDate);
        case "year":
          return isThisYear(createdDate);
        case "last7days":
          return createdDate >= subDays(now, 7);
        case "last30days":
          return createdDate >= subDays(now, 30);
        default:
          return true;
      }
    });
  };

  const filteredReservations = filterReservationsByPeriod(allReservations);

  // Get period name for display
  const getPeriodName = (period: string) => {
    switch (period) {
      case "all":
        return "toutes les périodes";
      case "today":
        return "aujourd'hui";
      case "week":
        return "cette semaine";
      case "month":
        return "ce mois";
      case "year":
        return "cette année";
      case "last7days":
        return "les 7 derniers jours";
      case "last30days":
        return "les 30 derniers jours";
      default:
        return "la période sélectionnée";
    }
  };

  // Revenus à payer (TO_PAY status)
  const revenuesToPay = filteredReservations
    .filter((reservation) => reservation.status === "TO_PAY")
    .reduce(
      (acc, reservation) =>
        acc + (reservation.totalPrice ? Number(reservation.totalPrice) : 0),
      0
    );

  // Nombre de réservations en attente (PENDING status)
  const pendingReservationsCount = filteredReservations.filter(
    (reservation) => reservation.status === "PENDING"
  ).length;

  // Revenus payés (PAID status)
  const paidRevenues = filteredReservations
    .filter((reservation) => reservation.status === "PAID")
    .reduce(
      (acc, reservation) =>
        acc + (reservation.totalPrice ? Number(reservation.totalPrice) : 0),
      0
    );

  const totalEquipments = property.rooms.reduce(
    (acc, room) => acc + room.equipments.length,
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

      {/* Period Filter */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Statistiques par période
        </h3>
        <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <TabsList className="grid w-full max-w-3xl grid-cols-6">
            <TabsTrigger value="all">Tout</TabsTrigger>
            <TabsTrigger value="today">Aujourd&apos;hui</TabsTrigger>
            <TabsTrigger value="week">Cette semaine</TabsTrigger>
            <TabsTrigger value="month">Ce mois</TabsTrigger>
            <TabsTrigger value="last7days">7 derniers jours</TabsTrigger>
            <TabsTrigger value="last30days">30 derniers jours</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="mt-3 text-sm text-gray-600">
          <span className="font-medium">{filteredReservations.length}</span>{" "}
          réservation{filteredReservations.length > 1 ? "s" : ""} pour{" "}
          <span className="font-medium">{getPeriodName(selectedPeriod)}</span>
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
          title="Réservations en attente"
          value={pendingReservationsCount}
          icon={<Clock className="h-5 w-5" />}
          isMonetary={false}
        />
        <StatsCard
          title="Revenus à payer"
          value={revenuesToPay}
          currency={propertyCurrency as Currency}
          icon={<CreditCard className="h-5 w-5" />}
          isMonetary={true}
        />
        <StatsCard
          title="Revenus payés"
          value={paidRevenues}
          currency={propertyCurrency as Currency}
          icon={<CheckCircle className="h-5 w-5" />}
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
                <Building2 className="h-4 w-4 mr-2" />
                Gérer les {unitTerminology.toLowerCase()}
              </Button>
            </Link>
            <Link href={`/dashboard/properties/${property.id}/equipments`}>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Gérer les équipements
              </Button>
            </Link>
            <Link href={`/dashboard/properties/${property.id}/calendar`}>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Voir le planning
              </Button>
            </Link>
            <Link href={`/dashboard/properties/${property.id}/reservations`}>
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="h-4 w-4 mr-2" />
                Gérer les réservations
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
