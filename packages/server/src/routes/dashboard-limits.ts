import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import {
    requireInternalWebAuth,
    type InternalWebAuthEnv,
} from "../middleware/require-internal-web-auth";
import { getSpendLimitsData, updateSpendLimitsData } from "../lib/spend-limits";

const updateSchema = z
    .object({
        dailySpendLimit: z.number().int().nonnegative().nullable(),
        monthlySpendLimit: z.number().int().nonnegative().nullable(),
    })
    .refine(
        (data) =>
            data.dailySpendLimit == null ||
            data.monthlySpendLimit == null ||
            data.dailySpendLimit <= data.monthlySpendLimit,
        { message: "Daily limit can't exceed the monthly limit", path: ["dailySpendLimit"] },
    );

const updateValidator = zValidator("json", updateSchema, (result, c) => {
    if (!result.success) {
        return c.json({ error: "Invalid request body" }, 400);
    }
});

const app = new Hono<InternalWebAuthEnv>()
    .use("*", requireInternalWebAuth)
    .get("/", async (c) => {
        const userId = c.get("userId");
        return c.json(await getSpendLimitsData(userId));
    })
    .patch("/", updateValidator, async (c) => {
        const userId = c.get("userId");
        const input = c.req.valid("json");
        await updateSpendLimitsData(userId, input);
        return c.json(await getSpendLimitsData(userId));
    });

export default app;