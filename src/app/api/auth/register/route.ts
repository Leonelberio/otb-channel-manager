import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // Validation basique
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Un compte avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // Hacher le mot de passe
    const hashedPassword = await hash(password, 12);

    // Créer l'utilisateur et son organisation par défaut
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Créer l'organisation par défaut
    const organization = await prisma.organisation.create({
      data: {
        name: `Organisation de ${name}`,
        ownerId: user.id,
      },
    });

    // Ajouter l'utilisateur à son organisation avec le rôle admin
    await prisma.userOrganisation.create({
      data: {
        userId: user.id,
        organisationId: organization.id,
        role: "ADMIN",
      },
    });

    // Créer les préférences utilisateur par défaut
    await prisma.userPreferences.create({
      data: {
        userId: user.id,
        establishmentType: "hotel",
        preferredLanguage: "fr",
        onboardingCompleted: false,
      },
    });

    return NextResponse.json(
      {
        message: "Compte créé avec succès",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
