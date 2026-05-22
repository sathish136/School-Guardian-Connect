import { Router } from "express";
import { db } from "@workspace/db";
import { tripsTable, scansTable, studentsTable, busesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListTripsQueryParams,
  CreateTripBody,
  GetTripParams,
  UpdateTripParams,
  UpdateTripBody,
  GetTripScansParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/trips", async (req, res) => {
  const query = ListTripsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const { busId, status } = query.data;

  const conditions = [];
  if (busId !== undefined) conditions.push(eq(tripsTable.busId, busId));
  if (status) conditions.push(eq(tripsTable.status, status));

  const trips = conditions.length > 0
    ? await db.select().from(tripsTable).where(conditions.length === 1 ? conditions[0] : and(...conditions))
    : await db.select().from(tripsTable);

  res.json(trips.map(t => ({
    ...t,
    startedAt: t.startedAt.toISOString(),
    endedAt: t.endedAt ? t.endedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  })));
});

router.post("/trips", async (req, res) => {
  const body = CreateTripBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [trip] = await db.insert(tripsTable).values({
    ...body.data,
    status: "active",
  }).returning();
  res.status(201).json({
    ...trip,
    startedAt: trip.startedAt.toISOString(),
    endedAt: null,
    createdAt: trip.createdAt.toISOString(),
  });
});

router.get("/trips/:id", async (req, res) => {
  const params = GetTripParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, params.data.id));
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.json({
    ...trip,
    startedAt: trip.startedAt.toISOString(),
    endedAt: trip.endedAt ? trip.endedAt.toISOString() : null,
    createdAt: trip.createdAt.toISOString(),
  });
});

router.patch("/trips/:id", async (req, res) => {
  const params = UpdateTripParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateTripBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const updateData: Record<string, unknown> = { ...body.data };
  if (body.data.status === "completed" && !body.data.endedAt) {
    updateData.endedAt = new Date();
  } else if (body.data.endedAt) {
    updateData.endedAt = new Date(body.data.endedAt);
  }

  const [trip] = await db
    .update(tripsTable)
    .set(updateData)
    .where(eq(tripsTable.id, params.data.id))
    .returning();
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.json({
    ...trip,
    startedAt: trip.startedAt.toISOString(),
    endedAt: trip.endedAt ? trip.endedAt.toISOString() : null,
    createdAt: trip.createdAt.toISOString(),
  });
});

router.get("/trips/:id/scans", async (req, res) => {
  const params = GetTripScansParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const scans = await db
    .select({
      id: scansTable.id,
      studentId: scansTable.studentId,
      tripId: scansTable.tripId,
      scanType: scansTable.scanType,
      scannedAt: scansTable.scannedAt,
      location: scansTable.location,
      smsSent: scansTable.smsSent,
      studentName: studentsTable.name,
      guardianPhone: studentsTable.guardianPhone,
      busNumber: busesTable.busNumber,
    })
    .from(scansTable)
    .leftJoin(studentsTable, eq(scansTable.studentId, studentsTable.id))
    .leftJoin(tripsTable, eq(scansTable.tripId, tripsTable.id))
    .leftJoin(busesTable, eq(tripsTable.busId, busesTable.id))
    .where(eq(scansTable.tripId, params.data.id));

  res.json(scans.map(s => ({
    ...s,
    scannedAt: s.scannedAt.toISOString(),
  })));
});

export default router;
