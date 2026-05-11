/*
  Warnings:

  - You are about to drop the `users_dashboard` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "users_dashboard" DROP CONSTRAINT "users_dashboard_adminUserID_fkey";

-- DropTable
DROP TABLE "users_dashboard";

-- CreateTable
CREATE TABLE "admin_users_dashboard" (
    "id" BIGSERIAL NOT NULL,
    "adminUserID" BIGINT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP,

    CONSTRAINT "admin_users_dashboard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_dashboard_adminUserID_key" ON "admin_users_dashboard"("adminUserID");

-- CreateIndex
CREATE INDEX "admin_users_dashboard_createdAt_idx" ON "admin_users_dashboard"("createdAt");

-- AddForeignKey
ALTER TABLE "admin_users_dashboard" ADD CONSTRAINT "admin_users_dashboard_adminUserID_fkey" FOREIGN KEY ("adminUserID") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
