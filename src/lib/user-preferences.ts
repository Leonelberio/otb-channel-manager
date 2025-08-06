import { type Currency } from "./currency";

export interface UserPreferences {
  id: string;
  userId: string;
  establishmentType: string;
  preferredLanguage: string;
  currency: Currency;
  onboardingCompleted: boolean;
}

export function getUserPreferencesWithDefaults(
  preferences: any
): UserPreferences {
  return {
    id: preferences?.id || "",
    userId: preferences?.userId || "",
    establishmentType: preferences?.establishmentType || "hotel",
    preferredLanguage: preferences?.preferredLanguage || "fr",
    currency: (preferences?.currency as Currency) || "EUR",
    onboardingCompleted: preferences?.onboardingCompleted || false,
  };
}
