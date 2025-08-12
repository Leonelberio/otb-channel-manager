"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CreateOrganisationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateOrganisationModal({
  isOpen,
  onClose,
}: CreateOrganisationModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();

  const createOrganisationMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await fetch("/api/organisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create organisation");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Organisation créée avec succès");
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
    if (!name.trim()) {
      toast.error("Le nom de l'organisation est requis");
      return;
    }
    createOrganisationMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-main" />
            <span>Créer une nouvelle organisation</span>
          </DialogTitle>
          <DialogDescription>
            Créez une organisation pour gérer vos propriétés et collaborer avec
            votre équipe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l&apos;organisation *</Label>
            <Input
              id="name"
              placeholder="ex. Mon Hôtel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createOrganisationMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Description de votre organisation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createOrganisationMutation.isPending}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createOrganisationMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-main hover:bg-main-dark"
              disabled={createOrganisationMutation.isPending || !name.trim()}
            >
              {createOrganisationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer l'organisation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
