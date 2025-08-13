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
import { ReservationModal } from "@/components/reservations/ReservationModal";
import { type Currency } from "@/lib/currency";

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
  pricingType?: string | null;
  pricePerNight?: number | null;
  capacity?: number | null;
  description?: string | null;
}

interface Reservation {
  id: string;
  guestName: string;
  guestEmail?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  duration?: number;
  notes?: string;
  roomName: string;
  propertyName: string;
}

interface CalendarViewProps {
  propertyId?: string;
}

export function CalendarView({ propertyId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<"day" | "month">("day"); // Default to day view
  const [hasGoogleCalendarIntegration, setHasGoogleCalendarIntegration] =
    useState<boolean | null>(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reservationRooms, setReservationRooms] = useState<Room[]>([]);
  const [currency, setCurrency] = useState<Currency>("XOF");

  // Fetch rooms for reservation modal
  useEffect(() => {
    const fetchReservationData = async () => {
      try {
        const response = await fetch("/api/reservations");
        if (response.ok) {
          const data = await response.json();
          // Extract rooms from the response and set currency
          if (data.currency) {
            setCurrency(data.currency);
          }
        }
      } catch (error) {
        console.error("Error fetching reservation data:", error);
      }
    };

    fetchReservationData();
  }, []);

  // Transform rooms for reservation modal
  const transformedRooms = rooms.map((room) => ({
    id: room.id,
    name: room.name,
    propertyName: room.propertyName,
    pricePerNight: room.pricePerNight || 0,
    type: "space" as const, // Default type
  }));

  // Handle adding a new reservation
  const handleAddReservation = (date: Date) => {
    setSelectedDate(date);
    setIsReservationModalOpen(true);
  };

  // Create a reservation object for the modal with pre-filled date
  const createNewReservation = () => {
    if (!selectedDate) return undefined;

    return {
      id: "",
      roomId: "",
      guestName: "",
      guestEmail: "",
      startDate: selectedDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
      endDate: selectedDate.toISOString().split("T")[0],
      status: "PENDING",
      totalPrice: 0,
      notes: "",
    };
  };

  const handleCloseReservationModal = () => {
    setIsReservationModalOpen(false);
    setSelectedDate(null);
  };

  const handleSaveReservation = () => {
    fetchEvents(); // Re-fetch events to include the new reservation
    handleCloseReservationModal();
  };

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

  // Récupérer les événements Google Calendar et les réservations
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

      // Si propertyId est fourni, l'ajouter aux paramètres
      if (propertyId) {
        params.append("propertyId", propertyId);
      }

      console.log("🔍 Fetching events:", {
        selectedRoom: selectedRoom || "all",
        propertyId: propertyId || "all properties",
        url: `/api/integrations/google-calendar/events?${params.toString()}`,
      });

      // Récupérer les événements Google Calendar
      let googleEvents: CalendarEvent[] = [];
      try {
        const response = await fetch(
          `/api/integrations/google-calendar/events?${params.toString()}`
        );

        if (response.ok) {
          const data = await response.json();
          console.log("📅 Google Calendar events received:", {
            totalEvents: data.events?.length || 0,
            calendarsUsed: data.calendarsUsed || [data.calendarId],
            totalCalendars: data.totalCalendars || 1,
          });
          googleEvents = data.events || [];
          // Si on récupère des événements avec succès, l'intégration fonctionne
          setHasGoogleCalendarIntegration(true);
        } else if (response.status === 404) {
          // Intégration Google Calendar non configurée
          console.log(
            "Google Calendar non configuré - affichage sans événements externes"
          );
          setHasGoogleCalendarIntegration(false);
        } else {
          console.error(
            "Erreur lors de la récupération des événements Google Calendar:",
            response.statusText
          );
          setHasGoogleCalendarIntegration(false);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des événements Google Calendar:",
          error
        );
        setHasGoogleCalendarIntegration(false);
      }

      // Récupérer les réservations depuis la base de données
      let reservationEvents: CalendarEvent[] = [];
      try {
        const reservationParams = new URLSearchParams({
          startDate: timeMin,
          endDate: timeMax,
        });

        if (selectedRoom && selectedRoom !== "all") {
          reservationParams.append("roomId", selectedRoom);
        }

        if (propertyId) {
          reservationParams.append("propertyId", propertyId);
        }

        console.log("🏨 Fetching reservations:", {
          selectedRoom: selectedRoom || "all",
          propertyId: propertyId || "all properties",
          url: `/api/reservations?${reservationParams.toString()}`,
        });

        const reservationResponse = await fetch(
          `/api/reservations?${reservationParams.toString()}`
        );

        if (reservationResponse.ok) {
          const reservationData = await reservationResponse.json();
          console.log("📋 Reservations received:", {
            totalReservations: reservationData.reservations?.length || 0,
          });

          // Transformer les réservations en événements de calendrier
          reservationEvents = (reservationData.reservations || []).map(
            (reservation: Reservation) => {
              // Combine date and time for proper display
              let eventStartDate = reservation.startDate;
              let eventEndDate = reservation.endDate;

              // If we have startTime, create proper datetime
              if (reservation.startTime) {
                const startDate = new Date(reservation.startDate);
                const [hours, minutes] = reservation.startTime
                  .split(":")
                  .map(Number);
                startDate.setHours(hours, minutes, 0, 0);
                eventStartDate = startDate.toISOString();

                // Calculate end time using duration
                if (reservation.duration) {
                  const endDate = new Date(startDate);
                  endDate.setHours(startDate.getHours() + reservation.duration);
                  eventEndDate = endDate.toISOString();
                }
              }

              return {
                id: `reservation-${reservation.id}`,
                title: `${reservation.guestName}`,
                description: `Réservation - ${reservation.roomName}${
                  reservation.notes ? ` (${reservation.notes})` : ""
                }`,
                startDate: eventStartDate,
                endDate: eventEndDate,
                eventType: "reservation",
                source: "internal",
                location: `${reservation.propertyName} - ${reservation.roomName}`,
                attendees: reservation.guestEmail
                  ? [
                      {
                        email: reservation.guestEmail,
                        name: reservation.guestName,
                        responseStatus: "accepted",
                      },
                    ]
                  : [],
              };
            }
          );
        } else {
          console.error(
            "Erreur lors de la récupération des réservations:",
            reservationResponse.statusText
          );
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des réservations:",
          error
        );
      }

      // Combiner les événements Google Calendar et les réservations
      const allEvents = [...googleEvents, ...reservationEvents];
      console.log("📅 Total events combined:", {
        googleEvents: googleEvents.length,
        reservationEvents: reservationEvents.length,
        total: allEvents.length,
      });

      setEvents(allEvents);
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
      const eventStartDate = new Date(event.startDate);
      const eventEndDate = new Date(event.endDate);
      const targetDate = new Date(date);

      // Reset time to compare only dates
      eventStartDate.setHours(0, 0, 0, 0);
      eventEndDate.setHours(23, 59, 59, 999);
      targetDate.setHours(0, 0, 0, 0);

      // Check if the target date falls within the event's date range
      return targetDate >= eventStartDate && targetDate <= eventEndDate;
    });

    return filteredEvents;
  };

  const getEventsForDayView = (date: Date) => {
    return events.filter((event) => {
      const eventStartDate = new Date(event.startDate);
      const eventEndDate = new Date(event.endDate);
      const targetDate = new Date(date);

      // For day view, we want events that occur on this specific day
      const isSameDay = (date1: Date, date2: Date) => {
        return date1.toDateString() === date2.toDateString();
      };

      // Include events that start, end, or span through this day
      return (
        isSameDay(eventStartDate, targetDate) ||
        isSameDay(eventEndDate, targetDate) ||
        (eventStartDate < targetDate && eventEndDate > targetDate)
      );
    });
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
    if (source === "internal" && eventType === "reservation") {
      return "bg-purple-100 text-purple-800 border-purple-200";
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
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={view === "day" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setView("day")}
                  className="h-8"
                >
                  Jour
                </Button>
                <Button
                  variant={view === "month" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setView("month")}
                  className="h-8"
                >
                  Mois
                </Button>
              </div>

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
                  onClick={() => setCurrentDate(new Date())}
                  className="text-sm"
                >
                  Aujourd&apos;hui
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (view === "day") {
                      const newDate = new Date(currentDate);
                      newDate.setDate(currentDate.getDate() - 1);
                      setCurrentDate(newDate);
                    } else {
                      navigateMonth("prev");
                    }
                  }}
                >
                  ←
                </Button>
                <span className="text-lg font-semibold capitalize min-w-48 text-center">
                  {view === "day"
                    ? currentDate.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : monthName}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (view === "day") {
                      const newDate = new Date(currentDate);
                      newDate.setDate(currentDate.getDate() + 1);
                      setCurrentDate(newDate);
                    } else {
                      navigateMonth("next");
                    }
                  }}
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

      {/* Calendrier */}
      <Card>
        <CardContent className="p-0">
          {view === "month" ? (
            // Vue mois
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
                const isToday =
                  date.toDateString() === new Date().toDateString();

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
                          onClick={() => handleAddReservation(date)}
                          title="Ajouter une réservation"
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
          ) : (
            // Vue jour
            <div className="bg-white">
              {/* En-tête du jour */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {currentDate.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {getEventsForDayView(currentDate).length} événement(s)
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleAddReservation(currentDate)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une réservation
                  </Button>
                </div>
              </div>

              {/* Grille horaire */}
              <div className="grid grid-cols-[100px_1fr] max-h-[600px] overflow-y-auto">
                {/* Heures */}
                <div className="border-r border-gray-200">
                  {Array.from({ length: 24 }, (_, hour) => (
                    <div
                      key={hour}
                      className="h-16 border-b border-gray-100 p-2 text-sm text-gray-500 flex items-start"
                    >
                      {hour.toString().padStart(2, "0")}:00
                    </div>
                  ))}
                </div>

                {/* Événements */}
                <div className="relative">
                  {Array.from({ length: 24 }, (_, hour) => (
                    <div
                      key={hour}
                      className="h-16 border-b border-gray-100 relative"
                    />
                  ))}

                  {/* Événements positionnés */}
                  {getEventsForDayView(currentDate).map((event) => {
                    const startTime = new Date(event.startDate);
                    const endTime = new Date(event.endDate);

                    // Calculer la position et la hauteur
                    const startHour = startTime.getHours();
                    const startMinute = startTime.getMinutes();
                    const endHour = endTime.getHours();
                    const endMinute = endTime.getMinutes();

                    const top = (startHour + startMinute / 60) * 64; // 64px par heure
                    const height = Math.max(
                      (endHour +
                        endMinute / 60 -
                        (startHour + startMinute / 60)) *
                        64,
                      32 // Hauteur minimum
                    );

                    return (
                      <div
                        key={event.id}
                        className={`absolute left-2 right-2 rounded p-2 text-sm border ${getEventColor(
                          event.eventType,
                          event.source
                        )} shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                        }}
                        title={event.description}
                      >
                        <div className="font-medium truncate">
                          {event.title}
                        </div>
                        <div className="text-xs opacity-75">
                          {formatTime(event.startDate)} -{" "}
                          {formatTime(event.endDate)}
                        </div>
                        {event.location && (
                          <div className="text-xs opacity-75 truncate">
                            📍 {event.location}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Message si aucun événement */}
              {getEventsForDayView(currentDate).length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun événement
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Aucun événement prévu pour cette journée
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => handleAddReservation(currentDate)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une réservation
                  </Button>
                </div>
              )}
            </div>
          )}
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
              <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
              <span className="text-sm">Réservations</span>
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

      {/* Modale de réservation */}
      {isReservationModalOpen && (
        <ReservationModal
          isOpen={isReservationModalOpen}
          onClose={handleCloseReservationModal}
          onSave={handleSaveReservation}
          rooms={transformedRooms}
          currency={currency}
          reservation={createNewReservation()}
        />
      )}
    </div>
  );
}
