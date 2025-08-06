-- AlterTable
ALTER TABLE "public"."reservations" ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "start_time" TEXT;

-- AddForeignKey
ALTER TABLE "public"."user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
