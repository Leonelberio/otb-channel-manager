"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import {
  Loader2,
  Save,
  Building2,
  Globe,
  Euro,
  Palette,
  Code,
  Copy,
  ExternalLink,
} from "lucide-react";
import { currencyOptions } from "@/lib/currency";
import { toast } from "sonner";

interface UserPreferences {
  id: string;
  establishmentType: string;
  preferredLanguage: string;
  currency: string;
  onboardingCompleted: boolean;
  widgetPrimaryColor?: string;
  widgetButtonColor?: string;
}

interface SettingsFormProps {
  initialPreferences: UserPreferences;
  organizationId: string;
}

export function SettingsForm({
  initialPreferences,
  organizationId,
}: SettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    establishmentType: initialPreferences.establishmentType,
    preferredLanguage: initialPreferences.preferredLanguage,
    currency: initialPreferences.currency,
    widgetPrimaryColor: initialPreferences.widgetPrimaryColor || "#8ABF37",
    widgetButtonColor: initialPreferences.widgetButtonColor || "#8ABF37",
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

      toast.success("Paramètres sauvegardés avec succès !");
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
      setErrors({
        general:
          error instanceof Error ? error.message : "Une erreur est survenue",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateShortcode = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `<iframe src="${baseUrl}/widget/${organizationId}?primaryColor=${encodeURIComponent(
      formData.widgetPrimaryColor
    )}&buttonColor=${encodeURIComponent(
      formData.widgetButtonColor
    )}" width="100%" height="800" frameborder="0" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>`;
  };

  const copyShortcode = () => {
    navigator.clipboard.writeText(generateShortcode());
    toast.success("Code d'intégration copié !");
  };

  const previewWidget = () => {
    const url = `/widget/${organizationId}?primaryColor=${encodeURIComponent(
      formData.widgetPrimaryColor
    )}&buttonColor=${encodeURIComponent(formData.widgetButtonColor)}`;
    window.open(url, "_blank");
  };

  const establishmentTypeOptions = [
    { value: "hotel", label: "Hôtel" },
    { value: "espace", label: "Espace" },
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
                <SelectTrigger className="border-gray-300 focus:border-main focus:ring-main">
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
                <SelectTrigger className="border-gray-300 focus:border-main focus:ring-main">
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
                <SelectTrigger className="border-gray-300 focus:border-main focus:ring-main">
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

        {/* Widget Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Configuration du Widget</span>
            </CardTitle>
            <CardDescription>
              Personnalisez l&apos;apparence du widget de réservation intégrable
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="widgetPrimaryColor"
                  className="text-sm font-medium"
                >
                  Couleur principale
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    id="widgetPrimaryColor"
                    value={formData.widgetPrimaryColor}
                    onChange={(e) =>
                      handleInputChange("widgetPrimaryColor", e.target.value)
                    }
                    className="w-12 h-10 border-0 rounded cursor-pointer"
                    disabled={isLoading}
                  />
                  <Input
                    type="text"
                    value={formData.widgetPrimaryColor}
                    onChange={(e) =>
                      handleInputChange("widgetPrimaryColor", e.target.value)
                    }
                    className="flex-1"
                    placeholder="#8ABF37"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Couleur utilisée pour les icônes et accents
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="widgetButtonColor"
                  className="text-sm font-medium"
                >
                  Couleur des boutons
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    id="widgetButtonColor"
                    value={formData.widgetButtonColor}
                    onChange={(e) =>
                      handleInputChange("widgetButtonColor", e.target.value)
                    }
                    className="w-12 h-10 border-0 rounded cursor-pointer"
                    disabled={isLoading}
                  />
                  <Input
                    type="text"
                    value={formData.widgetButtonColor}
                    onChange={(e) =>
                      handleInputChange("widgetButtonColor", e.target.value)
                    }
                    className="flex-1"
                    placeholder="#8ABF37"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Couleur des boutons d&apos;action
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Aperçu des couleurs</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={previewWidget}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Aperçu complet
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: formData.widgetPrimaryColor }}
                  />
                  <span className="text-sm">Couleur principale</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-16 h-6 rounded text-white text-xs flex items-center justify-center font-medium"
                    style={{ backgroundColor: formData.widgetButtonColor }}
                  >
                    Bouton
                  </div>
                  <span className="text-sm">Couleur des boutons</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget Integration Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>Code d&apos;intégration</span>
            </CardTitle>
            <CardDescription>
              Copiez ce code pour intégrer le widget sur votre site web
              (WordPress, Drupal, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  readOnly
                  value={generateShortcode()}
                  className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono resize-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyShortcode}
                  className="absolute top-2 right-2"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copier
                </Button>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  <strong>Instructions d&apos;intégration :</strong>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>WordPress :</strong> Collez ce code dans un bloc
                    HTML personnalisé
                  </li>
                  <li>
                    <strong>Drupal :</strong> Utilisez un bloc de contenu
                    personnalisé
                  </li>
                  <li>
                    <strong>Site web :</strong> Intégrez directement dans votre
                    HTML
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-main hover:bg-main-dark text-white"
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
