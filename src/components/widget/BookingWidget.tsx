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
import { toast } from "sonner";
import { formatCurrency, type Currency } from "@/lib/currency";

interface Room {
  id: string;
  name: string;
  propertyName: string;
  pricePerNight: number;
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

export function BookingWidget({ config }: BookingWidgetProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(1);
  const [showQuote, setShowQuote] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currency, setCurrency] = useState<Currency>("EUR");

  // Form fields for booking
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchRooms();
  }, [config.organizationId]);

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

  const calculateQuote = () => {
    if (!selectedRoom || !selectedDate || !selectedTime) return 0;

    const basePrice = selectedRoom.pricePerNight;
    if (duration >= 8) {
      return basePrice; // Prix journée
    } else {
      return Math.round((basePrice / 24) * duration); // Prix horaire
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
    if (selectedRoom && selectedDate && selectedTime) {
      setShowQuote(true);
    }
  };

  const handleBooking = async () => {
    if (!selectedRoom || !selectedDate || !selectedTime || !guestName) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    try {
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);

      // Ajouter la durée à la date de fin
      if (duration >= 8) {
        endDate.setDate(endDate.getDate() + 1);
      } else {
        endDate.setHours(endDate.getHours() + duration);
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
        setSelectedTime("");
        setDuration(1);
        setGuestName("");
        setGuestEmail("");
        setNotes("");
        setShowQuote(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la réservation");
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
              }}
            >
              <SelectTrigger className="w-full h-14 p-3">
                <SelectValue placeholder="Sélectionner un espace">
                  {selectedRoom ? (
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {selectedRoom.propertyName} - {selectedRoom.name}
                      </span>
                    </div>
                  ) : (
                    "Sélectionner un espace"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    <div className="flex flex-col">
                      <div className="font-medium text-gray-900">
                        {room.propertyName} - {room.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(room.pricePerNight, currency)}/jour
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
              2. Sélectionnez votre date
            </h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal p-3 h-auto",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
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
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une heure" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée
                </label>
                <Select
                  value={duration.toString()}
                  onValueChange={(value) => setDuration(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir la durée" />
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
            disabled={!selectedRoom || !selectedDate || !selectedTime}
            className="w-full text-white py-3 text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: config.buttonColor }}
          >
            Obtenir un devis
          </Button>
        </div>

        {/* Right Side - Quote Display */}
        <div className="bg-gray-50 rounded-xl p-6">
          {showQuote && selectedRoom && selectedDate ? (
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
                  <span className="text-gray-600">Date:</span>
                  <span className="font-semibold">
                    {format(selectedDate, "PPP", { locale: fr })}
                  </span>
                </div>
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
    </div>
  );
}
