"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  organisationId: string;
  organisationName: string;
}

export function InviteUserModal({
  isOpen,
  onClose,
  organisationId,
  organisationName,
}: InviteUserModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MANAGER" | "VIEWER">("VIEWER");
  const router = useRouter();
  const queryClient = useQueryClient();

  const inviteUserMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      role: string;
      organisationId: string;
    }) => {
      const response = await fetch("/api/organisations/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to invite user");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Invitation envoyée avec succès");
      queryClient.invalidateQueries();
      router.refresh();
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("L&apos;adresse email est requise");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }
    inviteUserMutation.mutate({
      email: email.trim(),
      role,
      organisationId,
    });
  };

  const handleClose = () => {
    setEmail("");
    setRole("VIEWER");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-main" />
            <span>Inviter un membre</span>
          </DialogTitle>
          <DialogDescription>
            Invitez un nouveau membre à rejoindre{" "}
            <strong>{organisationName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adresse email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="exemple@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={inviteUserMutation.isPending}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle *</Label>
            <Select
              value={role}
              onValueChange={(value: "ADMIN" | "MANAGER" | "VIEWER") =>
                setRole(value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEWER">
                  <div className="flex flex-col items-start">
                    <div className="font-medium">Observateur</div>
                    <div className="text-xs text-gray-500">
                      Peut voir les données uniquement
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="MANAGER">
                  <div className="flex flex-col items-start">
                    <div className="font-medium">Gestionnaire</div>
                    <div className="text-xs text-gray-500">
                      Peut gérer les propriétés et réservations
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="ADMIN">
                  <div className="flex flex-col items-start">
                    <div className="font-medium">Administrateur</div>
                    <div className="text-xs text-gray-500">
                      Accès complet sauf suppression de l&apos;organisation
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={inviteUserMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-main hover:bg-main-dark"
              disabled={inviteUserMutation.isPending || !email.trim()}
            >
              {inviteUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Envoyer l&apos;invitation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
