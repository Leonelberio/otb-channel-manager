"use client";

import { useState, useEffect } from "react";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Home, Wifi } from "lucide-react";

// Icônes pour les différentes plateformes
const GoogleCalendarIcon = () => (
  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
    <Calendar className="h-6 w-6 text-white" />
  </div>
);

const AirbnbIcon = () => (
  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
    <Home className="h-6 w-6 text-white" />
  </div>
);

const BookingIcon = () => (
  <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
    <Wifi className="h-6 w-6 text-white" />
  </div>
);

const ExpediaIcon = () => (
  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
    <Home className="h-6 w-6 text-white" />
  </div>
);

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  available: boolean;
}

interface DatabaseIntegration {
  id: string;
  type: string;
  name: string;
  lastSyncAt: string | null;
  createdAt: string;
}

export function IntegrationsManager() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "google-calendar",
      name: "Google Calendar",
      description:
        "Synchronisez avec votre calendrier Google pour éviter les conflits",
      icon: <GoogleCalendarIcon />,
      status: "disconnected",
      available: true,
    },
    {
      id: "airbnb",
      name: "Airbnb",
      description: "Synchronisez automatiquement vos réservations Airbnb",
      icon: <AirbnbIcon />,
      status: "disconnected",
      available: false, // Désactivé pour l'instant
    },
    {
      id: "booking",
      name: "Booking.com",
      description: "Importez vos réservations depuis Booking.com",
      icon: <BookingIcon />,
      status: "disconnected",
      available: false, // Désactivé pour l'instant
    },
    {
      id: "expedia",
      name: "Expedia",
      description: "Gérez vos réservations Expedia en un clic",
      icon: <ExpediaIcon />,
      status: "disconnected",
      available: false, // Désactivé pour l'instant
    },
  ]);

  const [loadingIntegrations, setLoadingIntegrations] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);

  // Récupérer les intégrations depuis la base de données
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const response = await fetch("/api/integrations");
        if (response.ok) {
          const data = await response.json();
          const dbIntegrations = data.integrations as DatabaseIntegration[];

          console.log("Intégrations récupérées depuis la DB:", dbIntegrations);

          // Mettre à jour l'état local avec les données de la base
          setIntegrations((prev) =>
            prev.map((integration) => {
              // Mapper les IDs du frontend vers les types de la base de données
              const typeMapping: Record<string, string> = {
                "google-calendar": "google_calendar",
                "airbnb": "airbnb",
                "booking": "booking",
                "expedia": "expedia",
              };

              const dbType = typeMapping[integration.id];
              const dbIntegration = dbIntegrations.find(
                (db) => db.type === dbType
              );

              console.log(
                `Recherche pour ${integration.id} (${dbType}):`,
                dbIntegration
              );

              if (dbIntegration) {
                return {
                  ...integration,
                  status: "connected" as const,
                  lastSync: dbIntegration.lastSyncAt
                    ? new Date(dbIntegration.lastSyncAt).toLocaleString("fr-FR")
                    : undefined,
                };
              }
              return integration;
            })
          );
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des intégrations:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  const handleConnect = async (integrationId: string) => {
    setLoadingIntegrations((prev) => new Set(prev).add(integrationId));

    try {
      if (integrationId === "google-calendar") {
        // Logique de connexion Google Calendar
        await handleGoogleCalendarConnect();
      } else if (integrationId === "airbnb") {
        // Logique de connexion Airbnb
        await handleAirbnbConnect();
      }

      // Simuler un délai
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mettre à jour le statut
      setIntegrations((prev) =>
        prev.map((integration) =>
          integration.id === integrationId
            ? {
                ...integration,
                status: "connected" as const,
                lastSync: new Date().toLocaleString("fr-FR"),
              }
            : integration
        )
      );
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      setIntegrations((prev) =>
        prev.map((integration) =>
          integration.id === integrationId
            ? { ...integration, status: "error" as const }
            : integration
        )
      );
    } finally {
      setLoadingIntegrations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(integrationId);
        return newSet;
      });
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === integrationId
          ? {
              ...integration,
              status: "disconnected" as const,
              lastSync: undefined,
            }
          : integration
      )
    );
  };

  const handleRefresh = async (integrationId: string) => {
    setLoadingIntegrations((prev) => new Set(prev).add(integrationId));

    // Simuler une synchronisation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === integrationId
          ? { ...integration, lastSync: new Date().toLocaleString("fr-FR") }
          : integration
      )
    );

    setLoadingIntegrations((prev) => {
      const newSet = new Set(prev);
      newSet.delete(integrationId);
      return newSet;
    });
  };

  const handleGoogleCalendarConnect = async () => {
    try {
      // Appeler notre API pour obtenir l'URL d'autorisation
      const response = await fetch("/api/integrations/google-calendar/auth");

      if (!response.ok) {
        throw new Error("Erreur lors de la génération de l'URL d'autorisation");
      }

      const data = await response.json();

      // Rediriger vers l'URL d'autorisation Google
      window.location.href = data.authUrl;
    } catch (error) {
      console.error("Erreur lors de la connexion à Google Calendar:", error);
      throw error;
    }
  };

  const handleAirbnbConnect = async () => {
    // TODO: Implémenter l'authentification Airbnb
    console.log("Connexion à Airbnb...");
  };

  const connectedCount = integrations.filter(
    (i) => i.status === "connected"
  ).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Intégrations Externes
            </CardTitle>
            <CardDescription>Chargement des intégrations...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Intégrations Externes
          </CardTitle>
          <CardDescription>
            Connectez vos plateformes pour synchroniser automatiquement vos
            réservations et calendriers.
            {connectedCount > 0 && (
              <span className="block mt-1 text-green-600 font-medium">
                {connectedCount} intégration{connectedCount > 1 ? "s" : ""}{" "}
                connectée{connectedCount > 1 ? "s" : ""}
              </span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Grille des intégrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            name={integration.name}
            description={integration.description}
            icon={integration.icon}
            status={integration.status}
            lastSync={integration.lastSync}
            onConnect={() =>
              integration.available ? handleConnect(integration.id) : null
            }
            onDisconnect={() => handleDisconnect(integration.id)}
            onRefresh={() => handleRefresh(integration.id)}
            isLoading={loadingIntegrations.has(integration.id)}
            available={integration.available}
          />
        ))}
      </div>

      {/* Section à venir */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Plus className="h-8 w-8 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Plus d&apos;intégrations à venir
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Nous travaillons sur de nouvelles intégrations avec d&apos;autres
            plateformes populaires.
          </p>
          <Button variant="outline" size="sm">
            Suggérer une plateforme
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
