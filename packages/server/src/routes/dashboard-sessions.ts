import { Hono } from "hono";
import { db } from "@gbam/database/client";
import {
  requireInternalWebAuth,
  type InternalWebAuthEnv,
} from "../middleware/require-internal-web-auth";

const app = new Hono<InternalWebAuthEnv>()
  .use("*", requireInternalWebAuth)
  // PATCH (rename session)
  .patch("/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }
    const { title } = body;
    if (!title || typeof title !== "string" || !title.trim()) {
      return c.json({ error: "Invalid title" }, 400);
    }

    const trimmedTitle = title.trim();
    const [result] = await db.$transaction([
      db.session.updateMany({
        where: { id, userId },
        data: { title: trimmedTitle },
      }),
      db.creditTransaction.updateMany({
        where: { userId, sessionId: id },
        data: { description: trimmedTitle },
      }),
    ]);

    if (result.count === 0) {
      return c.json({ error: "Session not found or not owned by user" }, 404);
    }
    return c.json({ success: true });
  })
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
