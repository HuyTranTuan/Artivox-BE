/*
  Warnings:

  - You are about to drop the column `recipientId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `recipientType` on the `notifications` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "notifications_recipientId_idx";

-- DropIndex
DROP INDEX "notifications_recipientType_idx";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "recipientId",
DROP COLUMN "recipientType",
ADD COLUMN     "adminId" BIGINT,
ADD COLUMN     "customerId" BIGINT;

-- CreateIndex
CREATE INDEX "notifications_adminId_idx" ON "notifications"("adminId");

-- CreateIndex
CREATE INDEX "notifications_customerId_idx" ON "notifications"("customerId");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
