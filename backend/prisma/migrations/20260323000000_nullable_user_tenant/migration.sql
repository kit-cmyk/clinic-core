-- Make tenantId nullable on users so SUPER_ADMIN accounts are not
-- scoped to any tenant.  All other roles continue to require a tenantId
-- and the application-level signup / invite flows enforce that.

ALTER TABLE "users" ALTER COLUMN "tenantId" DROP NOT NULL;
