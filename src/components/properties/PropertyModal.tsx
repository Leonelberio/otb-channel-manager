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
import { MapPin, Loader2 } from "lucide-react";

interface Property {
  id?: string;
  name: string;
  address?: string;
  description?: string;
  images?: string[];
}

interface PropertyModalProps {
  property?: Property;
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
}

export function PropertyModal({
  property,
  isOpen,
  onClose,
  mode,
}: PropertyModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: property?.name || "",
    address: property?.address || "",
    description: property?.description || "",
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
      newErrors.name = "Le nom de la propriété est requis";
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
          ? "/api/properties"
          : `/api/properties/${property?.id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue");
      }

      // Refresh the page to show updated data
      router.refresh();
      onClose();

      // Reset form
      setFormData({ name: "", address: "", description: "" });
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
      setFormData({ name: "", address: "", description: "" });
      setErrors({});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-airbnb-charcoal">
            {mode === "create"
              ? "Ajouter une propriété"
              : "Modifier la propriété"}
          </DialogTitle>
          <DialogDescription className="text-airbnb-dark-gray">
            {mode === "create"
              ? "Créez une nouvelle propriété pour votre organisation"
              : "Modifiez les informations de votre propriété"}
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

          {/* Property name */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-sm font-medium text-airbnb-charcoal"
            >
              Nom de la propriété *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Ex: Villa Belle Vue"
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

          {/* Address */}
          <div className="space-y-2">
            <Label
              htmlFor="address"
              className="text-sm font-medium text-airbnb-charcoal"
            >
              Adresse
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-airbnb-dark-gray" />
              <Input
                id="address"
                type="text"
                placeholder="123 Rue de la Paix, 75001 Paris"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="pl-10 border-gray-300 focus:border-airbnb-red focus:ring-airbnb-red"
                disabled={isLoading}
              />
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
              placeholder="Décrivez votre propriété..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="min-h-[100px] border-gray-300 focus:border-airbnb-red focus:ring-airbnb-red resize-none"
              disabled={isLoading}
            />
            <p className="text-xs text-airbnb-dark-gray">
              Partagez les points forts et les caractéristiques uniques de votre
              propriété
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
                "Créer la propriété"
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
