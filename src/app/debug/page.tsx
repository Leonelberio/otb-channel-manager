"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function DebugPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const resetOnboarding = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/reset-onboarding", {
        method: "POST",
      });

      if (response.ok) {
        alert("Onboarding réinitialisé ! Redirection vers l'onboarding...");
        router.push("/onboarding");
      } else {
        alert("Erreur lors de la réinitialisation");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la réinitialisation");
    } finally {
      setIsLoading(false);
    }
  };

  const testOnboardingAPI = async () => {
    setIsLoading(true);
    try {
      const testData = {
        organizationName: "Mon Test Hotel",
        preferredLanguage: "fr",
        establishmentType: "hotel",
        propertyName: "Propriété Test",
        propertyAddress: "123 Rue de Test, Paris",
        propertyType: "hotel",
        unitName: "Chambre Test",
        capacity: 2,
        pricePerNight: 120,
      };

      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          "Test réussi ! Propriété et chambre créées. Redirection vers le dashboard..."
        );
        router.push("/dashboard");
      } else {
        alert(`Erreur API: ${result.error}`);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors du test");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Debug Onboarding
        </h1>

        <div className="space-y-4">
          <Button
            onClick={resetOnboarding}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "..." : "Réinitialiser l'onboarding"}
          </Button>

          <Button
            onClick={testOnboardingAPI}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "..." : "Tester l'API d'onboarding"}
          </Button>

          <Button
            onClick={() => router.push("/dashboard")}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            Aller au Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
