"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Check, AlertCircle } from "lucide-react";

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  onConnect: () => void;
  onDisconnect?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  available?: boolean; // Nouvelle prop pour indiquer si l'intégration est disponible
}

export function IntegrationCard({
  name,
  description,
  icon,
  status,
  lastSync,
  onConnect,
  onDisconnect,
  onRefresh,
  isLoading = false,
  available = true,
}: IntegrationCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "connected":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 border-green-200"
          >
            <Check className="h-3 w-3 mr-1" />
            Connecté
          </Badge>
        );
      case "error":
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-800 border-red-200"
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Erreur
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-600 border-gray-200"
          >
            Non connecté
          </Badge>
        );
    }
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">{icon}</div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {status === "connected" && lastSync && (
          <p className="text-xs text-gray-500 mb-4">
            Dernière synchronisation : {lastSync}
          </p>
        )}

        <div className="flex space-x-2">
          {status === "connected" ? (
            <>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading}
                >
                  Actualiser
                </Button>
              )}
              {onDisconnect && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDisconnect}
                  disabled={isLoading}
                >
                  Déconnecter
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("#", "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Voir
              </Button>
            </>
          ) : (
            <Button
              onClick={onConnect}
              disabled={isLoading || !available}
              size="sm"
              className={`${
                available
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isLoading
                ? "Connexion..."
                : available
                ? "Connecter"
                : "Bientôt disponible"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
