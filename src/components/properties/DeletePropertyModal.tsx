"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";

interface Property {
  id: string;
  name: string;
  roomCount?: number;
}

interface DeletePropertyModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export function DeletePropertyModal({
  property,
  isOpen,
  onClose,
}: DeletePropertyModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/properties/${property.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Impossible de supprimer la propriété"
        );
      }

      // Refresh the page to show updated data
      router.refresh();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setError(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-airbnb-charcoal">
                Supprimer la propriété
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-airbnb-dark-gray">
            Cette action est irréversible
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Warning message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              <strong>Attention :</strong> Vous êtes sur le point de supprimer
              la propriété{" "}
              <span className="font-medium">&ldquo;{property.name}&rdquo;</span>
              .
            </p>
            {property.roomCount && property.roomCount > 0 && (
              <p className="text-amber-800 text-sm mt-2">
                Cette propriété contient{" "}
                <strong>
                  {property.roomCount} chambre
                  {property.roomCount > 1 ? "s" : ""}
                </strong>{" "}
                qui{" "}
                {property.roomCount > 1
                  ? "seront également supprimées"
                  : "sera également supprimée"}
                .
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-airbnb-charcoal text-sm">
              Toutes les données associées seront définitivement perdues :
            </p>
            <ul className="text-airbnb-dark-gray text-sm space-y-1 ml-4">
              <li>• Chambres et espaces</li>
              <li>• Équipements</li>
              <li>• Réservations</li>
              <li>• Disponibilités</li>
            </ul>
          </div>

          <p className="text-airbnb-dark-gray text-sm">
            Êtes-vous sûr de vouloir continuer ?
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-3 pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer définitivement"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
