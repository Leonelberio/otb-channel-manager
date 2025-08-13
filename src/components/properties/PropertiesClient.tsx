"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MapPin,
  Building2,
  Edit,
  Trash2,
  MoreVertical,
  Coffee,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PropertyModal } from "./PropertyModal";
import { DeletePropertyModal } from "./DeletePropertyModal";

interface PropertyData {
  id: string;
  name: string;
  address?: string | null;
  description?: string | null;
  propertyType?: string | null;
  roomCount: number;
}

interface PropertiesClientProps {
  initialProperties: PropertyData[];
}

export function PropertiesClient({ initialProperties }: PropertiesClientProps) {
  const [properties] = useState<PropertyData[]>(initialProperties);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(
    null
  );
  const [currentPropertyType, setCurrentPropertyType] = useState<string>("");

  // Get dynamic terminology based on property type
  const getTerminology = (propertyType: string) => {
    switch (propertyType) {
      case "hotel":
        return {
          unit: "chambres",
          unitSingular: "chambre",
          addButton: "Ajouter une chambre",
          emptyMessage: "Aucune chambre trouvée",
          startMessage: "Commencez par ajouter votre première chambre",
        };
      case "espace":
        return {
          unit: "espaces",
          unitSingular: "espace",
          addButton: "Ajouter un espace",
          emptyMessage: "Aucun espace trouvé",
          startMessage: "Commencez par ajouter votre premier espace",
        };
      default:
        return {
          unit: "unités",
          unitSingular: "unité",
          addButton: "Ajouter une unité",
          emptyMessage: "Aucune unité trouvée",
          startMessage: "Commencez par ajouter votre première unité",
        };
    }
  };

  const terminology = getTerminology(currentPropertyType);

  const handleEditClick = (property: PropertyData) => {
    setSelectedProperty(property);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (property: PropertyData) => {
    setSelectedProperty(property);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedProperty(null);
  };

  const convertToModalProperty = (property: PropertyData) => {
    const converted = {
      id: property.id,
      name: property.name,
      address: property.address || undefined,
      description: property.description || undefined,
      propertyType: property.propertyType || undefined,
    };
    return converted;
  };

  const getPropertyTypeInfo = (propertyType: string | null | undefined) => {
    switch (propertyType) {
      case "hotel":
        return {
          label: "Hôtel",
          icon: Building2,
          variant: "default" as const,
        };
      case "espace":
        return {
          label: "Espace",
          icon: Coffee,
          variant: "secondary" as const,
        };
      default:
        return {
          label: "Non défini",
          icon: Building2,
          variant: "outline" as const,
        };
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-airbnb-charcoal">
            Propriétés
          </h1>
          <p className="text-airbnb-dark-gray mt-2">
            Gérez vos propriétés et leurs {terminology.unit}
          </p>
        </div>
        <Button
          variant="default"
          className="bg-main hover:bg-main-dark"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une propriété
        </Button>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-airbnb-charcoal mb-2">
            {terminology.emptyMessage}
          </h3>
          <p className="text-airbnb-dark-gray mb-6">
            {terminology.startMessage}
          </p>
          <Button
            variant="default"
            className="bg-main hover:bg-main-dark"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {terminology.addButton}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => {
            const propertyTypeInfo = getPropertyTypeInfo(property.propertyType);
            const PropertyTypeIcon = propertyTypeInfo.icon;

            return (
              <div
                key={property.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-airbnb-charcoal">
                        {property.name}
                      </h3>
                      <Badge
                        variant={propertyTypeInfo.variant}
                        className="ml-2"
                      >
                        <PropertyTypeIcon className="h-3 w-3 mr-1" />
                        {propertyTypeInfo.label}
                      </Badge>
                    </div>
                    {property.address && (
                      <div className="flex items-center text-sm text-airbnb-dark-gray mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.address}
                      </div>
                    )}
                    {property.description && (
                      <p className="text-sm text-airbnb-dark-gray mb-2 line-clamp-2">
                        {property.description}
                      </p>
                    )}
                    <div className="text-sm text-airbnb-dark-gray">
                      {property.roomCount} {terminology.unit}
                      {property.roomCount > 1 ? "" : ""}
                    </div>
                  </div>

                  {/* Menu dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEditClick(property)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(property)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <PropertyModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModals}
        mode="create"
        onPropertyTypeChange={setCurrentPropertyType}
      />

      {selectedProperty && (
        <>
          <PropertyModal
            property={convertToModalProperty(selectedProperty)}
            isOpen={isEditModalOpen}
            onClose={handleCloseModals}
            mode="edit"
            onPropertyTypeChange={setCurrentPropertyType}
          />
          <DeletePropertyModal
            property={selectedProperty}
            isOpen={isDeleteModalOpen}
            onClose={handleCloseModals}
          />
        </>
      )}
    </div>
  );
}
