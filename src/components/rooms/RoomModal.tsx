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
import { Users, Euro, Loader2 } from "lucide-react";
import {
  formatCurrency,
  getCurrencySymbol,
  type Currency,
} from "@/lib/currency";

interface Room {
  id?: string;
  name: string;
  capacity?: number | null;
  pricePerNight?: number | null;
  description?: string | null;
  propertyId: string;
}

interface Property {
  id: string;
  name: string;
}

interface RoomModalProps {
  room?: Room;
  properties: Property[];
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  unitTerminology: string; // "chambres" ou "espaces"
  currency: string; // Devise de l'utilisateur
}

export function RoomModal({
  room,
  properties,
  isOpen,
  onClose,
  mode,
  unitTerminology,
  currency,
}: RoomModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: room?.name || "",
    capacity: room?.capacity?.toString() || "",
    pricePerNight: room?.pricePerNight?.toString() || "",
    description: room?.description || "",
    propertyId: room?.propertyId || "",
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
      newErrors.name = `Le nom ${
        unitTerminology === "chambres" ? "de la chambre" : "de l'espace"
      } est requis`;
    }

    if (!formData.propertyId) {
      newErrors.propertyId = "Veuillez sélectionner une propriété";
    }

    if (
      formData.capacity &&
      (isNaN(Number(formData.capacity)) || Number(formData.capacity) < 1)
    ) {
      newErrors.capacity = "La capacité doit être un nombre positif";
    }

    if (
      formData.pricePerNight &&
      (isNaN(Number(formData.pricePerNight)) ||
        Number(formData.pricePerNight) < 0)
    ) {
      newErrors.pricePerNight = "Le prix doit être un nombre positif";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const url = mode === "create" ? "/api/rooms" : `/api/rooms/${room?.id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const submitData = {
        name: formData.name.trim(),
        capacity: formData.capacity ? Number(formData.capacity) : null,
        pricePerNight: formData.pricePerNight
          ? Number(formData.pricePerNight)
          : null,
        description: formData.description?.trim() || null,
        propertyId: formData.propertyId,
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
        capacity: "",
        pricePerNight: "",
        description: "",
        propertyId: "",
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
        capacity: "",
        pricePerNight: "",
        description: "",
        propertyId: "",
      });
      setErrors({});
    }
  };

  const unitSingular = unitTerminology === "chambres" ? "chambre" : "espace";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-airbnb-charcoal">
            {mode === "create"
              ? `Ajouter ${
                  unitTerminology === "chambres" ? "une chambre" : "un espace"
                }`
              : `Modifier ${
                  unitTerminology === "chambres" ? "la chambre" : "l'espace"
                }`}
          </DialogTitle>
          <DialogDescription className="text-airbnb-dark-gray">
            {mode === "create"
              ? `Créez ${
                  unitTerminology === "chambres"
                    ? "une nouvelle chambre"
                    : "un nouvel espace"
                } dans une de vos propriétés`
              : `Modifiez les informations ${
                  unitTerminology === "chambres"
                    ? "de votre chambre"
                    : "de votre espace"
                }`}
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

          {/* Property selection */}
          <div className="space-y-2">
            <Label
              htmlFor="propertyId"
              className="text-sm font-medium text-airbnb-charcoal"
            >
              Propriété *
            </Label>
            <Select
              value={formData.propertyId}
              onValueChange={(value: string) =>
                handleInputChange("propertyId", value)
              }
              disabled={isLoading}
            >
              <SelectTrigger
                className={`transition-colors ${
                  errors.propertyId
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-airbnb-red focus:ring-airbnb-red"
                }`}
              >
                <SelectValue placeholder="Sélectionnez une propriété" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.propertyId && (
              <p className="text-red-500 text-xs mt-1">{errors.propertyId}</p>
            )}
          </div>

          {/* Room name */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-sm font-medium text-airbnb-charcoal"
            >
              Nom{" "}
              {unitTerminology === "chambres" ? "de la chambre" : "de l'espace"}{" "}
              *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder={`Ex: ${
                unitTerminology === "chambres"
                  ? "Chambre Premium"
                  : "Studio Design"
              }`}
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

          {/* Capacity and Price Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Capacity */}
            <div className="space-y-2">
              <Label
                htmlFor="capacity"
                className="text-sm font-medium text-airbnb-charcoal"
              >
                Capacité
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-airbnb-dark-gray" />
                <Input
                  id="capacity"
                  type="number"
                  placeholder="4"
                  value={formData.capacity}
                  onChange={(e) =>
                    handleInputChange("capacity", e.target.value)
                  }
                  className={`pl-10 transition-colors ${
                    errors.capacity
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-airbnb-red focus:ring-airbnb-red"
                  }`}
                  disabled={isLoading}
                  min="1"
                />
              </div>
              {errors.capacity && (
                <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>
              )}
            </div>

            {/* Price per night */}
            <div className="space-y-2">
              <Label
                htmlFor="pricePerNight"
                className="text-sm font-medium text-airbnb-charcoal"
              >
                Prix par nuit
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-3 h-4 w-4 text-airbnb-dark-gray flex items-center justify-center text-sm font-medium">
                  {getCurrencySymbol(currency as Currency)}
                </span>
                <Input
                  id="pricePerNight"
                  type="number"
                  placeholder="120"
                  value={formData.pricePerNight}
                  onChange={(e) =>
                    handleInputChange("pricePerNight", e.target.value)
                  }
                  className={`pl-10 transition-colors ${
                    errors.pricePerNight
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-airbnb-red focus:ring-airbnb-red"
                  }`}
                  disabled={isLoading}
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.pricePerNight && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.pricePerNight}
                </p>
              )}
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
              placeholder={`Décrivez ${
                unitTerminology === "chambres"
                  ? "votre chambre"
                  : "votre espace"
              }...`}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="min-h-[100px] border-gray-300 focus:border-airbnb-red focus:ring-airbnb-red resize-none"
              disabled={isLoading}
            />
            <p className="text-xs text-airbnb-dark-gray">
              Décrivez les caractéristiques, équipements et points forts{" "}
              {unitTerminology === "chambres"
                ? "de cette chambre"
                : "de cet espace"}
            </p>
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
                `Créer ${
                  unitTerminology === "chambres" ? "la chambre" : "l'espace"
                }`
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
