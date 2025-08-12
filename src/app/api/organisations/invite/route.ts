import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { email, role, organisationId } = await request.json();

    if (!email?.trim() || !role || !organisationId) {
      return NextResponse.json(
        { error: "Email, rôle et ID de l'organisation sont requis" },
        { status: 400 }
      );
    }

    if (!["ADMIN", "MANAGER", "VIEWER"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    // Verify that the current user is the owner of this organization
    const organisation = await prisma.organisation.findUnique({
      where: { id: organisationId },
    });

    if (!organisation || organisation.ownerId !== session.user.id) {
      return NextResponse.json(
        {
          error:
            "Vous n'avez pas l'autorisation d'inviter des membres dans cette organisation",
        },
        { status: 403 }
      );
    }

    // Check if the user being invited exists
    const invitedUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!invitedUser) {
      return NextResponse.json(
        { error: "Aucun utilisateur trouvé avec cette adresse email" },
        { status: 404 }
      );
    }

    // Check if the user is already a member of this organization
    const existingMembership = await prisma.userOrganisation.findFirst({
      where: {
        userId: invitedUser.id,
        organisationId: organisationId,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Cet utilisateur est déjà membre de cette organisation" },
        { status: 400 }
      );
    }

    // Add the user to the organization
    const userOrganisation = await prisma.userOrganisation.create({
      data: {
        userId: invitedUser.id,
        organisationId: organisationId,
        role: role as "ADMIN" | "MANAGER" | "VIEWER",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organisation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      membership: userOrganisation,
    });
  } catch (error) {
    console.error("Error inviting user:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'invitation de l'utilisateur" },
      { status: 500 }
    );
  }
}
