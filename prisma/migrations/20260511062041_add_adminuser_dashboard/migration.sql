-- CreateTable
CREATE TABLE "users_dashboard" (
    "id" BIGSERIAL NOT NULL,
    "adminUserID" BIGINT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP,

    CONSTRAINT "users_dashboard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_dashboard_adminUserID_key" ON "users_dashboard"("adminUserID");

-- CreateIndex
CREATE INDEX "users_dashboard_createdAt_idx" ON "users_dashboard"("createdAt");

-- AddForeignKey
ALTER TABLE "users_dashboard" ADD CONSTRAINT "users_dashboard_adminUserID_fkey" FOREIGN KEY ("adminUserID") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
