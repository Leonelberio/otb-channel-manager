import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrganisationsClient } from "@/components/organisations/OrganisationsClient";
import { redirect } from "next/navigation";

export default async function OrganisationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get all organizations where the user is a member
  const userOrganisations = await prisma.userOrganisation.findMany({
    where: { userId: session.user.id },
    include: {
      organisation: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              userOrganisations: true,
              properties: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get organizations owned by the user
  const ownedOrganisations = await prisma.organisation.findMany({
    where: { ownerId: session.user.id },
    include: {
      _count: {
        select: {
          userOrganisations: true,
          properties: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const organisations = userOrganisations.map((userOrg) => ({
    ...userOrg.organisation,
    role: userOrg.role,
    isOwner: userOrg.organisation.ownerId === session.user.id,
  }));

  return (
    <OrganisationsClient
      initialOrganisations={organisations}
      ownedOrganisations={ownedOrganisations}
      currentUserId={session.user.id}
    />
  );
}
