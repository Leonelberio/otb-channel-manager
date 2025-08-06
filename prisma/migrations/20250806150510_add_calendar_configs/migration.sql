-- CreateTable
CREATE TABLE "public"."calendar_configs" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "calendar_id" TEXT NOT NULL,
    "calendar_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calendar_configs_integration_id_room_id_key" ON "public"."calendar_configs"("integration_id", "room_id");

-- AddForeignKey
ALTER TABLE "public"."calendar_configs" ADD CONSTRAINT "calendar_configs_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."calendar_configs" ADD CONSTRAINT "calendar_configs_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
