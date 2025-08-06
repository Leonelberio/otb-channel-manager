"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Users,
  Calendar,
  Mail,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ReservationModal } from "./ReservationModal";
import { DeleteReservationModal } from "./DeleteReservationModal";
import { formatCurrency, type Currency } from "@/lib/currency";

interface Room {
  id: string;
  name: string;
  propertyName: string;
  pricePerNight: number;
}

interface Reservation {
  id: string;
  roomId: string;
  guestName: string;
  guestEmail?: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice?: number;
  notes?: string;
  roomName: string;
  propertyName: string;
}

interface ReservationsClientProps {
  initialReservations: Reservation[];
  rooms: Room[];
  currency: Currency;
}

const RESERVATION_STATUSES = [
  {
    value: "PENDING",
    label: "En attente",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "CONFIRMED",
    label: "Confirmée",
    color: "bg-green-100 text-green-800",
  },
  { value: "CANCELLED", label: "Annulée", color: "bg-red-100 text-red-800" },
  { value: "COMPLETED", label: "Terminée", color: "bg-blue-100 text-blue-800" },
];

export function ReservationsClient({
  initialReservations,
  rooms,
  currency: initialCurrency,
}: ReservationsClientProps) {
  const [reservations, setReservations] = useState(initialReservations);
  const [currency, setCurrency] = useState<Currency>(initialCurrency);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<
    Reservation | undefined
  >();
  const [reservationToDelete, setReservationToDelete] =
    useState<Reservation | null>(null);

  const refreshReservations = async () => {
    try {
      const response = await fetch("/api/reservations");
      if (response.ok) {
        const data = await response.json();
        setReservations(data.reservations);
        if (data.currency) {
          setCurrency(data.currency);
        }
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
    }
  };

  const handleNewReservation = () => {
    setSelectedReservation(undefined);
    setIsModalOpen(true);
  };

  const handleEditReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  const handleDeleteReservation = (reservation: Reservation) => {
    setReservationToDelete(reservation);
    setIsDeleteModalOpen(true);
  };

  const handleQuickStatusChange = async (
    reservationId: string,
    newStatus: string
  ) => {
    try {
      const reservation = reservations.find((r) => r.id === reservationId);
      if (!reservation) return;

      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...reservation,
          status: newStatus,
        }),
      });

      if (response.ok) {
        await refreshReservations();
      } else {
        console.error("Erreur lors de la mise à jour du statut");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const getStatusColor = (status: string) => {
    const statusConfig = RESERVATION_STATUSES.find((s) => s.value === status);
    return statusConfig?.color || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    const statusConfig = RESERVATION_STATUSES.find((s) => s.value === status);
    return statusConfig?.label || status;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-airbnb-charcoal">
            Réservations
          </h1>
          <p className="text-airbnb-dark-gray mt-2">
            Gérez toutes vos réservations ({reservations.length})
          </p>
        </div>
        <Button
          variant="default"
          className="bg-airbnb-red hover:bg-airbnb-dark-red"
          onClick={handleNewReservation}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle réservation
        </Button>
      </div>

      {reservations.length === 0 ? (
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
            onClick={handleNewReservation}
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
            {reservations.map((reservation) => (
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
                        {reservation.notes && (
                          <div className="text-sm text-gray-500 mt-1 italic">
                            &quot;{reservation.notes}&quot;
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${getStatusColor(
                                reservation.status
                              )}`}
                            >
                              {getStatusLabel(reservation.status)}
                            </span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {RESERVATION_STATUSES.map((status) => (
                              <DropdownMenuItem
                                key={status.value}
                                onClick={() =>
                                  handleQuickStatusChange(
                                    reservation.id,
                                    status.value
                                  )
                                }
                                className={
                                  reservation.status === status.value
                                    ? "bg-gray-100"
                                    : ""
                                }
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      status.color.split(" ")[0]
                                    }`}
                                  ></span>
                                  {status.label}
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {reservation.totalPrice && (
                          <div className="text-lg font-semibold text-airbnb-charcoal mt-2">
                            {formatCurrency(reservation.totalPrice, currency)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEditReservation(reservation)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteReservation(reservation)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={refreshReservations}
        reservation={selectedReservation}
        rooms={rooms}
        currency={currency}
      />

      <DeleteReservationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={refreshReservations}
        reservation={reservationToDelete}
      />
    </div>
  );
}
