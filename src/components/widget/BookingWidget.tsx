"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  Building2,
  Clock,
  CreditCard,
  Phone,
  Users,
  MapPin,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast, Toaster } from "sonner";
import { formatCurrency, type Currency } from "@/lib/currency";

interface Room {
  id: string;
  name: string;
  propertyName: string;
  pricePerNight: number;
  pricingType: string;
}

interface WidgetConfig {
  primaryColor: string;
  buttonColor: string;
  organizationId: string;
}

interface BookingWidgetProps {
  config: WidgetConfig;
}

const timeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

const durationOptions = [
  { value: 1, label: "1 heure" },
  { value: 2, label: "2 heures" },
  { value: 3, label: "3 heures" },
  { value: 4, label: "4 heures" },
  { value: 5, label: "5 heures" },
  { value: 6, label: "6 heures" },
  { value: 7, label: "7 heures" },
  { value: 8, label: "Journée complète" },
];

// Helper function pour obtenir le label de pricing
const getPricingLabel = (pricingType: string) => {
  switch (pricingType) {
    case "hour":
      return "/heure";
    case "day":
      return "/jour";
    case "night":
    default:
      return "/nuit";
  }
};

// Composant ToasterWrapper pour s'assurer que les toasts s'affichent correctement dans l'iframe
function ToasterWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <Toaster
      position="top-center"
      richColors
      closeButton
      duration={4000}
      style={{
        zIndex: 999999,
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
      }}
      toastOptions={{
        style: {
          background: "white",
          color: "black",
          border: "1px solid #e5e7eb",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          minWidth: "300px",
          padding: "12px 16px",
        },
      }}
    />,
    document.body
  );
}

