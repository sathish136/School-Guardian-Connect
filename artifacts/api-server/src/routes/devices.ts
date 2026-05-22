import { Router } from "express";
import { db } from "@workspace/db";
import { devicesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/devices", async (_req, res) => {
  const devices = await db.select().from(devicesTable).orderBy(desc(devicesTable.lastSeen));
  res.json(devices.map(d => ({
    ...d,
    lastSeen: d.lastSeen.toISOString(),
    createdAt: d.createdAt.toISOString(),
  })));
});

router.delete("/devices/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(devicesTable).where(eq(devicesTable.id, id));
  res.status(204).send();
});

export default router;
