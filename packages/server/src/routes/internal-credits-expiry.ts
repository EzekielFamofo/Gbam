import { Hono } from "hono";
import { sweepExpiredCredits } from "../lib/credits-ledger";

const ExpiredCreditsSweep = new Hono().post("/sweep", async (c) => {
  const providedSecret = c.req.header("x-cron-secret");
  if (!providedSecret || providedSecret !== process.env.CRON_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const result = await sweepExpiredCredits();
  return c.json(result);
});

export default ExpiredCreditsSweep;