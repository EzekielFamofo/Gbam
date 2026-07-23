import { db } from "@gbam/database/client";
import { startOfToday, startOfThisMonth } from "./time-windows";

export type SpendLimitsData = {
    dailySpendLimit: number | null;
    monthlySpendLimit: number | null;
    dailySpent: number;
    monthlySpent: number;
};

type SpendLimitRow = {
    dailySpendLimit: number | null;
    monthlySpendLimit: number | null;
};

type SpentRow = {
    total: number | bigint | null;
};

/**
 * Single source of truth for "what are this user's limits and how much
 * have they used." Used by:
 * - require-spend-limit.ts (CLI enforcement, blocks new chat requests)
 * - routes/dashboard-limits.ts (web dashboard read/display)
 * Keeping this in one place means the enforcement check and what the
 * dashboard displays can never disagree with each other.
 */
export async function getSpendLimitsData(userId: string): Promise<SpendLimitsData> {
    const [accountRows, dailyRows, monthlyRows] = await Promise.all([
        db.$queryRaw<SpendLimitRow[]>`
            SELECT "dailySpendLimit", "monthlySpendLimit"
            FROM "CreditAccount"
            WHERE "userId" = ${userId}
            LIMIT 1
        `,
        db.$queryRaw<SpentRow[]>`
            SELECT COALESCE(SUM(ABS("creditsDelta")), 0) AS "total"
            FROM "CreditTransaction"
            WHERE "userId" = ${userId}
              AND "type" = ${"usage"}
              AND "createdAt" >= ${startOfToday()}
        `,
        db.$queryRaw<SpentRow[]>`
            SELECT COALESCE(SUM(ABS("creditsDelta")), 0) AS "total"
            FROM "CreditTransaction"
            WHERE "userId" = ${userId}
              AND "type" = ${"usage"}
              AND "createdAt" >= ${startOfThisMonth()}
        `,
    ]);

    const account = accountRows[0] ?? { dailySpendLimit: null, monthlySpendLimit: null };

    return {
        dailySpendLimit: account.dailySpendLimit,
        monthlySpendLimit: account.monthlySpendLimit,
        dailySpent: Number(dailyRows[0]?.total ?? 0),
        monthlySpent: Number(monthlyRows[0]?.total ?? 0),
    };
}

export type UpdateSpendLimitsInput = {
    dailySpendLimit: number | null;
    monthlySpendLimit: number | null;
};

export async function updateSpendLimitsData(
    userId: string,
    input: UpdateSpendLimitsInput,
): Promise<void> {
    // Assumes a CreditAccount row already exists for this user (created
    // during signup/first credits sync, same assumption
    // getAvailableCreditsBalance/syncProviderCreditsBalance already rely
    // on). Switch to upsert if that's not guaranteed - but that requires
    // knowing CreditAccount's other required columns first.
    await db.creditAccount.update({
        where: { userId },
        data: input,
    });
}