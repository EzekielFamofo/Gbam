-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('usage', 'purchase', 'adjustment', 'sync');

-- CreateEnum
CREATE TYPE "BillingProvider" AS ENUM ('polar', 'paystack', 'internal');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "lastMode" TEXT,
    "lastModel" TEXT,
    "lastActivityAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'new',
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "agentsMdHash" TEXT,
    "projectPath" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balanceCredits" INTEGER NOT NULL DEFAULT 0,
    "providerBalanceCredits" INTEGER,
    "balanceSource" TEXT,
    "lastReconciledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dailySpendLimit" INTEGER,
    "monthlySpendLimit" INTEGER,

    CONSTRAINT "CreditAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "TokenLog" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "reasoningTokens" INTEGER NOT NULL DEFAULT 0,
    "cachedTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_lastActivityAt_idx" ON "Session"("lastActivityAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreditAccount_userId_key" ON "CreditAccount"("userId");

-- CreateIndex
CREATE INDEX "CreditAccount_updatedAt_idx" ON "CreditAccount"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreditTransaction_ledgerKey_key" ON "CreditTransaction"("ledgerKey");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CreditTransaction_sessionId_idx" ON "CreditTransaction"("sessionId");

-- CreateIndex
CREATE INDEX "TokenLog_provider_idx" ON "TokenLog"("provider");

-- CreateIndex
CREATE INDEX "TokenLog_createdAt_idx" ON "TokenLog"("createdAt");
