"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, RefreshCw, MapPin, AlertCircle } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  eventType: string;
  source: string;
  location?: string;
  attendees?: Array<{
    email: string;
    name?: string;
    responseStatus?: string;
  }>;
}

interface Room {
  id: string;
  name: string;
  propertyName: string;
  equipmentCount: number;
  reservationCount: number;
}

interface CalendarViewProps {
  onAddEvent: (date: Date) => void;
}

export function CalendarView({ onAddEvent }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGoogleCalendarIntegration, setHasGoogleCalendarIntegration] =
    useState<boolean | null>(null);

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

  // Récupérer les événements Google Calendar
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const timeMin = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      ).toISOString();
      const timeMax = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).toISOString();

      const params = new URLSearchParams({
        timeMin,
        timeMax,
      });

      if (selectedRoom && selectedRoom !== "all") {
        params.append("roomId", selectedRoom);
      }

      console.log("🔍 Fetching events:", {
        selectedRoom: selectedRoom || "all",
        url: `/api/integrations/google-calendar/events?${params.toString()}`,
      });

      const response = await fetch(
        `/api/integrations/google-calendar/events?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log("📅 Events received:", {
          totalEvents: data.events?.length || 0,
          calendarsUsed: data.calendarsUsed || [data.calendarId],
          totalCalendars: data.totalCalendars || 1,
        });
        setEvents(data.events || []);
        // Si on récupère des événements avec succès, l'intégration fonctionne
        setHasGoogleCalendarIntegration(true);
      } else if (response.status === 404) {
        // Intégration Google Calendar non configurée
        console.log(
          "Google Calendar non configuré - affichage sans événements externes"
        );
        setEvents([]);
        setHasGoogleCalendarIntegration(false);
      } else {
        console.error(
          "Erreur lors de la récupération des événements:",
          response.statusText
        );
        setEvents([]);
        setHasGoogleCalendarIntegration(false);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des événements:", error);
      setEvents([]);
      setHasGoogleCalendarIntegration(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate, selectedRoom]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Ajouter les jours du mois précédent pour remplir la première semaine
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Ajouter les jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      days.push({ date: currentDate, isCurrentMonth: true });
    }

    // Ajouter les jours du mois suivant pour remplir la dernière semaine
    const remainingDays = 42 - days.length; // 6 semaines * 7 jours
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    const filteredEvents = events.filter((event) => {
      const eventDate = new Date(event.startDate);
      const match = eventDate.toDateString() === date.toDateString();
      return match;
    });

    return filteredEvents;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEventColor = (eventType: string, source: string) => {
    if (source === "google_calendar") {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    switch (eventType) {
      case "reservation":
        return "bg-green-100 text-green-800 border-green-200";
      case "blocked":
        return "bg-red-100 text-red-800 border-red-200";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Message informatif si Google Calendar n'est pas connecté */}
      {hasGoogleCalendarIntegration === false && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Google Calendar non connecté
                </p>
                <p className="text-sm text-yellow-700">
                  Connectez votre Google Calendar dans l&apos;onglet
                  &quot;Intégrations&quot; pour voir vos événements externes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* En-tête du calendrier */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendrier
            </CardTitle>
            <div className="flex items-center gap-4">
              {/* Sélecteur d'espace */}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Tous les espaces" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les espaces</SelectItem>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.propertyName} - {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                >
                  ←
                </Button>
                <span className="text-lg font-semibold capitalize">
                  {monthName}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth("next")}
                >
                  →
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchEvents}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grille du calendrier */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {/* En-têtes des jours */}
            {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
              <div
                key={day}
                className="bg-white p-3 text-center font-medium text-gray-500"
              >
                {day}
              </div>
            ))}

            {/* Jours du calendrier */}
            {days.map(({ date, isCurrentMonth }, index) => {
              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  className={`min-h-[120px] bg-white p-2 ${
                    !isCurrentMonth ? "text-gray-400" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm font-medium ${
                        isToday
                          ? "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                          : ""
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {isCurrentMonth && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onAddEvent(date)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Événements du jour */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded border ${getEventColor(
                          event.eventType,
                          event.source
                        )}`}
                        title={`${event.title} - ${formatTime(
                          event.startDate
                        )}`}
                      >
                        <div className="font-medium truncate">
                          {event.title}
                        </div>
                        <div className="text-xs opacity-75">
                          {formatTime(event.startDate)}
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{dayEvents.length - 2} autres
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Légende */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-sm">Google Calendar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-sm">Réservation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-sm">Bloqué</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span className="text-sm">Maintenance</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
