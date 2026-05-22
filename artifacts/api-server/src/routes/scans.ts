import { Router } from "express";
import { db } from "@workspace/db";
import { scansTable, studentsTable, tripsTable, busesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  ListScansQueryParams,
  RecordScanBody,
} from "@workspace/api-zod";
import { sendSms } from "../lib/sms";

const router = Router();

router.get("/scans", async (req, res) => {
  const query = ListScansQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const { studentId, limit = 50 } = query.data;

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
    .where(studentId !== undefined ? eq(scansTable.studentId, studentId) : undefined)
    .orderBy(desc(scansTable.scannedAt))
    .limit(limit ?? 50);

  res.json(scans.map(s => ({ ...s, scannedAt: s.scannedAt.toISOString() })));
});

router.post("/scans", async (req, res) => {
  const body = RecordScanBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { biometricId, tripId, scanType, location } = body.data;

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.biometricId, biometricId));

  if (!student) {
    res.status(400).json({ error: "Student not found for biometric ID" });
    return;
  }

  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
  if (!trip) {
    res.status(400).json({ error: "Trip not found" });
    return;
  }

  const [bus] = await db.select().from(busesTable).where(eq(busesTable.id, trip.busId));

  const [scan] = await db.insert(scansTable).values({
    studentId: student.id,
    tripId,
    scanType,
    location: location ?? null,
    smsSent: false,
  }).returning();

  // Update trip boarding/alighting counts
  if (scanType === "board") {
    await db.update(tripsTable).set({ totalBoardings: (trip.totalBoardings || 0) + 1 }).where(eq(tripsTable.id, tripId));
  } else {
    await db.update(tripsTable).set({ totalAlightings: (trip.totalAlightings || 0) + 1 }).where(eq(tripsTable.id, tripId));
  }

  // Build and send SMS
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const busNumber = bus?.busNumber ?? "Unknown";

  let travelDurationMinutes: number | null = null;
  if (scanType === "alight") {
    const boardScan = await db
      .select()
      .from(scansTable)
      .where(eq(scansTable.studentId, student.id))
      .orderBy(desc(scansTable.scannedAt))
      .limit(10);

    const lastBoard = boardScan.find(s => s.scanType === "board" && s.tripId === tripId);
    if (lastBoard) {
      travelDurationMinutes = Math.round((now.getTime() - lastBoard.scannedAt.getTime()) / 60000);
    }
  }

  let smsMessage: string;
  if (scanType === "board") {
    smsMessage = `Dear ${student.guardianName}, your child ${student.name} has BOARDED Bus ${busNumber} at ${timeStr} on ${dateStr}. They are on their way safely.`;
  } else {
    const durationText = travelDurationMinutes !== null ? ` Travel time: ${travelDurationMinutes} min.` : "";
    smsMessage = `Dear ${student.guardianName}, your child ${student.name} has ALIGHTED from Bus ${busNumber} at ${timeStr} on ${dateStr}.${durationText} They have arrived safely.`;
  }

  const smsSent = await sendSms(student.id, student.guardianPhone, smsMessage);

  if (smsSent) {
    await db.update(scansTable).set({ smsSent: true }).where(eq(scansTable.id, scan.id));
  }

  res.status(201).json({
    id: scan.id,
    studentId: student.id,
    tripId,
    scanType,
    scannedAt: scan.scannedAt.toISOString(),
    location: scan.location,
    smsSent,
    studentName: student.name,
    guardianPhone: student.guardianPhone,
    busNumber,
  });
});

export default router;
