import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { type Currency } from "@/lib/currency";

interface UserPreferences {
  id: string;
  userId: string;
  establishmentType: string;
  preferredLanguage: string;
  currency: Currency;
  onboardingCompleted: boolean;
}

export function useUserPreferences() {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      try {
        const response = await fetch("/api/user-preferences");
        if (response.ok) {
          const data = await response.json();
          setPreferences(data.preferences);
        } else {
          setError("Impossible de récupérer les préférences");
        }
      } catch (err) {
        setError("Erreur lors de la récupération des préférences");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [session?.user?.id]);

  return {
    preferences,
    isLoading,
    error,
    currency: preferences?.currency || "EUR",
    establishmentType: preferences?.establishmentType || "hotel",
    preferredLanguage: preferences?.preferredLanguage || "fr",
  };
}
