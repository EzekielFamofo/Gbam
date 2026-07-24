import { Hono } from "hono";
import { db } from "@gbam/database/client"; 
import { requireAuth } from "../middleware/require-auth"; 

const permissions = new Hono()
  // Apply the Bearer token auth middleware to all routes in this file
  .use("*", requireAuth)
  .get("/", async (c) => {
    // requireAuth should populate the user object in the Hono context
    const userId = c.get("userId");

    const settings = await db.userSettings.findUnique({
      where: { userId },
      select: { permissionConfig: true },
    });

    // We return exactly what the database has. 
    // If it's null, the CLI will naturally fall back to DEFAULT_PERMISSION_RULES
    return c.json({
      permissionConfig: settings?.permissionConfig ?? null,
    });
  });

export default permissions;