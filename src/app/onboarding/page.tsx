"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OnboardingStep = 1 | 2 | 3;

interface OnboardingData {
  // Étape 1 - Informations de base
  organizationName: string;
  preferredLanguage: string;

  // Étape 2 - Type d'établissement
  establishmentType: "hotel" | "espace";

  // Étape 3 - Première propriété
  propertyName: string;
  propertyAddress: string;
  propertyType: string;
}

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    organizationName: "",
    preferredLanguage: "fr",
    establishmentType: "hotel",
    propertyName: "",
    propertyAddress: "",
    propertyType: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Chargement...</div>;
  }

  function updateData<K extends keyof OnboardingData>(
    field: K,
    value: OnboardingData[K]
  ) {
    setOnboardingData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function nextStep() {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as OnboardingStep);
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as OnboardingStep);
    }
  }

  async function completeOnboarding() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(onboardingData),
      });

      if (response.ok) {
        const result = await response.json();
        // Redirect to the created property page
        if (result.property?.id) {
          router.push(`/dashboard/properties/${result.property.id}`);
        } else {
          router.push("/dashboard");
        }
      } else {
        console.error("Erreur lors de l'onboarding");
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-airbnb-light-gray to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? "bg-main text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-main h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>

          <div className="airbnb-card">
            <div className="p-6">
              <h2 className="text-2xl text-center text-airbnb-charcoal mb-6 font-semibold">
                {currentStep === 1 && "Bienvenue ! Commençons par les bases"}
                {currentStep === 2 && "Quel type d'établissement gérez-vous ?"}
                {currentStep === 3 && "Créez votre première propriété"}
              </h2>
            </div>

            <div className="px-6 pb-6 space-y-6">
              {/* Étape 1 - Informations de base */}
              {currentStep === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
                      Nom de votre organisation
                    </label>
                    <Input
                      value={onboardingData.organizationName}
                      onChange={(e) =>
                        updateData("organizationName", e.target.value)
                      }
                      placeholder="Mon Hôtel ou Ma Résidence"
                      className="airbnb-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
                      Langue préférée
                    </label>
                    <select
                      value={onboardingData.preferredLanguage}
                      onChange={(e) =>
                        updateData("preferredLanguage", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:border-main focus:ring-1 focus:ring-main"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>
                </>
              )}

              {/* Étape 2 - Type d'établissement */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div
                    onClick={() => updateData("establishmentType", "hotel")}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      onboardingData.establishmentType === "hotel"
                        ? "border-main bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">🏨</div>
                      <div>
                        <h3 className="font-semibold text-airbnb-charcoal">
                          Hôtel
                        </h3>
                        <p className="text-sm text-airbnb-dark-gray">
                          Gérez vos chambres d'hôtel, suites et espaces
                          d'hébergement
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => updateData("establishmentType", "espace")}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      onboardingData.establishmentType === "espace"
                        ? "border-main bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">🏢</div>
                      <div>
                        <h3 className="font-semibold text-airbnb-charcoal">
                          Espace
                        </h3>
                        <p className="text-sm text-airbnb-dark-gray">
                          Coworking, coliving, séminaires, résidences et autres
                          espaces
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Étape 3 - Première propriété */}
              {currentStep === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
                      Nom de la propriété
                    </label>
                    <Input
                      value={onboardingData.propertyName}
                      onChange={(e) =>
                        updateData("propertyName", e.target.value)
                      }
                      placeholder="Hôtel du Centre ou Résidence des Pins"
                      className="airbnb-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
                      Adresse complète
                    </label>
                    <Input
                      value={onboardingData.propertyAddress}
                      onChange={(e) =>
                        updateData("propertyAddress", e.target.value)
                      }
                      placeholder="123 rue de la Paix, 75001 Paris"
                      className="airbnb-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-airbnb-charcoal mb-2">
                      Type de propriété
                    </label>
                    <select
                      value={onboardingData.propertyType}
                      onChange={(e) =>
                        updateData("propertyType", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:border-main focus:ring-1 focus:ring-main"
                    >
                      <option value="">Sélectionnez un type</option>
                      {onboardingData.establishmentType === "hotel" ? (
                        <>
                          <option value="hotel-boutique">Hôtel Boutique</option>
                          <option value="hotel-business">
                            Hôtel d'Affaires
                          </option>
                          <option value="hotel-resort">Resort</option>
                          <option value="auberge">Auberge</option>
                        </>
                      ) : (
                        <>
                          <option value="coworking">Espace de Coworking</option>
                          <option value="coliving">Coliving</option>
                          <option value="seminaire">Centre de Séminaire</option>
                          <option value="residence">Résidence</option>
                        </>
                      )}
                    </select>
                  </div>
                </>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Précédent
                </Button>

                {currentStep < 3 ? (
                  <Button
                    variant="main"
                    onClick={nextStep}
                    disabled={
                      (currentStep === 1 && !onboardingData.organizationName) ||
                      (currentStep === 3 &&
                        (!onboardingData.propertyName ||
                          !onboardingData.propertyAddress ||
                          !onboardingData.propertyType))
                    }
                  >
                    Suivant
                  </Button>
                ) : (
                  <Button
                    variant="main"
                    onClick={completeOnboarding}
                    disabled={
                      isLoading ||
                      !onboardingData.propertyName ||
                      !onboardingData.propertyAddress ||
                      !onboardingData.propertyType
                    }
                  >
                    {isLoading
                      ? "Création de votre propriété..."
                      : "Créer ma propriété"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
