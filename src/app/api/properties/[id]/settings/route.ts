import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Verify property belongs to user's organization
    const property = await prisma.property.findFirst({
      where: {
        id,
        organisation: {
          userOrganisations: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Propriété non trouvée" },
        { status: 404 }
      );
    }

    const data = await request.json();
    const {
      currency,
      timezone,
      language,
      widgetPrimaryColor,
      widgetButtonColor,
      widgetEnabled,
      allowInstantBooking,
      requireApproval,
      maxAdvanceBookingDays,
      minAdvanceBookingHours,
      defaultCheckinTime,
      defaultCheckoutTime,
      emailNotifications,
      smsNotifications,
    } = data;

    // Update or create property settings
    const updatedSettings = await prisma.propertySettings.upsert({
      where: { propertyId: id },
      update: {
        currency,
        timezone,
        language,
        widgetPrimaryColor,
        widgetButtonColor,
        widgetEnabled,
        allowInstantBooking,
        requireApproval,
        maxAdvanceBookingDays,
        minAdvanceBookingHours,
        defaultCheckinTime,
        defaultCheckoutTime,
        emailNotifications,
        smsNotifications,
      },
      create: {
        propertyId: id,
        currency,
        timezone,
        language,
        widgetPrimaryColor,
        widgetButtonColor,
        widgetEnabled,
        allowInstantBooking,
        requireApproval,
        maxAdvanceBookingDays,
        minAdvanceBookingHours,
        defaultCheckinTime,
        defaultCheckoutTime,
        emailNotifications,
        smsNotifications,
      },
    });

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des paramètres:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
