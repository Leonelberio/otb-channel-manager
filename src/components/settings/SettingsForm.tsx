"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Save, Building2, Globe, Euro } from "lucide-react";
import { currencyOptions } from "@/lib/currency";

interface UserPreferences {
  id: string;
  establishmentType: string;
  preferredLanguage: string;
  currency: string;
  onboardingCompleted: boolean;
}

interface SettingsFormProps {
  initialPreferences: UserPreferences;
}

export function SettingsForm({ initialPreferences }: SettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    establishmentType: initialPreferences.establishmentType,
    preferredLanguage: initialPreferences.preferredLanguage,
    currency: initialPreferences.currency,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/user-preferences", {
        method: "PUT",
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

  const establishmentTypeOptions = [
    { value: "hotel", label: "Hôtel" },
    { value: "espace", label: "Espace de travail" },
  ];

  const languageOptions = [
    { value: "fr", label: "Français" },
    { value: "en", label: "English" },
  ];

  return (
    <div className="space-y-6">
      {/* General error */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Establishment Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Type d&apos;établissement</span>
            </CardTitle>
            <CardDescription>
              Définissez le type d&apos;établissement pour personnaliser
              l&apos;interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label
                htmlFor="establishmentType"
                className="text-sm font-medium"
              >
                Type d&apos;établissement
              </Label>
              <Select
                value={formData.establishmentType}
                onValueChange={(value) =>
                  handleInputChange("establishmentType", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger className="border-gray-300 focus:border-airbnb-red focus:ring-airbnb-red">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  {establishmentTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Cela affectera la terminologie utilisée dans l&apos;application
                (chambres vs espaces)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Langue</span>
            </CardTitle>
            <CardDescription>
              Choisissez la langue d&apos;interface de l&apos;application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label
                htmlFor="preferredLanguage"
                className="text-sm font-medium"
              >
                Langue préférée
              </Label>
              <Select
                value={formData.preferredLanguage}
                onValueChange={(value) =>
                  handleInputChange("preferredLanguage", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger className="border-gray-300 focus:border-airbnb-red focus:ring-airbnb-red">
                  <SelectValue placeholder="Sélectionnez une langue" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Currency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Euro className="h-5 w-5" />
              <span>Devise</span>
            </CardTitle>
            <CardDescription>
              Définissez la devise utilisée pour afficher les prix dans
              l&apos;application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-sm font-medium">
                Devise
              </Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleInputChange("currency", value)}
                disabled={isLoading}
              >
                <SelectTrigger className="border-gray-300 focus:border-airbnb-red focus:ring-airbnb-red">
                  <SelectValue placeholder="Sélectionnez une devise" />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{option.symbol}</span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Cette devise sera utilisée pour afficher tous les prix dans
                l&apos;application
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-airbnb-red hover:bg-airbnb-dark-red text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les paramètres
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
