import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Check if we should hide the sidebar (for properties page)
  const headersList = await headers();
  const hideSidebar = headersList.get("x-hide-sidebar") === "true";

  // Vérifier si l'utilisateur a des préférences
  let userPreferences = await prisma.userPreferences.findUnique({
    where: { userId: session.user.id },
  });

  // Si l'utilisateur n'a pas de préférences du tout, créer des préférences par défaut
  if (!userPreferences) {
    // Utiliser une requête SQL brute pour inclure le champ currency
    await prisma.$executeRaw`
      INSERT INTO user_preferences (id, user_id, establishment_type, preferred_language, currency, onboarding_completed)
      VALUES (cuid(), ${session.user.id}, 'hotel', 'fr', 'XOF', false)
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
      organisation: {
        include: {
          properties: {
            include: {
              rooms: true,
            },
          },
        },
      },
    },
  });

  const organisation = userOrganisation?.organisation;
  const properties =
    organisation?.properties.map((property) => ({
      id: property.id,
      name: property.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      establishmentType: (property as any).establishmentType,
      roomCount: property.rooms.length,
    })) || [];

  // Sanitize organisation to plain object with only needed fields for client component
  const organisationForSidebar = organisation
    ? { id: organisation.id, name: organisation.name }
    : undefined;

  console.log("🏗️ Layout rendering sidebar with properties:", properties);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        organisation={organisationForSidebar}
        userPreferences={userPreferences}
        properties={properties}
        hideInitially={hideSidebar}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
