import { zValidator } from "@hono/zod-validator";
import { db } from "@gbam/database/client";
import { Hono } from "hono";
import z from "zod";
import { requireAuth, type AuthenticatedEnv } from "../middleware/require-auth";
import { requireCreditsBalance } from "../middleware/require-credits-balance";

const createSessionSchema = z.object({
  title: z.string(),
});

const updateSessionSchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty"),
});

const createSessionValidator = zValidator(
  "json", createSessionSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: "Invalid request body" }, 400);
    }
  }
);

const updateSessionValidator = zValidator(
  "json", updateSessionSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: "Invalid request body" }, 400);
    }
  }
);

const app = new Hono<AuthenticatedEnv>()
  .use("*", requireAuth)
  .get("/", async (c) => {
    const userId = c.get("userId");
    const sessions = await db.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });

    return c.json(sessions);
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const userId = c.get("userId");

    // Use findFirst for composite filters (id + userId)
    const session = await db.session.findFirst({
      where: { id, userId },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    return c.json(session);
  })
  .patch("/:id", updateSessionValidator, async (c) => {
    const id = c.req.param("id");
    const userId = c.get("userId");
    const { title } = c.req.valid("json");

    // Check ownership using findFirst
    const session = await db.session.findFirst({
      where: { id, userId },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    // Update using primary key 'id'
    const updatedSession = await db.session.update({
      where: { id },
      data: { title },
    });

    return c.json(updatedSession);
  })
  .post("/", createSessionValidator, requireCreditsBalance, async (c) => {
    const userId = c.get("userId");
    const data = c.req.valid("json");

    const session = await db.session.create({
      data: {
        ...data,
        userId,
      },
    });

    return c.json(session, 201);
  });

export default app;