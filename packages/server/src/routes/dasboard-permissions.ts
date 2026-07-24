import { Hono } from "hono";
import {  Prisma } from "@gbam/database";
import { db } from "@gbam/database/client";
import { requireInternalWebAuth, type InternalWebAuthEnv } from "../middleware/require-internal-web-auth";
import { DEFAULT_PERMISSION_RULES, type PermissionRule } from "@gbam/shared";

const dashboardPermissions = new Hono<InternalWebAuthEnv>();

dashboardPermissions.use("*", requireInternalWebAuth);

dashboardPermissions.get("/", async (c) => {
  const userId = c.get("userId");

  const settings = await db.userSettings.findUnique({
    where: { userId },
    select: { permissionConfig: true },
  });

  const rules = (settings?.permissionConfig as PermissionRule[] | null) ?? DEFAULT_PERMISSION_RULES;

  return c.json({
    permissionConfig: rules,
    isCustom: settings?.permissionConfig != null,
  });
});

dashboardPermissions.patch("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{ permissionConfig: PermissionRule[] | null }>();

  // Prisma needs the JsonNull sentinel to store an actual JSON null,
  // since a bare `null` here is ambiguous with "field not provided"
  const permissionConfigValue =
    body.permissionConfig === null
      ? Prisma.JsonNull
      : (body.permissionConfig as Prisma.InputJsonValue);

  await db.userSettings.upsert({
    where: { userId },
    create: { userId, permissionConfig: permissionConfigValue },
    update: { permissionConfig: permissionConfigValue },
  });

  return c.json({ success: true });
});

export default dashboardPermissions;