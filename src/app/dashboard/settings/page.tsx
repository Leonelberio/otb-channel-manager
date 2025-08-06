import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  // Récupérer les préférences utilisateur
  const userPreferences = await prisma.userPreferences.findUnique({
    where: { userId: session!.user.id },
  });

  // Récupérer l'organisation de l'utilisateur
  const userOrganisation = await prisma.userOrganisation.findFirst({
    where: { userId: session!.user.id },
    include: {
      organisation: {
        select: { id: true },
      },
    },
  });

  // Créer des préférences par défaut si elles n'existent pas
  const preferences = userPreferences
    ? {
        id: userPreferences.id,
        userId: userPreferences.userId,
        establishmentType: userPreferences.establishmentType,
        preferredLanguage: userPreferences.preferredLanguage,
        currency: userPreferences.currency,
        onboardingCompleted: userPreferences.onboardingCompleted,
        widgetPrimaryColor: userPreferences.widgetPrimaryColor || "#8ABF37",
        widgetButtonColor: userPreferences.widgetButtonColor || "#8ABF37",
      }
    : {
        id: "",
        userId: session!.user.id,
        establishmentType: "hotel",
        preferredLanguage: "fr",
        currency: "EUR",
        onboardingCompleted: false,
        widgetPrimaryColor: "#8ABF37",
        widgetButtonColor: "#8ABF37",
      };

  const organizationId = userOrganisation?.organisation?.id || "";

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-airbnb-charcoal">
            Paramètres
          </h1>
          <p className="text-airbnb-dark-gray mt-2">
            Configurez votre compte, vos préférences et votre widget de
            réservation
          </p>
        </div>
      </div>

      <SettingsForm
        initialPreferences={preferences}
        organizationId={organizationId}
      />
    </div>
  );
}
