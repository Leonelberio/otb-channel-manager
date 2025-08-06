"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  formatCurrency,
  getCurrencySymbol,
  type Currency,
} from "@/lib/currency";

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
}

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  reservation?: Reservation;
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

export function ReservationModal({
  isOpen,
  onClose,
  onSave,
  reservation,
  rooms,
  currency,
}: ReservationModalProps) {
  const [formData, setFormData] = useState({
    roomId: "",
    guestName: "",
    guestEmail: "",
    startDate: "",
    endDate: "",
    status: "PENDING",
    totalPrice: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (reservation) {
      setFormData({
        roomId: reservation.roomId,
        guestName: reservation.guestName,
        guestEmail: reservation.guestEmail || "",
        startDate: new Date(reservation.startDate).toISOString().split("T")[0],
        endDate: new Date(reservation.endDate).toISOString().split("T")[0],
        status: reservation.status,
        totalPrice: reservation.totalPrice?.toString() || "",
        notes: reservation.notes || "",
      });
    } else {
      setFormData({
        roomId: "",
        guestName: "",
        guestEmail: "",
        startDate: "",
        endDate: "",
        status: "PENDING",
        totalPrice: "",
        notes: "",
      });
    }
  }, [reservation]);

  const calculateTotalPrice = () => {
    if (formData.roomId && formData.startDate && formData.endDate) {
      const room = rooms.find((r) => r.id === formData.roomId);
      if (room) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const nights = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (nights > 0) {
          const total = nights * room.pricePerNight;
          setFormData((prev) => ({ ...prev, totalPrice: total.toString() }));
        }
      }
    }
  };

  useEffect(() => {
    calculateTotalPrice();
  }, [formData.roomId, formData.startDate, formData.endDate]);

  const handleSave = async () => {
    if (
      !formData.roomId ||
      !formData.guestName ||
      !formData.startDate ||
      !formData.endDate
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error("La date de fin doit être postérieure à la date de début");
      return;
    }

    setIsLoading(true);
    try {
      const url = reservation
        ? `/api/reservations/${reservation.id}`
        : "/api/reservations";

      const method = reservation ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          totalPrice: formData.totalPrice
            ? parseFloat(formData.totalPrice)
            : null,
        }),
      });

      if (response.ok) {
        toast.success(
          reservation
            ? "Réservation mise à jour avec succès !"
            : "Réservation créée avec succès !"
        );
        onSave();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRoom = rooms.find((r) => r.id === formData.roomId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {reservation ? "Modifier la réservation" : "Nouvelle réservation"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roomId">Espace *</Label>
              <Select
                value={formData.roomId}
                onValueChange={(value: string) =>
                  setFormData((prev) => ({ ...prev, roomId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un espace" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.propertyName} - {room.name} (
                      {formatCurrency(room.pricePerNight, currency)}/nuit)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">Nom du client *</Label>
                <Input
                  id="guestName"
                  value={formData.guestName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      guestName: e.target.value,
                    }))
                  }
                  placeholder="Nom complet"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestEmail">Email du client</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={formData.guestEmail}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      guestEmail: e.target.value,
                    }))
                  }
                  placeholder="email@exemple.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date d&apos;arrivée *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de départ *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: string) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESERVATION_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              status.color.split(" ")[0]
                            }`}
                          ></span>
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalPrice">
                  Prix total ({getCurrencySymbol(currency)})
                </Label>
                <Input
                  id="totalPrice"
                  type="number"
                  step="0.01"
                  value={formData.totalPrice}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      totalPrice: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
                {selectedRoom && formData.startDate && formData.endDate && (
                  <p className="text-xs text-gray-500">
                    Calculé automatiquement:{" "}
                    {formatCurrency(selectedRoom.pricePerNight, currency)}/nuit
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Notes additionnelles..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-airbnb-red hover:bg-airbnb-dark-red"
          >
            {isLoading
              ? "Sauvegarde..."
              : reservation
              ? "Mettre à jour"
              : "Créer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
