import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Vérifier si l'utilisateur a des préférences
  let userPreferences = await prisma.userPreferences.findUnique({
    where: { userId: session.user.id },
  });

  // Si l'utilisateur n'a pas de préférences du tout, créer des préférences par défaut
  if (!userPreferences) {
    // Utiliser une requête SQL brute pour inclure le champ currency
    await prisma.$executeRaw`
      INSERT INTO user_preferences (id, user_id, establishment_type, preferred_language, currency, onboarding_completed)
      VALUES (cuid(), ${session.user.id}, 'hotel', 'fr', 'EUR', false)
    `;

    // Récupérer les préférences créées
    userPreferences = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
    });
  }

  // Rediriger vers l'onboarding seulement si l'utilisateur n'a pas complété l'onboarding
  if (!userPreferences?.onboardingCompleted) {
    redirect("/onboarding");
  }

  // Récupérer les données de l'utilisateur pour la sidebar
  const userOrganisation = await prisma.userOrganisation.findFirst({
    where: { userId: session.user.id },
    include: {
      organisation: true,
    },
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        organisation={userOrganisation?.organisation}
        userPreferences={userPreferences}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
