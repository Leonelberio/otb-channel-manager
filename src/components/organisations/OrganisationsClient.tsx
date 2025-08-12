"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Building2,
  Users,
  Home,
  MoreVertical,
  Crown,
  Shield,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateOrganisationModal } from "./CreateOrganisationModal";
import { InviteUserModal } from "./InviteUserModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Organisation {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  role?: string;
  isOwner?: boolean;
  owner?: {
    id: string;
    name: string | null;
    email: string;
  };
  _count?: {
    userOrganisations: number;
    properties: number;
  };
}

interface OrganisationsClientProps {
  initialOrganisations: Organisation[];
  ownedOrganisations: Organisation[];
  currentUserId: string;
}

export function OrganisationsClient({
  initialOrganisations,
  ownedOrganisations,
  currentUserId,
}: OrganisationsClientProps) {
  const [organisations, setOrganisations] = useState(initialOrganisations);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [inviteModalData, setInviteModalData] = useState<{
    isOpen: boolean;
    organisationId?: string;
    organisationName?: string;
  }>({ isOpen: false });

  const router = useRouter();
  const queryClient = useQueryClient();

  const switchOrganisationMutation = useMutation({
    mutationFn: async (organisationId: string) => {
      const response = await fetch("/api/organisations/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organisationId }),
      });
      if (!response.ok) throw new Error("Failed to switch organisation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      router.push("/dashboard");
      router.refresh();
    },
  });

  const deleteOrganisationMutation = useMutation({
    mutationFn: async (organisationId: string) => {
      const response = await fetch(`/api/organisations/${organisationId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete organisation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      router.refresh();
    },
  });

  const leaveOrganisationMutation = useMutation({
    mutationFn: async (organisationId: string) => {
      const response = await fetch(
        `/api/organisations/${organisationId}/leave`,
        {
          method: "POST",
        }
      );
      if (!response.ok) throw new Error("Failed to leave organisation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      router.refresh();
    },
  });

  const getRoleIcon = (role: string, isOwner: boolean) => {
    if (isOwner) return <Crown className="h-4 w-4 text-yellow-500" />;
    switch (role) {
      case "ADMIN":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "MANAGER":
        return <Users className="h-4 w-4 text-green-500" />;
      case "VIEWER":
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string, isOwner: boolean) => {
    if (isOwner) return "Propriétaire";
    switch (role) {
      case "ADMIN":
        return "Administrateur";
      case "MANAGER":
        return "Gestionnaire";
      case "VIEWER":
        return "Observateur";
      default:
        return "Observateur";
    }
  };

  const getRoleBadgeVariant = (role: string, isOwner: boolean) => {
    if (isOwner) return "default";
    switch (role) {
      case "ADMIN":
        return "secondary";
      case "MANAGER":
        return "outline";
      case "VIEWER":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organisations</h1>
          <p className="text-gray-600">
            Gérez vos organisations et invitez des membres à collaborer
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-main hover:bg-main-dark"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle organisation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organisations.map((organisation) => (
          <Card
            key={organisation.id}
            className="group hover:shadow-lg transition-shadow"
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-main to-green-500 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {organisation.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      {getRoleIcon(
                        organisation.role || "",
                        organisation.isOwner || false
                      )}
                      <Badge
                        variant={getRoleBadgeVariant(
                          organisation.role || "",
                          organisation.isOwner || false
                        )}
                      >
                        {getRoleLabel(
                          organisation.role || "",
                          organisation.isOwner || false
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        switchOrganisationMutation.mutate(organisation.id)
                      }
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Accéder
                    </DropdownMenuItem>

                    {organisation.isOwner && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            setInviteModalData({
                              isOpen: true,
                              organisationId: organisation.id,
                              organisationName: organisation.name,
                            })
                          }
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Inviter un membre
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            deleteOrganisationMutation.mutate(organisation.id)
                          }
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </>
                    )}

                    {!organisation.isOwner && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            leaveOrganisationMutation.mutate(organisation.id)
                          }
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Quitter
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {organisation.owner && !organisation.isOwner && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Propriétaire:</span>{" "}
                    {organisation.owner.name || organisation.owner.email}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {organisation._count?.userOrganisations || 0} membre(s)
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Home className="h-4 w-4" />
                    <span>
                      {organisation._count?.properties || 0} propriété(s)
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    switchOrganisationMutation.mutate(organisation.id)
                  }
                  disabled={switchOrganisationMutation.isPending}
                >
                  {switchOrganisationMutation.isPending
                    ? "Connexion..."
                    : "Accéder au tableau de bord"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {organisations.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Aucune organisation
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Commencez par créer une nouvelle organisation.
          </p>
          <div className="mt-6">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-main hover:bg-main-dark"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer une organisation
            </Button>
          </div>
        </div>
      )}

      <CreateOrganisationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <InviteUserModal
        isOpen={inviteModalData.isOpen}
        onClose={() => setInviteModalData({ isOpen: false })}
        organisationId={inviteModalData.organisationId || ""}
        organisationName={inviteModalData.organisationName || ""}
      />
    </div>
  );
}
