"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Users,
  Euro,
  BedDouble,
  Edit,
  Trash2,
  MoreVertical,
  Wifi,
  Car,
  Coffee,
  Tv,
  Snowflake,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoomModal } from "./RoomModal";
import { DeleteRoomModal } from "./DeleteRoomModal";
import { formatCurrency, type Currency } from "@/lib/currency";
import { PriceDisplay } from "@/components/ui/PriceDisplay";

interface Equipment {
  id: string;
  name: string;
}

interface RoomData {
  id: string;
  name: string;
  capacity?: number | null;
  pricePerNight?: number | null;
  description?: string | null;
  propertyId: string;
  propertyName: string;
  equipmentCount: number;
  reservationCount: number;
  equipments?: Equipment[];
}

interface Property {
  id: string;
  name: string;
}

interface RoomsClientProps {
  initialRooms: RoomData[];
  properties: Property[];
  unitTerminology: string; // "chambres" ou "espaces"
  currency: Currency;
}

export function RoomsClient({
  initialRooms,
  properties,
  unitTerminology,
  currency,
}: RoomsClientProps) {
  const [rooms] = useState<RoomData[]>(initialRooms);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);

  const handleEditClick = (room: RoomData) => {
    setSelectedRoom(room);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (room: RoomData) => {
    setSelectedRoom(room);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedRoom(null);
  };

  const convertToModalRoom = (room: RoomData) => ({
    id: room.id,
    name: room.name,
    capacity: room.capacity,
    pricePerNight: room.pricePerNight,
    description: room.description,
    propertyId: room.propertyId,
  });

  const convertToDeleteRoom = (room: RoomData) => ({
    id: room.id,
    name: room.name,
    propertyName: room.propertyName,
    equipmentCount: room.equipmentCount,
    reservationCount: room.reservationCount,
  });

  const getEquipmentIcon = (equipmentName: string) => {
    const name = equipmentName.toLowerCase();
    if (name.includes("wifi") || name.includes("internet"))
      return <Wifi className="h-4 w-4" />;
    if (name.includes("parking") || name.includes("garage"))
      return <Car className="h-4 w-4" />;
    if (
      name.includes("café") ||
      name.includes("coffee") ||
      name.includes("cuisine")
    )
      return <Coffee className="h-4 w-4" />;
    if (name.includes("tv") || name.includes("télé"))
      return <Tv className="h-4 w-4" />;
    if (
      name.includes("climatisation") ||
      name.includes("clim") ||
      name.includes("air")
    )
      return <Snowflake className="h-4 w-4" />;
    return <BedDouble className="h-4 w-4" />;
  };

  const unitSingular = unitTerminology === "chambres" ? "chambre" : "espace";
  const unitArticle = unitTerminology === "chambres" ? "une" : "un";

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-airbnb-charcoal">
            {unitTerminology}
          </h1>
          <p className="text-airbnb-dark-gray mt-2">
            Gérez vos {unitTerminology.toLowerCase()} et leurs équipements
          </p>
        </div>
        <Button
          variant="default"
          className="bg-airbnb-red hover:bg-airbnb-dark-red"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter {unitArticle} {unitSingular}
        </Button>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-16">
          <BedDouble className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-airbnb-charcoal mb-2">
            Aucun{unitTerminology === "chambres" ? "e" : ""} {unitSingular}
          </h3>
          <p className="text-airbnb-dark-gray mb-6">
            Commencez par ajouter votre{" "}
            {unitTerminology === "chambres"
              ? "première chambre"
              : "premier espace"}
          </p>
          <Button
            variant="default"
            className="bg-airbnb-red hover:bg-airbnb-dark-red"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter {unitArticle} {unitSingular}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-airbnb-charcoal mb-2">
                    {room.name}
                  </h3>
                  <p className="text-sm text-airbnb-dark-gray mb-2">
                    {room.propertyName}
                  </p>

                  {room.capacity && (
                    <div className="flex items-center text-sm text-airbnb-dark-gray mb-2">
                      <Users className="h-4 w-4 mr-1" />
                      {room.capacity} personne{room.capacity > 1 ? "s" : ""}
                    </div>
                  )}

                  {room.pricePerNight && (
                    <div className="flex items-center text-lg font-semibold text-airbnb-red mb-3">
                      <Euro className="h-4 w-4 mr-1" />
                      <PriceDisplay
                        amount={room.pricePerNight}
                        currency={currency}
                        showPerNight={true}
                      />
                    </div>
                  )}

                  {room.description && (
                    <p className="text-sm text-airbnb-dark-gray mb-2 line-clamp-2">
                      {room.description}
                    </p>
                  )}

                  {/* Équipements */}
                  {room.equipments && room.equipments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-airbnb-charcoal mb-2">
                        Équipements
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {room.equipments.slice(0, 3).map((equipment) => (
                          <div
                            key={equipment.id}
                            className="flex items-center bg-gray-100 rounded-full px-2 py-1 text-xs"
                          >
                            {getEquipmentIcon(equipment.name)}
                            <span className="ml-1">{equipment.name}</span>
                          </div>
                        ))}
                        {room.equipments.length > 3 && (
                          <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 text-xs">
                            +{room.equipments.length - 3} autres
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Statut */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        room.reservationCount > 0
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {room.reservationCount > 0 ? "Occupé" : "Disponible"}
                    </span>
                    {room.reservationCount > 0 && (
                      <span className="text-xs text-airbnb-dark-gray">
                        {room.reservationCount} réservation
                        {room.reservationCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Menu dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditClick(room)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(room)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Planning
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditClick(room)}
                >
                  Modifier
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <RoomModal
        properties={properties}
        isOpen={isCreateModalOpen}
        onClose={handleCloseModals}
        mode="create"
        unitTerminology={unitTerminology}
        currency={currency}
      />

      {selectedRoom && (
        <>
          <RoomModal
            room={convertToModalRoom(selectedRoom)}
            properties={properties}
            isOpen={isEditModalOpen}
            onClose={handleCloseModals}
            mode="edit"
            unitTerminology={unitTerminology}
            currency={currency}
          />

          <DeleteRoomModal
            room={convertToDeleteRoom(selectedRoom)}
            isOpen={isDeleteModalOpen}
            onClose={handleCloseModals}
            unitTerminology={unitTerminology}
          />
        </>
      )}
    </div>
  );
}
