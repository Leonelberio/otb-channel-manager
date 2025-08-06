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
import {
  AlertTriangle,
  Loader2,
  Package,
  Wifi,
  Car,
  Coffee,
  Tv,
  Snowflake,
  BedDouble,
} from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  roomName: string;
  propertyName: string;
  description?: string | null;
  icon?: string | null;
}

interface DeleteEquipmentModalProps {
  equipment: Equipment;
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  car: Car,
  coffee: Coffee,
  tv: Tv,
  snowflake: Snowflake,
  bed: BedDouble,
  package: Package,
};

export function DeleteEquipmentModal({
  equipment,
  isOpen,
  onClose,
}: DeleteEquipmentModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/equipments/${equipment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Impossible de supprimer l&apos;équipement"
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

  const IconComponent = iconMap[equipment.icon || "package"] || Package;

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
                Supprimer l&apos;équipement
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

          {/* Equipment preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <IconComponent className="h-5 w-5 mr-2 text-airbnb-dark-gray" />
              <span className="font-medium text-airbnb-charcoal">
                {equipment.name}
              </span>
            </div>
            <div className="text-sm text-airbnb-dark-gray">
              <p className="mb-1">
                <span className="font-medium">Chambre/Espace :</span>{" "}
                {equipment.roomName}
              </p>
              <p>
                <span className="font-medium">Propriété :</span>{" "}
                {equipment.propertyName}
              </p>
              {equipment.description && (
                <p className="mt-2 text-xs italic">
                  &quot;{equipment.description}&quot;
                </p>
              )}
            </div>
          </div>

          {/* Warning message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              <strong>Attention :</strong> Vous êtes sur le point de supprimer
              l&apos;équipement{" "}
              <span className="font-medium">
                &ldquo;{equipment.name}&rdquo;
              </span>
              .
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-airbnb-charcoal text-sm">
              Cette action supprimera définitivement :
            </p>
            <ul className="text-airbnb-dark-gray text-sm space-y-1 ml-4">
              <li>• L&apos;équipement et sa description</li>
              <li>• Toutes les informations associées</li>
              <li>• L&apos;historique de cet équipement</li>
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
