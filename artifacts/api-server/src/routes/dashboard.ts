import { Router } from "express";
import { db } from "@workspace/db";
import { studentsTable, busesTable, routesTable, tripsTable, scansTable, smsLogsTable } from "@workspace/db";
import { eq, gte, and, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { GetRecentActivityQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/dashboard/stats", async (_req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalStudents] = await db.select({ count: sql<number>`count(*)::int` }).from(studentsTable);
  const [totalBuses] = await db.select({ count: sql<number>`count(*)::int` }).from(busesTable);
  const [totalRoutes] = await db.select({ count: sql<number>`count(*)::int` }).from(routesTable);
  const [activeTrips] = await db.select({ count: sql<number>`count(*)::int` }).from(tripsTable).where(eq(tripsTable.status, "active"));

  const [todayScans] = await db.select({ count: sql<number>`count(*)::int` }).from(scansTable).where(gte(scansTable.scannedAt, todayStart));
  const [todayBoardings] = await db.select({ count: sql<number>`count(*)::int` }).from(scansTable).where(and(gte(scansTable.scannedAt, todayStart), eq(scansTable.scanType, "board")));
  const [todayAlightings] = await db.select({ count: sql<number>`count(*)::int` }).from(scansTable).where(and(gte(scansTable.scannedAt, todayStart), eq(scansTable.scanType, "alight")));
  const [smsSentToday] = await db.select({ count: sql<number>`count(*)::int` }).from(smsLogsTable).where(and(gte(smsLogsTable.sentAt, todayStart), eq(smsLogsTable.status, "sent")));
  const [smsFailedToday] = await db.select({ count: sql<number>`count(*)::int` }).from(smsLogsTable).where(and(gte(smsLogsTable.sentAt, todayStart), eq(smsLogsTable.status, "failed")));

  // Students currently on bus: those who boarded but haven't alighted in an active trip
  const [studentsOnBus] = await db.select({ count: sql<number>`count(distinct ${scansTable.studentId})::int` })
    .from(scansTable)
    .innerJoin(tripsTable, and(eq(scansTable.tripId, tripsTable.id), eq(tripsTable.status, "active")))
    .where(eq(scansTable.scanType, "board"));

  res.json({
    totalStudents: totalStudents.count,
    totalBuses: totalBuses.count,
    totalRoutes: totalRoutes.count,
    activeTrips: activeTrips.count,
    todayScans: todayScans.count,
    todayBoardings: todayBoardings.count,
    todayAlightings: todayAlightings.count,
    smsSentToday: smsSentToday.count,
    smsFailedToday: smsFailedToday.count,
    studentsOnBus: studentsOnBus.count,
  });
});

router.get("/dashboard/recent-activity", async (req, res) => {
  const query = GetRecentActivityQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const { limit = 20 } = query.data;

  const activities = await db
    .select({
      id: scansTable.id,
      studentName: studentsTable.name,
      studentId: studentsTable.id,
      grade: studentsTable.grade,
      guardianName: studentsTable.guardianName,
      scanType: scansTable.scanType,
      scannedAt: scansTable.scannedAt,
      busNumber: busesTable.busNumber,
      tripId: scansTable.tripId,
      location: scansTable.location,
      smsSent: scansTable.smsSent,
    })
    .from(scansTable)
    .leftJoin(studentsTable, eq(scansTable.studentId, studentsTable.id))
    .leftJoin(tripsTable, eq(scansTable.tripId, tripsTable.id))
    .leftJoin(busesTable, eq(tripsTable.busId, busesTable.id))
    .orderBy(desc(scansTable.scannedAt))
    .limit(limit ?? 20);

  res.json(activities.map(a => ({
    ...a,
    scannedAt: a.scannedAt.toISOString(),
    travelDurationMinutes: null,
  })));
});

export default router;
