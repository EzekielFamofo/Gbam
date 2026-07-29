-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CreditTransactionType" ADD VALUE 'trial';
ALTER TYPE "CreditTransactionType" ADD VALUE 'expiration';

-- AlterTable
ALTER TABLE "CreditTransaction" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "remainingCredits" INTEGER;
