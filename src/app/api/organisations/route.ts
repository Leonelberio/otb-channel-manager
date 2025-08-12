import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
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

    const organisations = userOrganisations.map((userOrg) => ({
      ...userOrg.organisation,
      role: userOrg.role,
      isOwner: userOrg.organisation.ownerId === session.user.id,
    }));

    return NextResponse.json({ organisations });
  } catch (error) {
    console.error("Error fetching organisations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des organisations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { name, description } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Le nom de l'organisation est requis" },
        { status: 400 }
      );
    }

    // Check if an organization with this name already exists for this user
    const existingOrg = await prisma.organisation.findFirst({
      where: {
        name: name.trim(),
        ownerId: session.user.id,
      },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: "Une organisation avec ce nom existe déjà" },
        { status: 400 }
      );
    }

    // Create the organization
    const organisation = await prisma.organisation.create({
      data: {
        name: name.trim(),
        ownerId: session.user.id,
      },
      include: {
        _count: {
          select: {
            userOrganisations: true,
            properties: true,
          },
        },
      },
    });

    // Add the owner as a member with ADMIN role
    await prisma.userOrganisation.create({
      data: {
        userId: session.user.id,
        organisationId: organisation.id,
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      organisation: {
        ...organisation,
        role: "ADMIN",
        isOwner: true,
      },
    });
  } catch (error) {
    console.error("Error creating organisation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'organisation" },
      { status: 500 }
    );
  }
}
