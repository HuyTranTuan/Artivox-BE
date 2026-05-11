/*
  Warnings:

  - The values [ADMIN] on the enum `ChatMessageSender` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isActive` on the `admin_users` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `customers` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ChatMessageSender_new" AS ENUM ('STAFF', 'CUSTOMER');
ALTER TABLE "chat_messages" ALTER COLUMN "senderType" TYPE "ChatMessageSender_new" USING ("senderType"::text::"ChatMessageSender_new");
ALTER TYPE "ChatMessageSender" RENAME TO "ChatMessageSender_old";
ALTER TYPE "ChatMessageSender_new" RENAME TO "ChatMessageSender";
DROP TYPE "public"."ChatMessageSender_old";
COMMIT;

-- AlterTable
ALTER TABLE "admin_users" DROP COLUMN "isActive",
ADD COLUMN     "permission" TEXT NOT NULL DEFAULT '{create:false,update:false,del:false}';

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "isActive",
ADD COLUMN     "verifiedAt" TIMESTAMP(3);
