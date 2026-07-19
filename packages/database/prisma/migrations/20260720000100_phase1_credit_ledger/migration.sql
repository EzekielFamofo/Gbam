CREATE TYPE "CreditTransactionType" AS ENUM ('usage', 'purchase', 'adjustment', 'sync');
CREATE TYPE "BillingProvider" AS ENUM ('polar', 'paystack', 'internal');

ALTER TABLE "Session"
ADD COLUMN "lastMode" TEXT,
ADD COLUMN "lastModel" TEXT,
ADD COLUMN "lastActivityAt" TIMESTAMP(3),
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'new',
ADD COLUMN "creditsUsed" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Session_lastActivityAt_idx" ON "Session"("lastActivityAt");

CREATE TABLE "CreditAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "balanceCredits" INTEGER NOT NULL DEFAULT 0,
  "providerBalanceCredits" INTEGER,
  "balanceSource" TEXT,
  "lastReconciledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreditAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreditAccount_userId_key" ON "CreditAccount"("userId");
CREATE INDEX "CreditAccount_updatedAt_idx" ON "CreditAccount"("updatedAt");

CREATE TABLE "CreditTransaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "CreditTransactionType" NOT NULL,
  "creditsDelta" INTEGER NOT NULL,
  "balanceAfter" INTEGER,
  "sessionId" TEXT,
  "messageId" TEXT,
  "provider" "BillingProvider" NOT NULL DEFAULT 'polar',
  "providerReference" TEXT,
  "ledgerKey" TEXT NOT NULL,
  "description" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreditTransaction_ledgerKey_key" ON "CreditTransaction"("ledgerKey");
CREATE INDEX "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction"("userId", "createdAt");
CREATE INDEX "CreditTransaction_sessionId_idx" ON "CreditTransaction"("sessionId");
