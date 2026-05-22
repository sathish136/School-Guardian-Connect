import { Router } from "express";
import { db } from "@workspace/db";
import { routesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateRouteBody,
  GetRouteParams,
  UpdateRouteParams,
  UpdateRouteBody,
  DeleteRouteParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/routes", async (_req, res) => {
  const routes = await db.select().from(routesTable);
  res.json(routes.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/routes", async (req, res) => {
  const body = CreateRouteBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [route] = await db.insert(routesTable).values(body.data).returning();
  res.status(201).json({ ...route, createdAt: route.createdAt.toISOString() });
});

router.get("/routes/:id", async (req, res) => {
  const params = GetRouteParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [route] = await db.select().from(routesTable).where(eq(routesTable.id, params.data.id));
  if (!route) {
    res.status(404).json({ error: "Route not found" });
    return;
  }
  res.json({ ...route, createdAt: route.createdAt.toISOString() });
});

router.patch("/routes/:id", async (req, res) => {
  const params = UpdateRouteParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateRouteBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [route] = await db
    .update(routesTable)
    .set(body.data)
    .where(eq(routesTable.id, params.data.id))
    .returning();
  if (!route) {
    res.status(404).json({ error: "Route not found" });
    return;
  }
  res.json({ ...route, createdAt: route.createdAt.toISOString() });
});

router.delete("/routes/:id", async (req, res) => {
  const params = DeleteRouteParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(routesTable).where(eq(routesTable.id, params.data.id));
  res.status(204).send();
});

export default router;
