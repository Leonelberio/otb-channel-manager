"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppHeader } from "@/components/layout/AppHeader";
import { PropertyModal } from "@/components/properties/PropertyModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Building2,
  MapPin,
  Hotel,
  Building,
  ArrowRight,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface PropertyData {
  id: string;
  name: string;
  address: string | null;
  establishmentType: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rooms: any[];
  propertySettings: {
    currency: string;
  } | null;
}

interface Organisation {
  id: string;
  name: string;
}

interface PropertiesPageClientProps {
  organisation?: Organisation;
  properties: PropertyData[];
}

export function PropertiesPageClient({
  organisation,
  properties,
}: PropertiesPageClientProps) {
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyData | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<PropertyData | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState("");

  const getPropertyIcon = (establishmentType: string) => {
    return establishmentType === "hotel" ? Hotel : Building;
  };

  const handleModalClose = () => {
    setIsPropertyModalOpen(false);
    setEditingProperty(null);
  };

  const handleEditProperty = (property: PropertyData) => {
    setEditingProperty(property);
    setIsPropertyModalOpen(true);
  };

  const handleDeleteClick = (property: PropertyData) => {
    setPropertyToDelete(property);
    setDeleteConfirmationName("");
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!propertyToDelete) return;

    // Verify that the user typed the correct property name
    if (deleteConfirmationName !== propertyToDelete.name) {
      toast.error("Le nom de la propriété ne correspond pas");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/properties/${propertyToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Propriété supprimée avec succès");
        // Refresh the page to update the properties list
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
      setDeleteConfirmationName("");
    }
  };

  const isDeleteEnabled = deleteConfirmationName === propertyToDelete?.name;

  // Pre-warm the properties cache for faster sidebar loading
  useEffect(() => {
    // Fetch properties in the background to populate any caches
    fetch("/api/properties")
      .then((response) => response.json())
      .catch(() => {
        // Silent fail - this is just for optimization
      });
  }, []);

  const headerRightContent = (
    <div className="flex items-center space-x-3">
      <Button
        className="bg-main hover:bg-main-dark"
        onClick={() => setIsPropertyModalOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Nouvelle propriété
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with org switch and user menu */}
      <AppHeader
        currentOrganisation={
          organisation
            ? { id: organisation.id, name: organisation.name }
            : undefined
        }
        organizations={
          organisation ? [{ id: organisation.id, name: organisation.name }] : []
        }
        showOrgSwitch={false}
        title="Mes Propriétés"
        subtitle={
          organisation
            ? `${organisation.name} • ${properties.length} propriété${
                properties.length > 1 ? "s" : ""
              }`
            : undefined
        }
        rightContent={headerRightContent}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {properties.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-airbnb-charcoal mb-2">
              Aucune propriété trouvée
            </h2>
            <p className="text-airbnb-dark-gray mb-6 max-w-md mx-auto">
              Commencez par ajouter votre première propriété pour gérer vos
              chambres et réservations.
            </p>
            <Button
              className="bg-main hover:bg-main-dark"
              onClick={() => setIsPropertyModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter ma première propriété
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              const PropertyIcon = getPropertyIcon(property.establishmentType);
              const unitTerminology =
                property.establishmentType === "hotel" ? "chambres" : "espaces";
              const currency = property.propertySettings?.currency || "XOF";

              return (
                <div key={property.id} className="group relative">
                  <Link
                    href={`/dashboard/properties/${property.id}`}
                    className="block"
                  >
                    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group-hover:border-main">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-lg ${
                              property.establishmentType === "hotel"
                                ? "bg-blue-100"
                                : "bg-green-100"
                            }`}
                          >
                            <PropertyIcon
                              className={`h-6 w-6 ${
                                property.establishmentType === "hotel"
                                  ? "text-blue-600"
                                  : "text-green-600"
                              }`}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-airbnb-charcoal text-lg group-hover:text-main transition-colors">
                              {property.name}
                            </h3>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {property.establishmentType === "hotel"
                                ? "Hôtel"
                                : "Espace"}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-main transition-colors" />
                      </div>

                      {property.address && (
                        <div className="flex items-start text-sm text-airbnb-dark-gray mb-4">
                          <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="break-words">
                            {property.address}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-airbnb-charcoal">
                            {property.rooms.length}
                          </span>
                          <span className="text-airbnb-dark-gray ml-1">
                            {unitTerminology}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-airbnb-charcoal">
                            {currency}
                          </span>
                          <span className="text-airbnb-dark-gray ml-1">
                            devise
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-airbnb-dark-gray">
                            Gérer cette propriété
                          </span>
                          <ArrowRight className="h-4 w-4 text-main opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Actions Dropdown */}
                  <div className="absolute top-4 right-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 bg-white shadow-md hover:bg-gray-50"
                          onClick={(e) => e.preventDefault()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            handleEditProperty(property);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteClick(property);
                          }}
                          className="text-red-600 focus:text-red-600"
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
      </div>

      {/* Property Creation/Edit Modal */}
      <PropertyModal
        property={
          editingProperty
            ? {
                id: editingProperty.id,
                name: editingProperty.name,
                address: editingProperty.address || "",
                description: "",
                propertyType: "",
              }
            : {
                name: "",
                address: "",
                description: "",
                propertyType: "",
              }
        }
        isOpen={isPropertyModalOpen}
        onClose={handleModalClose}
        mode={editingProperty ? "edit" : "create"}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la propriété &quot;
              {propertyToDelete?.name}&quot; ? Cette action est irréversible.
              Toutes les chambres et réservations associées seront également
              supprimées.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirmationName">
                Pour confirmer, tapez le nom de la propriété :{" "}
                <strong>{propertyToDelete?.name}</strong>
              </Label>
              <Input
                id="confirmationName"
                value={deleteConfirmationName}
                onChange={(e) => setDeleteConfirmationName(e.target.value)}
                placeholder="Tapez le nom de la propriété"
                disabled={isDeleting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting || !isDeleteEnabled}
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
