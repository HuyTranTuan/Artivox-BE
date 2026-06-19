/*
  Warnings:

  - A unique constraint covering the columns `[orderNumber]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderNumber` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CommentEntityType" AS ENUM ('PRODUCT', 'ARTICLE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'PAYMENT_CONFIRMED';
ALTER TYPE "OrderStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "OrderStatus" ADD VALUE 'SHIPPED';
ALTER TYPE "OrderStatus" ADD VALUE 'DELIVERED';

-- DropForeignKey
ALTER TABLE "chat_rooms" DROP CONSTRAINT "chat_rooms_adminId_fkey";

-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "avatar" VARCHAR(512) NOT NULL DEFAULT '',
ADD COLUMN     "resetToken" VARCHAR(128),
ADD COLUMN     "resetTokenExpiry" TIMESTAMP;

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "chat_rooms" ALTER COLUMN "adminId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "avatar" VARCHAR(512),
ADD COLUMN     "resetToken" VARCHAR(128),
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveryDate" TEXT,
ADD COLUMN     "deliveryTime" TEXT,
ADD COLUMN     "orderNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ratingCount" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "internal_chat_rooms" (
    "id" BIGSERIAL NOT NULL,
    "participant1Id" BIGINT NOT NULL,
    "participant2Id" BIGINT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_chat_messages" (
    "id" BIGSERIAL NOT NULL,
    "roomId" BIGINT NOT NULL,
    "senderId" BIGINT NOT NULL,
    "content" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileType" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" BIGSERIAL NOT NULL,
    "customerId" BIGINT NOT NULL,
    "entityType" "CommentEntityType" NOT NULL,
    "entityId" BIGINT NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_addresses" (
    "id" BIGSERIAL NOT NULL,
    "customerId" BIGINT NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "fullAddress" VARCHAR(500) NOT NULL,
    "provinceCode" VARCHAR(20) NOT NULL,
    "wardCode" VARCHAR(20),
    "streetDetail" VARCHAR(300) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "internal_chat_rooms_participant1Id_idx" ON "internal_chat_rooms"("participant1Id");

-- CreateIndex
CREATE INDEX "internal_chat_rooms_participant2Id_idx" ON "internal_chat_rooms"("participant2Id");

-- CreateIndex
CREATE UNIQUE INDEX "internal_chat_rooms_participant1Id_participant2Id_key" ON "internal_chat_rooms"("participant1Id", "participant2Id");

-- CreateIndex
CREATE INDEX "internal_chat_messages_roomId_idx" ON "internal_chat_messages"("roomId");

-- CreateIndex
CREATE INDEX "internal_chat_messages_createdAt_idx" ON "internal_chat_messages"("createdAt");

-- CreateIndex
CREATE INDEX "comments_entityType_entityId_idx" ON "comments"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "comments_customerId_idx" ON "comments"("customerId");

-- CreateIndex
CREATE INDEX "comments_createdAt_idx" ON "comments"("createdAt");

-- CreateIndex
CREATE INDEX "shipping_addresses_customerId_idx" ON "shipping_addresses"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_chat_rooms" ADD CONSTRAINT "internal_chat_rooms_participant1Id_fkey" FOREIGN KEY ("participant1Id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_chat_rooms" ADD CONSTRAINT "internal_chat_rooms_participant2Id_fkey" FOREIGN KEY ("participant2Id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_chat_messages" ADD CONSTRAINT "internal_chat_messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "internal_chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_chat_messages" ADD CONSTRAINT "internal_chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_addresses" ADD CONSTRAINT "shipping_addresses_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
