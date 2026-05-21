-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "assignedAdminId" BIGINT;

-- CreateIndex
CREATE INDEX "orders_assignedAdminId_idx" ON "orders"("assignedAdminId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
