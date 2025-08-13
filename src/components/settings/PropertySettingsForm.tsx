"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  Settings,
  Palette,
  Code,
  Copy,
  ExternalLink,
  Clock,
  Bell,
  Calendar,
} from "lucide-react";
import { currencyOptions } from "@/lib/currency";
import { toast } from "sonner";

interface PropertySettings {
  id: string;
  propertyId: string;
  currency: string;
  timezone: string;
  language: string;
  widgetPrimaryColor: string;
  widgetButtonColor: string;
  widgetEnabled: boolean;
  allowInstantBooking: boolean;
  requireApproval: boolean;
  maxAdvanceBookingDays: number;
  minAdvanceBookingHours: number;
  defaultCheckinTime?: string;
  defaultCheckoutTime?: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

interface PropertySettingsFormProps {
  initialSettings: PropertySettings;
  propertyId: string;
  propertyType: string;
}

export function PropertySettingsForm({
  initialSettings,
  propertyId,
  propertyType,
}: PropertySettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPropertyLoading, setIsPropertyLoading] = useState(false);
  const [settings, setSettings] = useState({
    currency: initialSettings.currency || "XOF",
    timezone: initialSettings.timezone || "Europe/Paris",
    language: initialSettings.language || "fr",
    widgetPrimaryColor: initialSettings.widgetPrimaryColor || "#8ABF37",
    widgetButtonColor: initialSettings.widgetButtonColor || "#8ABF37",
    widgetEnabled: initialSettings.widgetEnabled ?? true,
    allowInstantBooking: initialSettings.allowInstantBooking ?? false,
    requireApproval: initialSettings.requireApproval ?? true,
    maxAdvanceBookingDays: initialSettings.maxAdvanceBookingDays || 365,
    minAdvanceBookingHours: initialSettings.minAdvanceBookingHours || 2,
    defaultCheckinTime: initialSettings.defaultCheckinTime || "15:00",
    defaultCheckoutTime: initialSettings.defaultCheckoutTime || "11:00",
    emailNotifications: initialSettings.emailNotifications ?? true,
    smsNotifications: initialSettings.smsNotifications ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Separate state for establishment type since it's on the Property model
  const [establishmentType, setEstablishmentType] = useState(propertyType);

  const handleInputChange = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts changing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/properties/${propertyId}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue");
      }

      toast.success("Paramètres mis à jour avec succès");
      router.refresh();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEstablishmentTypeUpdate = async (newType: string) => {
    setIsPropertyLoading(true);

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ establishmentType: newType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue");
      }

      setEstablishmentType(newType);
      toast.success("Type d'établissement mis à jour avec succès");
      router.refresh();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setIsPropertyLoading(false);
    }
  };

  const generateShortcode = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `<iframe src="${baseUrl}/widget/${propertyId}?primaryColor=${encodeURIComponent(
      settings.widgetPrimaryColor
    )}&buttonColor=${encodeURIComponent(
      settings.widgetButtonColor
    )}" width="100%" height="800" frameborder="0" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>`;
  };

  const copyShortcode = () => {
    navigator.clipboard.writeText(generateShortcode());
    toast.success("Code d'intégration copié !");
  };

  const previewWidget = () => {
    const url = `/widget/${propertyId}?primaryColor=${encodeURIComponent(
      settings.widgetPrimaryColor
    )}&buttonColor=${encodeURIComponent(settings.widgetButtonColor)}`;
    window.open(url, "_blank");
  };

  const languageOptions = [
    { value: "fr", label: "Français" },
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
    { value: "de", label: "Deutsch" },
  ];

  const timezoneOptions = [
    { value: "Europe/Paris", label: "Europe/Paris (GMT+1)" },
    { value: "Europe/London", label: "Europe/London (GMT+0)" },
    { value: "America/New_York", label: "America/New_York (GMT-5)" },
    { value: "America/Los_Angeles", label: "America/Los_Angeles (GMT-8)" },
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
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Paramètres généraux</span>
            </CardTitle>
            <CardDescription>
              Configuration de base pour cette propriété
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-medium">
                  Devise
                </Label>
                <Select
                  value={settings.currency}
                  onValueChange={(value) =>
                    handleInputChange("currency", value)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="text-sm font-medium">
                  Langue
                </Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) =>
                    handleInputChange("language", value)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
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

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="timezone" className="text-sm font-medium">
                  Fuseau horaire
                </Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) =>
                    handleInputChange("timezone", value)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un fuseau horaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Establishment Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Type d&apos;établissement</span>
            </CardTitle>
            <CardDescription>
              Définissez le type d&apos;établissement pour cette propriété
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Type d&apos;établissement
              </Label>
              <Select
                value={establishmentType}
                onValueChange={handleEstablishmentTypeUpdate}
                disabled={isPropertyLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hotel">🏨 Hôtel (Chambres)</SelectItem>
                  <SelectItem value="espace">
                    🏢 Espace de travail (Espaces)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Le type d&apos;établissement détermine la terminologie utilisée
                dans l&apos;application (chambres vs espaces)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Check-in/out Times */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Horaires de check-in/check-out</span>
            </CardTitle>
            <CardDescription>
              Définissez les horaires par défaut pour{" "}
              {propertyType === "hotel" ? "les chambres" : "les espaces"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="defaultCheckinTime"
                  className="text-sm font-medium"
                >
                  Heure d&apos;arrivée par défaut
                </Label>
                <Input
                  type="time"
                  value={settings.defaultCheckinTime || ""}
                  onChange={(e) =>
                    handleInputChange("defaultCheckinTime", e.target.value)
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="defaultCheckoutTime"
                  className="text-sm font-medium"
                >
                  Heure de départ par défaut
                </Label>
                <Input
                  type="time"
                  value={settings.defaultCheckoutTime || ""}
                  onChange={(e) =>
                    handleInputChange("defaultCheckoutTime", e.target.value)
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Paramètres de réservation</span>
            </CardTitle>
            <CardDescription>
              Configurez les règles de réservation pour cette propriété
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  Réservation instantanée
                </Label>
                <p className="text-xs text-gray-500">
                  Permettre aux clients de réserver sans approbation
                </p>
              </div>
              <Switch
                checked={settings.allowInstantBooking}
                onCheckedChange={(checked) =>
                  handleInputChange("allowInstantBooking", checked)
                }
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  Approbation requise
                </Label>
                <p className="text-xs text-gray-500">
                  Demander une approbation manuelle pour les réservations
                </p>
              </div>
              <Switch
                checked={settings.requireApproval}
                onCheckedChange={(checked) =>
                  handleInputChange("requireApproval", checked)
                }
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="maxAdvanceBookingDays"
                  className="text-sm font-medium"
                >
                  Réservation maximum à l'avance (jours)
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="730"
                  value={settings.maxAdvanceBookingDays}
                  onChange={(e) =>
                    handleInputChange(
                      "maxAdvanceBookingDays",
                      parseInt(e.target.value)
                    )
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="minAdvanceBookingHours"
                  className="text-sm font-medium"
                >
                  Réservation minimum à l'avance (heures)
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="168"
                  value={settings.minAdvanceBookingHours}
                  onChange={(e) =>
                    handleInputChange(
                      "minAdvanceBookingHours",
                      parseInt(e.target.value)
                    )
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>
              Configurez les préférences de notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  Notifications par email
                </Label>
                <p className="text-xs text-gray-500">
                  Recevoir des notifications par email pour les réservations
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  handleInputChange("emailNotifications", checked)
                }
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  Notifications par SMS
                </Label>
                <p className="text-xs text-gray-500">
                  Recevoir des notifications par SMS pour les réservations
                  urgentes
                </p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) =>
                  handleInputChange("smsNotifications", checked)
                }
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Widget Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Widget de réservation</span>
            </CardTitle>
            <CardDescription>
              Personnalisez l'apparence du widget de réservation intégrable
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Widget activé</Label>
                <p className="text-xs text-gray-500">
                  Permettre l'intégration du widget sur d'autres sites
                </p>
              </div>
              <Switch
                checked={settings.widgetEnabled}
                onCheckedChange={(checked) =>
                  handleInputChange("widgetEnabled", checked)
                }
                disabled={isLoading}
              />
            </div>

            {settings.widgetEnabled && (
              <>
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
                        value={settings.widgetPrimaryColor}
                        onChange={(e) =>
                          handleInputChange(
                            "widgetPrimaryColor",
                            e.target.value
                          )
                        }
                        className="w-12 h-10 border-0 rounded cursor-pointer"
                        disabled={isLoading}
                      />
                      <Input
                        type="text"
                        value={settings.widgetPrimaryColor}
                        onChange={(e) =>
                          handleInputChange(
                            "widgetPrimaryColor",
                            e.target.value
                          )
                        }
                        className="flex-1"
                        disabled={isLoading}
                      />
                    </div>
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
                        value={settings.widgetButtonColor}
                        onChange={(e) =>
                          handleInputChange("widgetButtonColor", e.target.value)
                        }
                        className="w-12 h-10 border-0 rounded cursor-pointer"
                        disabled={isLoading}
                      />
                      <Input
                        type="text"
                        value={settings.widgetButtonColor}
                        onChange={(e) =>
                          handleInputChange("widgetButtonColor", e.target.value)
                        }
                        className="flex-1"
                        disabled={isLoading}
                      />
                    </div>
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
                        style={{ backgroundColor: settings.widgetPrimaryColor }}
                      />
                      <span className="text-sm">Couleur principale</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-16 h-6 rounded text-white text-xs flex items-center justify-center font-medium"
                        style={{ backgroundColor: settings.widgetButtonColor }}
                      >
                        Bouton
                      </div>
                      <span className="text-sm">Couleur des boutons</span>
                    </div>
                  </div>
                </div>

                {/* Widget Integration Code */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Code className="h-5 w-5" />
                      <span>Code d'intégration</span>
                    </CardTitle>
                    <CardDescription>
                      Copiez ce code pour intégrer le widget sur votre site web
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
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
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
