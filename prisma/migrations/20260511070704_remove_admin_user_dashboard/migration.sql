/*
  Warnings:

  - You are about to drop the `admin_users_dashboard` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "admin_users_dashboard" DROP CONSTRAINT "admin_users_dashboard_adminUserID_fkey";

-- DropTable
DROP TABLE "admin_users_dashboard";
