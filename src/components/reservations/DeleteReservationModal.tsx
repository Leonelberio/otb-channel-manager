"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Reservation {
  id: string;
  guestName: string;
  roomName: string;
  propertyName: string;
  startDate: string;
  endDate: string;
}

interface DeleteReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  reservation: Reservation | null;
}

export function DeleteReservationModal({
  isOpen,
  onClose,
  onDelete,
  reservation,
}: DeleteReservationModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!reservation) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Réservation supprimée avec succès !");
        onDelete();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsLoading(false);
    }
  };

  if (!reservation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Supprimer la réservation
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action
            est irréversible.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900">
              {reservation.guestName}
            </h4>
            <p className="text-sm text-gray-600">
              {reservation.propertyName} • {reservation.roomName}
            </p>
            <p className="text-sm text-gray-600">
              {new Date(reservation.startDate).toLocaleDateString()} -{" "}
              {new Date(reservation.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Suppression..." : "Supprimer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
