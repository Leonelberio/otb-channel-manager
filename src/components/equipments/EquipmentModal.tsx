"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Loader2,
  Wifi,
  Car,
  Coffee,
  Tv,
  Snowflake,
  BedDouble,
} from "lucide-react";

interface Equipment {
  id?: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  roomId: string;
}

interface Room {
  id: string;
  name: string;
  propertyName: string;
}

interface EquipmentModalProps {
  equipment?: Equipment;
  rooms: Room[];
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
}

const iconOptions = [
  { value: "wifi", label: "WiFi", icon: Wifi },
  { value: "car", label: "Parking", icon: Car },
  { value: "coffee", label: "Café/Cuisine", icon: Coffee },
  { value: "tv", label: "Télévision", icon: Tv },
  { value: "snowflake", label: "Climatisation", icon: Snowflake },
  { value: "bed", label: "Literie", icon: BedDouble },
  { value: "package", label: "Général", icon: Package },
];

export function EquipmentModal({
  equipment,
  rooms,
  isOpen,
  onClose,
  mode,
}: EquipmentModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: equipment?.name || "",
    description: equipment?.description || "",
    icon: equipment?.icon || "package",
    roomId: equipment?.roomId || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom de l'équipement est requis";
    }

    if (!formData.roomId) {
      newErrors.roomId = "Veuillez sélectionner une chambre/espace";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const url =
        mode === "create"
          ? "/api/equipments"
          : `/api/equipments/${equipment?.id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const submitData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        icon: formData.icon,
        roomId: formData.roomId,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue");
      }

      // Refresh the page to show updated data
      router.refresh();
      onClose();

      // Reset form
      setFormData({
        name: "",
        description: "",
        icon: "package",
        roomId: "",
      });
    } catch (error) {
      console.error("Erreur:", error);
      setErrors({
        general:
          error instanceof Error ? error.message : "Une erreur est survenue",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setFormData({
        name: "",
        description: "",
        icon: "package",
        roomId: "",
      });
      setErrors({});
    }
  };

  const selectedIcon = iconOptions.find((opt) => opt.value === formData.icon);
  const IconComponent = selectedIcon?.icon || Package;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-airbnb-charcoal">
            {mode === "create"
              ? "Ajouter un équipement"
              : "Modifier l'équipement"}
          </DialogTitle>
          <DialogDescription className="text-airbnb-dark-gray">
            {mode === "create"
              ? "Ajoutez un nouvel équipement à une chambre/espace"
              : "Modifiez les informations de votre équipement"}
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Room selection */}
          <div className="space-y-2">
            <Label
              htmlFor="roomId"
              className="text-sm font-medium text-airbnb-charcoal"
            >
              Chambre/Espace *
            </Label>
            <Select
              value={formData.roomId}
              onValueChange={(value: string) =>
                handleInputChange("roomId", value)
              }
              disabled={isLoading}
            >
              <SelectTrigger
                className={`transition-colors ${
                  errors.roomId
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-airbnb-red focus:ring-airbnb-red"
                }`}
              >
                <SelectValue placeholder="Sélectionnez une chambre/espace" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{room.name}</span>
                      <span className="text-xs text-gray-500">
                        {room.propertyName}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roomId && (
              <p className="text-red-500 text-xs mt-1">{errors.roomId}</p>
            )}
          </div>

          {/* Equipment name and icon row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Equipment name */}
            <div className="col-span-2 space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-airbnb-charcoal"
              >
                Nom de l&apos;équipement *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Ex: WiFi gratuit, Climatisation..."
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`transition-colors ${
                  errors.name
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-airbnb-red focus:ring-airbnb-red"
                }`}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Icon selection */}
            <div className="space-y-2">
              <Label
                htmlFor="icon"
                className="text-sm font-medium text-airbnb-charcoal"
              >
                Icône
              </Label>
              <Select
                value={formData.icon}
                onValueChange={(value: string) =>
                  handleInputChange("icon", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger className="border-gray-300 focus:border-airbnb-red focus:ring-airbnb-red">
                  <SelectValue>
                    <div className="flex items-center">
                      <IconComponent className="h-4 w-4 mr-2" />
                      <span>{selectedIcon?.label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        <option.icon className="h-4 w-4 mr-2" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-sm font-medium text-airbnb-charcoal"
            >
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Décrivez cet équipement en détail..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="min-h-[100px] border-gray-300 focus:border-airbnb-red focus:ring-airbnb-red resize-none"
              disabled={isLoading}
            />
            <p className="text-xs text-airbnb-dark-gray">
              Ajoutez des détails sur cet équipement, ses spécificités ou son
              utilisation
            </p>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <p className="text-sm font-medium text-airbnb-charcoal mb-2">
              Aperçu :
            </p>
            <div className="flex items-center bg-white rounded-full px-3 py-1.5 text-sm border inline-flex">
              <IconComponent className="h-4 w-4 mr-2" />
              <span>{formData.name || "Nom de l'équipement"}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 pt-4 border-t">
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
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-airbnb-red hover:bg-airbnb-dark-red text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "create" ? "Création..." : "Modification..."}
                </>
              ) : mode === "create" ? (
                "Créer l'équipement"
              ) : (
                "Sauvegarder"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
