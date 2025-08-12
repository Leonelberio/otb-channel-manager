"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  formatCurrency,
  getCurrencySymbol,
  type Currency,
} from "@/lib/currency";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Calendar,
  Clock,
  User,
  Mail,
  FileText,
  CheckCircle,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
  addDays,
} from "date-fns";
import { fr } from "date-fns/locale";

interface Room {
  id: string;
  name: string;
  propertyName: string;
  pricePerNight: number;
}

interface Reservation {
  id: string;
  roomId: string;
  guestName: string;
  guestEmail?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  duration?: number;
  status: string;
  totalPrice?: number;
  notes?: string;
}

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  reservation?: Reservation;
  rooms: Room[];
  currency: Currency;
}

const TIME_SLOTS = [
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
];

const DURATION_OPTIONS = [
  { value: 1, label: "1 heure" },
  { value: 2, label: "2 heures" },
  { value: 3, label: "3 heures" },
  { value: 4, label: "4 heures" },
  { value: 5, label: "5 heures" },
  { value: 6, label: "6 heures" },
  { value: 7, label: "7 heures" },
  { value: 8, label: "Journée complète" },
];

type BookingStep = "space" | "calendar" | "time" | "details" | "confirmation";

export function ReservationModal({
  isOpen,
  onClose,
  onSave,
  reservation,
  rooms,
  currency,
}: ReservationModalProps) {
  const [currentStep, setCurrentStep] = useState<BookingStep>("space");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [existingReservations, setExistingReservations] = useState<
    Array<{
      id: string;
      startDate: string;
      startTime: string;
      duration: number;
      status: string;
    }>
  >([]);
  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep("space");
      setSelectedRoom("");
      setSelectedDate(null);
      setSelectedTime("");
      setSelectedDuration(1);
      setFormData({
        guestName: "",
        guestEmail: "",
        notes: "",
      });
      setExistingReservations([]);
    }
  }, [isOpen]);

  // Handle existing reservation data
  useEffect(() => {
    if (reservation && isOpen) {
      setSelectedRoom(reservation.roomId);
      setSelectedDate(new Date(reservation.startDate));
      setSelectedTime(reservation.startTime || "");
      setSelectedDuration(reservation.duration || 1);
      setFormData({
        guestName: reservation.guestName,
        guestEmail: reservation.guestEmail || "",
        notes: reservation.notes || "",
      });
      setCurrentStep("details");
    }
  }, [reservation, isOpen]);

  // Fetch existing reservations when room is selected
  useEffect(() => {
    if (selectedRoom && currentStep === "calendar") {
      fetchExistingReservations();
    }
  }, [selectedRoom, currentStep]);

  const fetchExistingReservations = async () => {
    try {
      const response = await fetch(`/api/reservations?roomId=${selectedRoom}`);
      if (response.ok) {
        const data = await response.json();
        setExistingReservations(data.reservations || []);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des réservations:", error);
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentMonth(subMonths(currentMonth, 1));
    } else {
      setCurrentMonth(addMonths(currentMonth, 1));
    }
  };

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const isDateAvailable = (date: Date) => {
    if (!selectedRoom || date < new Date()) return false;

    // Check if there are any available time slots for this date
    const dateString = format(date, "yyyy-MM-dd");
    const dayReservations = existingReservations.filter(
      (reservation) =>
        format(new Date(reservation.startDate), "yyyy-MM-dd") === dateString
    );

    // If no reservations, the date is fully available
    if (dayReservations.length === 0) return true;

    // Check if there are any available time slots
    const availableSlots = getAvailableTimeSlots(date);
    return availableSlots.length > 0;
  };

  const getAvailableTimeSlots = (date: Date) => {
    if (!selectedRoom) return [];

    const dateString = format(date, "yyyy-MM-dd");
    const dayReservations = existingReservations.filter(
      (reservation) =>
        format(new Date(reservation.startDate), "yyyy-MM-dd") === dateString
    );

    // Start with all time slots
    let availableSlots = [...TIME_SLOTS];

    // Remove slots that conflict with existing reservations
    dayReservations.forEach((reservation) => {
      const reservationStart = reservation.startTime;
      const reservationDuration = reservation.duration || 1;

      // Calculate end time
      const [startHours, startMinutes] = reservationStart
        .split(":")
        .map(Number);
      const endHours = (startHours + reservationDuration) % 24;
      const endTime = `${endHours.toString().padStart(2, "0")}:${startMinutes
        .toString()
        .padStart(2, "0")}`;

      // Remove conflicting slots
      availableSlots = availableSlots.filter((slot) => {
        const slotTime = slot;
        return !(slotTime >= reservationStart && slotTime < endTime);
      });
    });

    return availableSlots;
  };

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoom(roomId);
    setCurrentStep("calendar");
  };

  const handleDateSelect = (date: Date) => {
    if (isDateAvailable(date)) {
      setSelectedDate(date);
      setCurrentStep("time");
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleNext = () => {
    if (currentStep === "space" && selectedRoom) {
      setCurrentStep("calendar");
    } else if (currentStep === "time" && selectedTime) {
      setCurrentStep("details");
    } else if (currentStep === "details") {
      setCurrentStep("confirmation");
    }
  };

  const handleBack = () => {
    if (currentStep === "calendar") {
      setCurrentStep("space");
    } else if (currentStep === "time") {
      setCurrentStep("calendar");
    } else if (currentStep === "details") {
      setCurrentStep("time");
    } else if (currentStep === "confirmation") {
      setCurrentStep("details");
    }
  };

  const handleSubmit = async () => {
    if (
      !selectedDate ||
      !selectedTime ||
      !selectedRoom ||
      !formData.guestName
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsLoading(true);
    try {
      const startDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":").map(Number);
      startDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + selectedDuration);

      const url = reservation
        ? `/api/reservations/${reservation.id}`
        : "/api/reservations";

      const method = reservation ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: selectedRoom,
          guestName: formData.guestName,
          guestEmail: formData.guestEmail || undefined,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          startTime: selectedTime,
          duration: selectedDuration,
          status: "PENDING",
          notes: formData.notes || undefined,
        }),
      });

      if (response.ok) {
        toast.success(
          reservation
            ? "Réservation mise à jour avec succès !"
            : "Réservation créée avec succès !"
        );
        onSave();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRoomData = rooms.find((r) => r.id === selectedRoom);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {reservation ? "Modifier la réservation" : "Nouvelle réservation"}
          </DialogTitle>

          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-8 pt-4">
            {[
              { key: "space", label: "Espace", icon: User },
              { key: "calendar", label: "Date", icon: Calendar },
              { key: "time", label: "Horaire", icon: Clock },
              { key: "details", label: "Détails", icon: FileText },
              { key: "confirmation", label: "Confirmation", icon: CheckCircle },
            ].map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.key;
              const isCompleted =
                (step.key === "space" && currentStep !== "space") ||
                (step.key === "calendar" &&
                  ["time", "details", "confirmation"].includes(currentStep)) ||
                (step.key === "time" &&
                  ["details", "confirmation"].includes(currentStep)) ||
                (step.key === "details" && currentStep === "confirmation");

              return (
                <div key={step.key} className="flex items-center space-x-2">
                  <div
                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${isActive ? "bg-blue-600 text-white" : ""}
                    ${isCompleted ? "bg-green-600 text-white" : ""}
                    ${
                      !isActive && !isCompleted
                        ? "bg-gray-200 text-gray-500"
                        : ""
                    }
                  `}
                  >
                    {isCompleted ? "✓" : <Icon className="h-4 w-4" />}
                  </div>
                  <span
                    className={`
                    text-sm font-medium transition-colors
                    ${isActive ? "text-blue-600" : ""}
                    ${isCompleted ? "text-green-600" : ""}
                    ${!isActive && !isCompleted ? "text-gray-500" : ""}
                  `}
                  >
                    {step.label}
                  </span>
                  {index < 4 && (
                    <div
                      className={`
                      w-8 h-1 rounded-full transition-colors
                      ${isCompleted ? "bg-green-600" : "bg-gray-200"}
                    `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        <div className="flex gap-8 h-[600px]">
          {/* Left Side - Calendar */}
          <div className="w-80 flex-shrink-0">
            {currentStep === "space" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Choisissez un espace
                </h3>
                <Select value={selectedRoom} onValueChange={handleRoomSelect}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner un espace" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.propertyName} - {room.name} (
                        {formatCurrency(room.pricePerNight, currency)}/nuit)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {currentStep === "calendar" && selectedRoom && (
              <div className="space-y-4">
                {/* Month Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth("prev")}
                    className="p-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {format(currentMonth, "MMMM yyyy", { locale: fr })}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMonth("next")}
                    className="p-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-sm font-medium text-gray-500 py-2"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {getCalendarDays().map((date, index) => {
                    const isCurrentMonth = isSameMonth(date, currentMonth);
                    const isAvailable = isDateAvailable(date);
                    const isSelected =
                      selectedDate && isSameDay(date, selectedDate);
                    const isTodayDate = isToday(date);

                    return (
                      <button
                        key={index}
                        onClick={() => handleDateSelect(date)}
                        disabled={!isAvailable}
                        className={`
                          h-10 w-10 rounded-full text-sm font-medium transition-all
                          ${!isCurrentMonth ? "text-gray-300" : ""}
                          ${
                            !isAvailable
                              ? "text-gray-300 cursor-not-allowed"
                              : ""
                          }
                          ${
                            isAvailable && !isSelected
                              ? "hover:bg-blue-50 text-gray-700"
                              : ""
                          }
                          ${isSelected ? "bg-blue-600 text-white" : ""}
                          ${
                            isAvailable && !isSelected
                              ? "ring-2 ring-blue-200"
                              : ""
                          }
                          ${isTodayDate ? "ring-2 ring-blue-400" : ""}
                        `}
                      >
                        {format(date, "d")}
                      </button>
                    );
                  })}
                </div>

                {/* Timezone */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Globe className="h-4 w-4" />
                    <span>Fuseau horaire: Europe/Paris</span>
                  </div>
                </div>
              </div>
            )}

            {/* Back Button for other steps */}
            {currentStep !== "space" && (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="w-full justify-start"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            )}
          </div>

          {/* Right Side - Content */}
          <div className="flex-1 min-w-0">
            {currentStep === "time" && selectedDate && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">
                    {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
                  </span>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Choisissez un créneau
                  </h3>

                  {getAvailableTimeSlots(selectedDate).length > 0 ? (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        {getAvailableTimeSlots(selectedDate).map((time) => (
                          <button
                            key={time}
                            onClick={() => handleTimeSelect(time)}
                            className={`
                              px-4 py-3 rounded-lg text-sm font-medium transition-all
                              ${
                                selectedTime === time
                                  ? "bg-gray-800 text-white"
                                  : "bg-white border border-blue-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                              }
                            `}
                          >
                            {time}
                          </button>
                        ))}
                      </div>

                      {selectedTime && (
                        <div className="pt-4 border-t border-gray-200">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">
                                Durée de la réservation
                              </Label>
                              <div className="grid grid-cols-4 gap-2 mt-2">
                                {DURATION_OPTIONS.slice(0, 4).map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() =>
                                      setSelectedDuration(option.value)
                                    }
                                    className={`
                                      px-3 py-2 rounded-lg text-sm font-medium transition-all
                                      ${
                                        selectedDuration === option.value
                                          ? "bg-blue-600 text-white"
                                          : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                                      }
                                    `}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    Durée: {selectedDuration} heure
                                    {selectedDuration > 1 ? "s" : ""}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {selectedTime} -{" "}
                                  {(() => {
                                    const [hours, minutes] = selectedTime
                                      .split(":")
                                      .map(Number);
                                    const endTime = new Date();
                                    endTime.setHours(
                                      hours + selectedDuration,
                                      minutes,
                                      0,
                                      0
                                    );
                                    return format(endTime, "HH:mm");
                                  })()}
                                </div>
                              </div>
                              <Button
                                onClick={handleNext}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Suivant
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="h-8 w-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        Aucun créneau disponible
                      </h4>
                      <p className="text-gray-600 mb-4">
                        Cette date n&apos;a plus de créneaux disponibles.
                        Veuillez sélectionner une autre date.
                      </p>
                      <Button
                        onClick={() => setCurrentStep("calendar")}
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Choisir une autre date
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === "details" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Détails de la réservation
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedDate &&
                      format(selectedDate, "EEEE d MMMM yyyy", {
                        locale: fr,
                      })}{" "}
                    à {selectedTime}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="room"
                      className="text-sm font-medium text-gray-700"
                    >
                      Espace *
                    </Label>
                    <Select
                      value={selectedRoom}
                      onValueChange={handleRoomSelect}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner un espace" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.propertyName} - {room.name} (
                            {formatCurrency(room.pricePerNight, currency)}/nuit)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="guestName"
                        className="text-sm font-medium text-gray-700"
                      >
                        Nom du client *
                      </Label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="guestName"
                          value={formData.guestName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              guestName: e.target.value,
                            }))
                          }
                          placeholder="Nom complet"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label
                        htmlFor="guestEmail"
                        className="text-sm font-medium text-gray-700"
                      >
                        Email du client
                      </Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="guestEmail"
                          type="email"
                          value={formData.guestEmail}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              guestEmail: e.target.value,
                            }))
                          }
                          placeholder="email@exemple.com"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="notes"
                      className="text-sm font-medium text-gray-700"
                    >
                      Notes
                    </Label>
                    <div className="relative mt-1">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        placeholder="Notes additionnelles..."
                        className="pl-10"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <Button
                      onClick={handleNext}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Continuer
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === "confirmation" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirmer la réservation
                  </h3>
                  <p className="text-sm text-gray-600">
                    Vérifiez les détails avant de confirmer
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {selectedDate &&
                        format(selectedDate, "EEEE d MMMM yyyy", {
                          locale: fr,
                        })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Heure:</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Durée:</span>
                    <span className="font-medium">
                      {selectedDuration} heure{selectedDuration > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Espace:</span>
                    <span className="font-medium">
                      {selectedRoomData?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client:</span>
                    <span className="font-medium">{formData.guestName}</span>
                  </div>
                  {formData.guestEmail && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{formData.guestEmail}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? "Création..." : "Confirmer la réservation"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
