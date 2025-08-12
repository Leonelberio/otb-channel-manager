"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Package,
  Wifi,
  Car,
  Coffee,
  Tv,
  Snowflake,
  BedDouble,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EquipmentModal } from "./EquipmentModal";
import { DeleteEquipmentModal } from "./DeleteEquipmentModal";

interface EquipmentData {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  roomId: string;
  roomName: string;
  propertyName: string;
}

interface Room {
  id: string;
  name: string;
  propertyName: string;
}

interface EquipmentsClientProps {
  initialEquipments: EquipmentData[];
  rooms: Room[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  car: Car,
  coffee: Coffee,
  tv: Tv,
  snowflake: Snowflake,
  bed: BedDouble,
  package: Package,
};

export function EquipmentsClient({
  initialEquipments,
  rooms,
}: EquipmentsClientProps) {
  const [equipments] = useState<EquipmentData[]>(initialEquipments);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] =
    useState<EquipmentData | null>(null);

  const handleEditClick = (equipment: EquipmentData) => {
    setSelectedEquipment(equipment);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (equipment: EquipmentData) => {
    setSelectedEquipment(equipment);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedEquipment(null);
  };

  const convertToModalEquipment = (equipment: EquipmentData) => ({
    id: equipment.id,
    name: equipment.name,
    description: equipment.description,
    icon: equipment.icon,
    roomId: equipment.roomId,
  });

  const convertToDeleteEquipment = (equipment: EquipmentData) => ({
    id: equipment.id,
    name: equipment.name,
    roomName: equipment.roomName,
    propertyName: equipment.propertyName,
    description: equipment.description,
    icon: equipment.icon,
  });

  const getEquipmentIcon = (iconName?: string | null) => {
    const IconComponent = iconMap[iconName || "package"] || Package;
    return IconComponent;
  };

  // Group equipments by room
  const equipmentsByRoom = equipments.reduce((acc, equipment) => {
    const key = `${equipment.roomName} - ${equipment.propertyName}`;
    if (!acc[key]) {
      acc[key] = {
        roomName: equipment.roomName,
        propertyName: equipment.propertyName,
        equipments: [],
      };
    }
    acc[key].equipments.push(equipment);
    return acc;
  }, {} as Record<string, { roomName: string; propertyName: string; equipments: EquipmentData[] }>);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-airbnb-charcoal">
            Équipements
          </h1>
          <p className="text-airbnb-dark-gray mt-2">
            Gérez les équipements de vos chambres et espaces
          </p>
        </div>
        <Button
          variant="default"
          className="bg-main hover:bg-main-dark"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un équipement
        </Button>
      </div>

      {equipments.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-airbnb-charcoal mb-2">
            Aucun équipement
          </h3>
          <p className="text-airbnb-dark-gray mb-6">
            Commencez par ajouter votre premier équipement
          </p>
          <Button
            variant="default"
            className="bg-main hover:bg-main-dark"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un équipement
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(equipmentsByRoom).map(([roomKey, roomData]) => (
            <div
              key={roomKey}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-airbnb-charcoal">
                    {roomData.roomName}
                  </h3>
                  <p className="text-sm text-airbnb-dark-gray">
                    {roomData.propertyName}
                  </p>
                </div>
                <span className="bg-main text-white text-xs px-2 py-1 rounded-full">
                  {roomData.equipments.length} équipement
                  {roomData.equipments.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {roomData.equipments.map((equipment) => {
                  const IconComponent = getEquipmentIcon(equipment.icon);
                  return (
                    <div
                      key={equipment.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow-sm transition-shadow group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center flex-1">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border mr-3">
                            <IconComponent className="h-4 w-4 text-airbnb-dark-gray" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-airbnb-charcoal text-sm truncate">
                              {equipment.name}
                            </h4>
                          </div>
                        </div>

                        {/* Menu dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditClick(equipment)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(equipment)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {equipment.description && (
                        <p className="text-xs text-airbnb-dark-gray line-clamp-2">
                          {equipment.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <EquipmentModal
        rooms={rooms}
        isOpen={isCreateModalOpen}
        onClose={handleCloseModals}
        mode="create"
      />

      {selectedEquipment && (
        <>
          <EquipmentModal
            equipment={convertToModalEquipment(selectedEquipment)}
            rooms={rooms}
            isOpen={isEditModalOpen}
            onClose={handleCloseModals}
            mode="edit"
          />

          <DeleteEquipmentModal
            equipment={convertToDeleteEquipment(selectedEquipment)}
            isOpen={isDeleteModalOpen}
            onClose={handleCloseModals}
          />
        </>
      )}
    </div>
  );
}
