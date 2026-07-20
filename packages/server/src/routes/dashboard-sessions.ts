import { Hono } from "hono";
import { db } from "@gbam/database/client";
import {
  requireInternalWebAuth,
  type InternalWebAuthEnv,
} from "../middleware/require-internal-web-auth";

const app = new Hono<InternalWebAuthEnv>()
  .use("*", requireInternalWebAuth)
  .delete("/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");

    const result = await db.session.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      return c.json({ error: "Session not found" }, 404);
    }

    return c.json({ success: true });
  });

export default app;