export function BookingWidget({ config }: BookingWidgetProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(
    undefined
  );
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(1);
  const [quote, setQuote] = useState<number | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [existingReservations, setExistingReservations] = useState<
    Array<{ startDate: string; endDate: string }>
  >([]);
  const [currency, setCurrency] = useState<Currency>("EUR");

  // Helper function pour obtenir le label de pricing
  const getPricingLabel = (pricingType: string) => {
    switch (pricingType) {
      case "hour":
        return "/heure";
      case "day":
        return "/jour";
      case "night":
      default:
        return "/nuit";
    }
  };

  // Form fields for booking
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchRooms();
  }, [config.organizationId]);

  useEffect(() => {
    if (selectedRoom) {
      fetchReservations();
    }
  }, [selectedRoom]);

  // Vérifier les conflits en temps réel quand les sélections changent
  useEffect(() => {
    if (selectedRoom && selectedDate && selectedEndDate && selectedTime) {
      const conflicts = checkConflicts();
      if (conflicts) {
        toast.error(
          "Ce créneau horaire n'est plus disponible. Veuillez choisir un autre horaire ou une autre date."
        );
      }
    }
  }, [
    selectedDate,
    selectedEndDate,
    selectedTime,
    duration,
    existingReservations,
  ]);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/widget/rooms?orgId=${config.organizationId}`
      );
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
        setCurrency(data.currency || "EUR");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des espaces:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const response = await fetch(
        `/api/widget/reservations?orgId=${config.organizationId}&roomId=${selectedRoom?.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setExistingReservations(data.reservations || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des réservations:", error);
    }
  };

  // Fonction pour vérifier si une date est complètement réservée (tous les créneaux)
  const isDateFullyReserved = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];

    // Vérifier si tous les créneaux horaires sont occupés pour cette date
    const availableSlots = timeSlots.filter((time) => {
      const selectedDateTime = new Date(date);
      const [hours, minutes] = time.split(":").map(Number);
      selectedDateTime.setHours(hours, minutes, 0, 0);

      return !existingReservations.some((reservation) => {
        const start = new Date(reservation.startDate);
        const end = new Date(reservation.endDate);

        // Si c'est la même date, vérifier les heures
        if (start.toDateString() === date.toDateString()) {
          const reservationStart = new Date(start);
          const reservationEnd = new Date(end);

          // Vérifier si le créneau chevauche la réservation existante
          return (
            selectedDateTime < reservationEnd &&
            selectedDateTime.getTime() + 60 * 60 * 1000 > // 1 heure par défaut pour la vérification
              reservationStart.getTime()
          );
        }

        // Pour les dates différentes, vérifier si la date est dans la période
        return selectedDateTime >= start && selectedDateTime < end;
      });
    });

    return availableSlots.length === 0;
  };

  // Fonction pour désactiver les dates dans le calendrier
  const disabledDates = (date: Date) => {
    return date < new Date() || isDateFullyReserved(date);
  };

  // Fonction pour obtenir le nombre de créneaux disponibles pour une date
  const getAvailableSlotsCount = (date: Date) => {
    if (!selectedRoom) return timeSlots.length;

    return timeSlots.filter((time) => isTimeSlotAvailable(time, date, duration))
      .length;
  };

  // Fonction pour vérifier si un créneau horaire spécifique est disponible
  const isTimeSlotAvailable = (
    time: string,
    date: Date,
    selectedDuration: number = 1
  ) => {
    if (!selectedRoom) return true;

    const selectedDateTime = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    selectedDateTime.setHours(hours, minutes, 0, 0);

    return !existingReservations.some((reservation) => {
      const start = new Date(reservation.startDate);
      const end = new Date(reservation.endDate);

      // Si c'est la même date, vérifier les heures
      if (start.toDateString() === date.toDateString()) {
        const reservationStart = new Date(start);
        const reservationEnd = new Date(end);

        // Vérifier si le créneau demandé chevauche la réservation existante
        return (
          selectedDateTime < reservationEnd &&
          selectedDateTime.getTime() + selectedDuration * 60 * 60 * 1000 >
            reservationStart.getTime()
        );
      }

      // Pour les dates différentes, vérifier si la date est dans la période
      return selectedDateTime >= start && selectedDateTime < end;
    });
  };

  // Fonction pour vérifier les conflits en temps réel
  const checkConflicts = () => {
    if (!selectedRoom || !selectedDate || !selectedEndDate || !selectedTime) {
      return null;
    }

    const startDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(":").map(Number);
    startDateTime.setHours(hours, minutes, 0, 0);

    // Calculer la fin de la réservation
    let endDateTime = new Date(startDateTime);

    // Si c'est la même journée, utiliser la durée
    if (selectedDate.toDateString() === selectedEndDate.toDateString()) {
      if (duration >= 8) {
        // Journée complète
        endDateTime.setDate(endDateTime.getDate() + 1);
      } else {
        // Durée horaire
        endDateTime.setHours(endDateTime.getHours() + duration);
      }
    } else {
      // Plusieurs jours, utiliser la date de fin
      endDateTime = new Date(selectedEndDate);
      endDateTime.setHours(23, 59, 59, 999); // Fin de la journée
    }

    const conflicts = existingReservations.filter((reservation) => {
      const reservationStart = new Date(reservation.startDate);
      const reservationEnd = new Date(reservation.endDate);

      // Vérifier le chevauchement temporel
      // Un conflit existe si :
      // 1. Le début de la nouvelle réservation est avant la fin de l'existante ET
      // 2. La fin de la nouvelle réservation est après le début de l'existante
      const hasConflict =
        startDateTime < reservationEnd && endDateTime > reservationStart;

      if (hasConflict) {
        console.log("Conflit détecté:", {
          newStart: startDateTime,
          newEnd: endDateTime,
          existingStart: reservationStart,
          existingEnd: reservationEnd,
        });
      }

      return hasConflict;
    });

    return conflicts.length > 0 ? conflicts : null;
  };

  // Filtrer les créneaux horaires disponibles pour la date sélectionnée
  const availableTimeSlots = timeSlots.filter((time) =>
    isTimeSlotAvailable(time, selectedDate || new Date(), duration)
  );

  const calculateQuote = () => {
    if (!selectedRoom || !selectedDate || !selectedEndDate || !selectedTime)
      return 0;

    const basePrice = selectedRoom.pricePerNight;
    const start = new Date(selectedDate);
    const end = new Date(selectedEndDate);
    const pricingType = selectedRoom.pricingType || "night";

    // Calculer si c'est le même jour
    const isSameDay = start.toDateString() === end.toDateString();

    if (isSameDay) {
      // Réservation dans la même journée
      if (duration >= 8) {
        // Journée complète
        if (pricingType === "hour") {
          return basePrice * 8; // 8 heures pour une journée complète
        } else if (pricingType === "day") {
          return basePrice; // Prix journalier
        } else {
          // pricingType === "night", utiliser le prix nuit pour une journée
          return basePrice;
        }
      } else {
        // Durée horaire
        if (pricingType === "hour") {
          return basePrice * duration; // Prix par heure
        } else if (pricingType === "day") {
          return Math.round((basePrice / 8) * duration); // Convertir prix jour en horaire
        } else {
          // pricingType === "night", convertir en horaire (prix nuit / 24h)
          return Math.round((basePrice / 24) * duration);
        }
      }
    } else {
      // Réservation sur plusieurs jours
      const days = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (pricingType === "hour") {
        // Prix horaire, calculer pour des journées complètes (8h/jour)
        return basePrice * 8 * days;
      } else if (pricingType === "day") {
        // Prix journalier
        return basePrice * days;
      } else {
        // pricingType === "night", prix par nuit
        return basePrice * days;
      }
    }
  };

  const calculateEndTime = () => {
    if (!selectedTime) return "";
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const endHours = (hours + duration) % 24;
    return `${endHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const handleGetQuote = () => {
    if (selectedRoom && selectedDate && selectedEndDate && selectedTime) {
      // Vérifier les conflits en temps réel
      const conflicts = checkConflicts();

      if (conflicts) {
        console.log("Conflits détectés:", conflicts);
        console.log("Sélection actuelle:", {
          date: selectedDate,
          endDate: selectedEndDate,
          time: selectedTime,
          duration,
        });
        toast.error(
          "Ce créneau horaire n'est pas disponible. Veuillez choisir un autre horaire ou une autre date."
        );
        return;
      }

      setShowQuote(true);
    }
  };

  const handleBooking = async () => {
    if (
      !selectedRoom ||
      !selectedDate ||
      !selectedEndDate ||
      !selectedTime ||
      !guestName
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (selectedDate > selectedEndDate) {
      toast.error(
        "La date de fin doit être postérieure ou égale à la date de début"
      );
      return;
    }

    // Vérifier les conflits en temps réel avant d'envoyer la requête
    const conflicts = checkConflicts();
    if (conflicts) {
      toast.error(
        "Ce créneau horaire n'est plus disponible. Veuillez choisir un autre horaire ou une autre date."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedEndDate);

      // Si c'est la même journée, ajouter la durée
      if (startDate.toDateString() === endDate.toDateString()) {
        if (duration >= 8) {
          endDate.setDate(endDate.getDate() + 1);
        } else {
          endDate.setHours(endDate.getHours() + duration);
        }
      }

      const response = await fetch("/api/widget/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          guestName,
          guestEmail: guestEmail || null,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          startTime: selectedTime || null,
          duration: duration || null,
          totalPrice: calculateQuote(),
          notes: notes || null,
          organizationId: config.organizationId,
        }),
      });

      if (response.ok) {
        toast.success("Réservation créée avec succès !");
        // Reset form
        setSelectedRoom(null);
        setSelectedDate(undefined);
        setSelectedEndDate(undefined);
        setSelectedTime("");
        setDuration(1);
        setGuestName("");
        setGuestEmail("");
        setNotes("");
        setShowQuote(false);
        setExistingReservations([]);
      } else {
        const error = await response.json();
        console.log("Erreur API:", response.status, error);

        // Gestion spécifique des erreurs
        if (response.status === 409) {
          toast.error(
            "Ce créneau horaire n'est plus disponible. Veuillez choisir un autre horaire ou une autre date."
          );
        } else {
          toast.error(error.error || "Erreur lors de la réservation");
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la réservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallback = () => {
    toast.info("Fonctionnalité de rappel bientôt disponible !");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: config.primaryColor }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Réserver votre espace
        </h2>
        <p className="text-gray-600">
          Choisissez votre espace, sélectionnez vos dates et réservez
          instantanément.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Side - Selection Form */}
        <div className="space-y-6">
          {/* Step 1: Space Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Building2
                className="w-5 h-5 mr-2"
                style={{ color: config.primaryColor }}
              />
              1. Choisissez votre espace
            </h3>

            <Select
              value={selectedRoom?.id || ""}
              onValueChange={(value) => {
                const room = rooms.find((r) => r.id === value);
                setSelectedRoom(room || null);
                // Réinitialiser les sélections quand l'espace change
                if (!room) {
                  setSelectedDate(undefined);
                  setSelectedEndDate(undefined);
                  setSelectedTime("");
                  setDuration(1);
                  setShowQuote(false);
                  setExistingReservations([]);
                }
              }}
            >
              <SelectTrigger className="w-full min-h-[56px] p-3">
                <SelectValue
                  placeholder="Sélectionner un espace"
                  className="text-sm"
                >
                  {selectedRoom ? (
                    <div className="flex items-center w-full">
                      <span className="font-medium text-gray-900 text-sm truncate max-w-full">
                        {selectedRoom.propertyName} - {selectedRoom.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Choisir un espace
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-w-[300px]">
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id} className="py-2">
                    <div className="flex flex-col space-y-1">
                      <div className="font-medium text-gray-900 text-sm leading-tight">
                        {room.propertyName}
                      </div>
                      <div className="font-medium text-gray-900 text-sm leading-tight">
                        {room.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatCurrency(room.pricePerNight, currency)}
                        {getPricingLabel(room.pricingType)}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Date Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <CalendarIcon
                className="w-5 h-5 mr-2"
                style={{ color: config.primaryColor }}
              />
              2. Sélectionnez vos dates
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!selectedRoom}
                      className={cn(
                        "w-full justify-start text-left font-normal p-3 h-auto",
                        !selectedDate && "text-muted-foreground",
                        !selectedRoom && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "dd/MM/yyyy", { locale: fr })
                      ) : (
                        <span>
                          {selectedRoom ? "Date début" : "Choisir un espace"}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        // Réinitialiser la date de fin si elle est antérieure à la nouvelle date de début
                        if (date && selectedEndDate && date > selectedEndDate) {
                          setSelectedEndDate(undefined);
                        }
                        // Réinitialiser l'heure si la date change
                        setSelectedTime("");
                        setShowQuote(false);
                      }}
                      disabled={disabledDates}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!selectedRoom || !selectedDate}
                      className={cn(
                        "w-full justify-start text-left font-normal p-3 h-auto",
                        !selectedEndDate && "text-muted-foreground",
                        (!selectedRoom || !selectedDate) &&
                          "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedEndDate ? (
                        format(selectedEndDate, "dd/MM/yyyy", { locale: fr })
                      ) : (
                        <span>
                          {!selectedRoom
                            ? "Choisir un espace"
                            : !selectedDate
                            ? "Choisir date début"
                            : "Date fin"}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedEndDate}
                      onSelect={(date) => {
                        setSelectedEndDate(date);
                        // Réinitialiser l'heure si la date de fin change
                        setSelectedTime("");
                        setShowQuote(false);
                      }}
                      disabled={(date) => {
                        if (!selectedDate) return date < new Date();
                        return date < selectedDate || isDateFullyReserved(date);
                      }}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Step 3: Time and Duration */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Clock
                className="w-5 h-5 mr-2"
                style={{ color: config.primaryColor }}
              />
              3. Horaires et durée
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure de début
                </label>
                <Select
                  value={selectedTime}
                  onValueChange={setSelectedTime}
                  disabled={!selectedRoom || !selectedDate || !selectedEndDate}
                >
                  <SelectTrigger
                    className={cn(
                      !selectedRoom ||
                        !selectedDate ||
                        (!selectedEndDate && "opacity-50 cursor-not-allowed")
                    )}
                  >
                    <SelectValue
                      placeholder={
                        !selectedRoom
                          ? "Choisir un espace"
                          : !selectedDate
                          ? "Choisir dates"
                          : "Choisir heure"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => {
                      const isAvailable = isTimeSlotAvailable(
                        time,
                        selectedDate || new Date(),
                        duration
                      );
                      return (
                        <SelectItem
                          key={time}
                          value={time}
                          disabled={!isAvailable}
                          className={
                            !isAvailable ? "opacity-50 cursor-not-allowed" : ""
                          }
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{time}</span>
                            {!isAvailable && (
                              <span className="text-xs text-red-500 ml-2">
                                Occupé
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {selectedDate && availableTimeSlots.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    Cette date est complètement réservée
                  </p>
                )}
                {selectedDate &&
                  availableTimeSlots.length > 0 &&
                  availableTimeSlots.length < timeSlots.length && (
                    <p className="text-xs text-orange-500 mt-1">
                      {availableTimeSlots.length} créneau
                      {availableTimeSlots.length > 1 ? "x" : ""} disponible
                      {availableTimeSlots.length > 1 ? "s" : ""} sur{" "}
                      {timeSlots.length}
                    </p>
                  )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée
                </label>
                <Select
                  value={duration.toString()}
                  onValueChange={(value) => setDuration(Number(value))}
                  disabled={
                    !selectedRoom ||
                    !selectedDate ||
                    !selectedEndDate ||
                    !selectedTime
                  }
                >
                  <SelectTrigger
                    className={cn(
                      !selectedRoom ||
                        !selectedDate ||
                        !selectedEndDate ||
                        (!selectedTime && "opacity-50 cursor-not-allowed")
                    )}
                  >
                    <SelectValue
                      placeholder={
                        !selectedRoom
                          ? "Choisir un espace"
                          : !selectedDate
                          ? "Choisir dates"
                          : !selectedTime
                          ? "Choisir heure"
                          : "Choisir durée"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button
            onClick={handleGetQuote}
            disabled={
              !selectedRoom ||
              !selectedDate ||
              !selectedEndDate ||
              !selectedTime
            }
            className="w-full text-white py-3 text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: config.buttonColor }}
          >
            Obtenir un devis
          </Button>
        </div>

        {/* Right Side - Quote Display */}
        <div className="bg-gray-50 rounded-xl p-6">
          {showQuote && selectedRoom && selectedDate && selectedEndDate ? (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Votre devis</h3>

              <div className="bg-white rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Espace:</span>
                  <span className="font-semibold text-sm">
                    {selectedRoom.propertyName} - {selectedRoom.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Période:</span>
                  <span className="font-semibold text-sm">
                    {format(selectedDate, "dd/MM/yyyy", { locale: fr })} -{" "}
                    {format(selectedEndDate, "dd/MM/yyyy", { locale: fr })}
                  </span>
                </div>
                {selectedDate.toDateString() ===
                  selectedEndDate.toDateString() && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Horaires:</span>
                      <span className="font-semibold">
                        {selectedTime} - {calculateEndTime()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Durée:</span>
                      <span className="font-semibold">
                        {duration >= 8
                          ? "Journée complète"
                          : `${duration} heure${duration > 1 ? "s" : ""}`}
                      </span>
                    </div>
                  </>
                )}
                {selectedDate.toDateString() !==
                  selectedEndDate.toDateString() && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Nombre de jours:</span>
                    <span className="font-semibold">
                      {Math.ceil(
                        (selectedEndDate.getTime() - selectedDate.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      jour(s)
                    </span>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span
                      className="text-xl"
                      style={{ color: config.primaryColor }}
                    >
                      {formatCurrency(calculateQuote(), currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking Form */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">
                  Informations de réservation
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-opacity-50"
                    placeholder="Votre nom complet"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-opacity-50"
                    placeholder="votre@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-opacity-50"
                    rows={3}
                    placeholder="Notes ou demandes spéciales..."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleBooking}
                  disabled={isSubmitting || !guestName}
                  className="w-full text-white py-3 text-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
                  style={{ backgroundColor: config.buttonColor }}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-5 h-5 mr-2" />
                  )}
                  {isSubmitting ? "Réservation..." : "Confirmer la réservation"}
                </Button>

                <Button
                  onClick={handleCallback}
                  variant="outline"
                  className="w-full py-3 text-lg border-2 hover:bg-gray-50 flex items-center justify-center"
                  style={{
                    borderColor: config.buttonColor,
                    color: config.buttonColor,
                  }}
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Demander un rappel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 h-full flex items-center justify-center">
              <div>
                <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">
                  Sélectionnez vos options pour obtenir un devis
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <ToasterWrapper />
    </div>
  );
}
