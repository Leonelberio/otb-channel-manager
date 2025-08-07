"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Settings,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface Room {
  id: string;
  name: string;
  propertyName: string;
  equipmentCount: number;
  reservationCount: number;
  pricingType?: string | null;
  pricePerNight?: number | null;
  capacity?: number | null;
  description?: string | null;
}

interface GoogleCalendar {
  id: string;
  name: string;
  description: string;
  isPrimary: boolean;
  accessRole: string;
  backgroundColor: string;
  foregroundColor: string;
}

interface CalendarConfig {
  id: string;
  roomId: string;
  calendarId: string;
  calendarName: string;
  isActive: boolean;
  room: {
    id: string;
    name: string;
    propertyName: string;
  };
}

export function CalendarSelector() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [configs, setConfigs] = useState<CalendarConfig[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedCalendar, setSelectedCalendar] = useState<string>("");
  const [editingConfig, setEditingConfig] = useState<CalendarConfig | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);

  // Récupérer les espaces
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch("/api/rooms");
        if (response.ok) {
          const data = await response.json();
          setRooms(data.rooms || []);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des espaces:", error);
      }
    };

    fetchRooms();
  }, []);

  // Récupérer les agendas Google Calendar
  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        const response = await fetch(
          "/api/integrations/google-calendar/calendars"
        );
        if (response.ok) {
          const data = await response.json();
          setCalendars(data.calendars || []);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des agendas:", error);
      }
    };

    fetchCalendars();
  }, []);

  // Récupérer les configurations existantes
  const fetchConfigs = async () => {
    try {
      const response = await fetch("/api/calendar-config");
      if (response.ok) {
        const data = await response.json();
        setConfigs(data.configs || []);
      } else {
        console.error(
          "Erreur API calendar-config:",
          response.status,
          response.statusText
        );
        // En cas d'erreur, on continue avec une liste vide
        setConfigs([]);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des configurations:",
        error
      );
      // En cas d'erreur, on continue avec une liste vide
      setConfigs([]);
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSaveConfig = async () => {
    if (!selectedRoom || !selectedCalendar) {
      toast.error("Veuillez sélectionner un espace et un agenda");
      return;
    }

    setIsLoading(true);
    try {
      const calendar = calendars.find((c) => c.id === selectedCalendar);
      if (!calendar) {
        toast.error("Agenda non trouvé");
        return;
      }

      const response = await fetch("/api/calendar-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: selectedRoom,
          calendarId: selectedCalendar,
          calendarName: calendar.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(
          editingConfig
            ? "Configuration mise à jour avec succès !"
            : "Configuration sauvegardée avec succès !"
        );

        // Rafraîchir la liste des configurations
        await fetchConfigs();

        // Réinitialiser les sélections
        setSelectedRoom("");
        setSelectedCalendar("");
        setEditingConfig(null);
      } else {
        toast.error("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditConfig = (config: CalendarConfig) => {
    setEditingConfig(config);
    setSelectedRoom(config.roomId);
    setSelectedCalendar(config.calendarId);
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette configuration ?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/calendar-config?configId=${configId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Configuration supprimée avec succès !");
        await fetchConfigs();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleCancelEdit = () => {
    setEditingConfig(null);
    setSelectedRoom("");
    setSelectedCalendar("");
  };

  const getConfigForRoom = (roomId: string) => {
    return configs.find((c) => c.roomId === roomId);
  };

  if (isLoadingConfigs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration des Agendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">
              Chargement des configurations...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration d'un nouvel agenda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {editingConfig
              ? "Modifier la Configuration"
              : "Configuration des Agendas"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room-select">Espace</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un espace" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.propertyName} - {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="calendar-select">Agenda Google Calendar</Label>
              <Select
                value={selectedCalendar}
                onValueChange={setSelectedCalendar}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un agenda" />
                </SelectTrigger>
                <SelectContent>
                  {calendars.map((calendar) => (
                    <SelectItem key={calendar.id} value={calendar.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: calendar.backgroundColor }}
                        ></div>
                        {calendar.name}
                        {calendar.isPrimary && (
                          <Badge variant="secondary" className="text-xs">
                            Principal
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSaveConfig}
              disabled={!selectedRoom || !selectedCalendar || isLoading}
              className="flex-1"
            >
              {isLoading
                ? "Sauvegarde..."
                : editingConfig
                ? "Mettre à jour la configuration"
                : "Sauvegarder la configuration"}
            </Button>
            {editingConfig && (
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isLoading}
              >
                Annuler
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des configurations existantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Configurations Actuelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune configuration d&apos;agenda définie</p>
              <p className="text-sm">Configurez un agenda pour commencer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">
                        {config.room.propertyName} - {config.room.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Agenda: {config.calendarName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600">
                      Configuré
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditConfig(config)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteConfig(config.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Espaces non configurés */}
      {rooms.length > configs.length && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Espaces Non Configurés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rooms
                .filter((room) => !configs.find((c) => c.roomId === room.id))
                .map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-orange-50"
                  >
                    <div>
                      <p className="font-medium">
                        {room.propertyName} - {room.name}
                      </p>
                      <p className="text-sm text-orange-600">
                        Aucun agenda configuré - utilise l&apos;agenda principal
                      </p>
                    </div>
                    <Badge variant="outline" className="text-orange-600">
                      À configurer
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
