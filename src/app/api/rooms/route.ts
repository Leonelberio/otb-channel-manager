import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'organisation de l'utilisateur
    const userOrganisation = await prisma.userOrganisation.findFirst({
      where: { userId: session.user.id },
      include: {
        organisation: {
          include: {
            properties: {
              include: {
                rooms: {
                  include: {
                    equipments: true,
                    reservations: {
                      where: {
                        status: {
                          in: ["CONFIRMED", "PENDING"],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userOrganisation) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    // Récupérer les espaces avec SQL brut pour inclure pricingType
    const roomsResult = await prisma.$queryRaw<
      Array<{
        id: string;
        propertyId: string;
        name: string;
        roomNumber: string | null;
        roomType: string | null;
        description: string | null;
        capacity: number | null;
        pricePerNight: string | null;
        pricingType: string | null;
        images: string[];
        createdAt: string;
        updatedAt: string;
        propertyName: string;
        equipmentCount: number;
        reservationCount: number;
      }>
    >`
      SELECT 
        r.id,
        r.property_id as "propertyId",
        r.name,
        r.room_number as "roomNumber",
        r.room_type as "roomType",
        r.description,
        r.capacity,
        r.price_per_night as "pricePerNight",
        r.pricing_type as "pricingType",
        r.images,
        r.created_at::text as "createdAt",
        r.updated_at::text as "updatedAt",
        p.name as "propertyName",
        COALESCE(eq.equipment_count, 0) as "equipmentCount",
        COALESCE(res.reservation_count, 0) as "reservationCount"
      FROM rooms r
      JOIN properties p ON r.property_id = p.id
      LEFT JOIN (
        SELECT room_id, COUNT(*) as equipment_count
        FROM equipments
        GROUP BY room_id
      ) eq ON r.id = eq.room_id
      LEFT JOIN (
        SELECT room_id, COUNT(*) as reservation_count
        FROM reservations
        WHERE status IN ('CONFIRMED', 'PENDING')
        GROUP BY room_id
      ) res ON r.id = res.room_id
      WHERE p.organisation_id = ${userOrganisation.organisationId}
      ORDER BY r.created_at DESC
    `;

    const rooms = roomsResult.map((room) => ({
      ...room,
      pricePerNight: room.pricePerNight ? Number(room.pricePerNight) : null,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    }));

    // Debug: identifier les BigInt
    console.log("🔍 Debugging rooms data types:");
    if (roomsResult[0]) {
      console.log("First room sample:", {
        capacity: typeof roomsResult[0].capacity,
        equipmentCount: typeof roomsResult[0].equipmentCount,
        reservationCount: typeof roomsResult[0].reservationCount,
      });
    }

    // Convertir tous les BigInt potentiels en Number
    const cleanRooms = rooms.map((room) => ({
      ...room,
      capacity:
        typeof room.capacity === "bigint"
          ? Number(room.capacity)
          : room.capacity,
      equipmentCount:
        typeof room.equipmentCount === "bigint"
          ? Number(room.equipmentCount)
          : room.equipmentCount,
      reservationCount:
        typeof room.reservationCount === "bigint"
          ? Number(room.reservationCount)
          : room.reservationCount,
    }));

    // Récupérer la devise via SQL brut
    const userPreferencesResult = await prisma.$queryRaw<
      Array<{ currency: string }>
    >`
      SELECT currency FROM user_preferences WHERE user_id = ${session.user.id}
    `;

    const currency = userPreferencesResult[0]?.currency || "EUR";

    return NextResponse.json({ rooms: cleanRooms, currency });
  } catch (error) {
    console.error("Erreur lors de la récupération des chambres:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      capacity,
      pricePerNight,
      pricingType,
      description,
      propertyId,
    } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Le nom de la chambre/espace est requis" },
        { status: 400 }
      );
    }

    if (!propertyId) {
      return NextResponse.json(
        { error: "La propriété est requise" },
        { status: 400 }
      );
    }

    // Vérifier que la propriété appartient à l'utilisateur
    const userOrganisation = await prisma.userOrganisation.findFirst({
      where: { userId: session.user.id },
    });

    if (!userOrganisation) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        organisationId: userOrganisation.organisationId,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Propriété introuvable" },
        { status: 404 }
      );
    }

    // Créer la chambre/espace avec SQL brut pour inclure pricingType
    const roomId = `room_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    await prisma.$executeRaw`
      INSERT INTO rooms (
        id, name, capacity, price_per_night, pricing_type, description, property_id, created_at, updated_at
      ) VALUES (
        ${roomId},
        ${name.trim()},
        ${capacity || null},
        ${pricePerNight || null},
        ${pricingType || null},
        ${description?.trim() || null},
        ${propertyId},
        NOW(),
        NOW()
      )
    `;

    // Récupérer les données créées avec SQL brut
    const createdRoomResult = await prisma.$queryRaw<
      Array<{
        id: string;
        propertyId: string;
        name: string;
        roomNumber: string | null;
        roomType: string | null;
        description: string | null;
        capacity: number | null;
        pricePerNight: string | null;
        pricingType: string | null;
        images: string[];
        createdAt: Date;
        updatedAt: Date;
      }>
    >`
      SELECT 
        id,
        property_id as "propertyId",
        name,
        room_number as "roomNumber",
        room_type as "roomType",
        description,
        capacity,
        price_per_night as "pricePerNight",
        pricing_type as "pricingType",
        images,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM rooms 
      WHERE id = ${roomId}
    `;

    const createdRoom = createdRoomResult[0];

    return NextResponse.json({ room: createdRoom }, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la chambre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
