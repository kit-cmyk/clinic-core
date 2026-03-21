-- CreateTable: audit_logs
-- Immutable compliance log. Records who did what and when.

CREATE TABLE "audit_logs" (
    "id"           TEXT NOT NULL,
    "tenantId"     TEXT,
    "actorId"      TEXT,
    "actorRole"    TEXT,
    "action"       TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId"   TEXT,
    "metadata"     JSONB,
    "ip"           TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_tenantId_idx"   ON "audit_logs"("tenantId");
CREATE INDEX "audit_logs_actorId_idx"    ON "audit_logs"("actorId");
CREATE INDEX "audit_logs_action_idx"     ON "audit_logs"("action");
CREATE INDEX "audit_logs_createdAt_idx"  ON "audit_logs"("createdAt");
