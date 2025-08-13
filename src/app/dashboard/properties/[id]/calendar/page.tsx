"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarView } from "@/components/planning/CalendarView";
import { IntegrationsManager } from "@/components/planning/IntegrationsManager";
import { CalendarSelector } from "@/components/planning/CalendarSelector";
import { Calendar, Settings, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function PropertyCalendarPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const propertyId = params.id as string;
  const [activeTab, setActiveTab] = useState("calendar");
  const [propertyName, setPropertyName] = useState("");

  useEffect(() => {
    // Fetch property details
    const fetchProperty = async () => {
      try {
        const response = await fetch(`/api/properties/${propertyId}`);
        if (response.ok) {
          const property = await response.json();
          setPropertyName(property.name);
        }
      } catch (error) {
        console.error("Error fetching property:", error);
      }
    };

    fetchProperty();
  }, [propertyId]);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "google_calendar_connected") {
      toast.success("Google Calendar connecté avec succès !");
      setActiveTab("integrations");
    } else if (error) {
      const errorMessages = {
        oauth_error: "Erreur lors de l'authentification Google",
        missing_params: "Paramètres manquants pour la connexion",
        token_exchange_failed: "Échec de l'échange de token",
        callback_failed: "Erreur lors du retour de Google",
      };
      toast.error(
        errorMessages[error as keyof typeof errorMessages] ||
          "Erreur de connexion"
      );
      setActiveTab("integrations");
    }
  }, [searchParams]);

  const handleAddEvent = (date: Date) => {
    console.log("Ajouter un événement pour:", date);
    // TODO: Ouvrir un modal pour ajouter un événement
    toast.info(
      `Ajouter un événement pour le ${date.toLocaleDateString("fr-FR")}`
    );
  };

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Planning{propertyName && ` - ${propertyName}`}
        </h1>
        <p className="text-gray-600 mt-2">
          Gérez les réservations et synchronisez avec vos calendriers externes
          pour cette propriété
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendrier
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Intégrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <CalendarView onAddEvent={handleAddEvent} propertyId={propertyId} />
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <CalendarSelector />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <IntegrationsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
