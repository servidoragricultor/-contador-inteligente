CREATE TABLE "ClientInvitation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientInvitation_tokenHash_key" ON "ClientInvitation"("tokenHash");
CREATE INDEX "ClientInvitation_companyId_idx" ON "ClientInvitation"("companyId");

ALTER TABLE "ClientInvitation" ADD CONSTRAINT "ClientInvitation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
