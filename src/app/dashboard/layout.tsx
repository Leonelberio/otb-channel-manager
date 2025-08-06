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

  // Vérifier si l'onboarding est complété
  const userPreferences = await prisma.userPreferences.findUnique({
    where: { userId: session.user.id },
  });

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
