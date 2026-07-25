import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import {
    requireInternalWebAuth,
    type InternalWebAuthEnv,
} from "../middleware/require-internal-web-auth";
import { getPermissionsData, updatePermissionsData } from "../lib/permissions";
import { permissionConfigSchema } from "@gbam/shared";

const updateSchema = z.object({
    permissionConfig: permissionConfigSchema,
});

const updateValidator = zValidator("json", updateSchema, (result, c) => {
    if (!result.success) {
        return c.json({ error: "Invalid request body" }, 400);
    }
});

const app = new Hono<InternalWebAuthEnv>()
    .use("*", requireInternalWebAuth)
    .get("/", async (c) => {
        const userId = c.get("userId");
        return c.json(await getPermissionsData(userId));
    })
    .patch("/", updateValidator, async (c) => {
        const userId = c.get("userId");
        const input = c.req.valid("json");
        await updatePermissionsData(userId, input.permissionConfig);
        return c.json(await getPermissionsData(userId));
    });

export default app;