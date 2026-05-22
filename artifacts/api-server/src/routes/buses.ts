import { Router } from "express";
import { db } from "@workspace/db";
import { busesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateBusBody,
  GetBusParams,
  UpdateBusParams,
  UpdateBusBody,
  DeleteBusParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/buses", async (_req, res) => {
  const buses = await db.select().from(busesTable);
  res.json(buses.map(b => ({ ...b, createdAt: b.createdAt.toISOString() })));
});

router.post("/buses", async (req, res) => {
  const body = CreateBusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [bus] = await db.insert(busesTable).values(body.data).returning();
  res.status(201).json({ ...bus, createdAt: bus.createdAt.toISOString() });
});

router.get("/buses/:id", async (req, res) => {
  const params = GetBusParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [bus] = await db.select().from(busesTable).where(eq(busesTable.id, params.data.id));
  if (!bus) {
    res.status(404).json({ error: "Bus not found" });
    return;
  }
  res.json({ ...bus, createdAt: bus.createdAt.toISOString() });
});

router.patch("/buses/:id", async (req, res) => {
  const params = UpdateBusParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateBusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [bus] = await db
    .update(busesTable)
    .set(body.data)
    .where(eq(busesTable.id, params.data.id))
    .returning();
  if (!bus) {
    res.status(404).json({ error: "Bus not found" });
    return;
  }
  res.json({ ...bus, createdAt: bus.createdAt.toISOString() });
});

router.delete("/buses/:id", async (req, res) => {
  const params = DeleteBusParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(busesTable).where(eq(busesTable.id, params.data.id));
  res.status(204).send();
});

export default router;
