import { Router } from "express";
import { db } from "@workspace/db";
import { smsGatewayTable, smsLogsTable, studentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  UpsertSmsGatewayBody,
  ListSmsLogsQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/sms-gateway", async (_req, res) => {
  const [gateway] = await db.select().from(smsGatewayTable).limit(1);
  if (!gateway) {
    res.status(404).json({ error: "SMS gateway not configured" });
    return;
  }
  res.json({ ...gateway, updatedAt: gateway.updatedAt.toISOString() });
});

router.put("/sms-gateway", async (req, res) => {
  const body = UpsertSmsGatewayBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [existing] = await db.select().from(smsGatewayTable).limit(1);
  let gateway;
  if (existing) {
    [gateway] = await db
      .update(smsGatewayTable)
      .set({ ...body.data, updatedAt: new Date() })
      .where(eq(smsGatewayTable.id, existing.id))
      .returning();
  } else {
    [gateway] = await db.insert(smsGatewayTable).values(body.data).returning();
  }
  res.json({ ...gateway, updatedAt: gateway.updatedAt.toISOString() });
});

router.get("/sms-logs", async (req, res) => {
  const query = ListSmsLogsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const { studentId, status, limit = 50 } = query.data;

  const logs = await db
    .select({
      id: smsLogsTable.id,
      studentId: smsLogsTable.studentId,
      guardianPhone: smsLogsTable.guardianPhone,
      message: smsLogsTable.message,
      status: smsLogsTable.status,
      errorMessage: smsLogsTable.errorMessage,
      sentAt: smsLogsTable.sentAt,
      studentName: studentsTable.name,
    })
    .from(smsLogsTable)
    .leftJoin(studentsTable, eq(smsLogsTable.studentId, studentsTable.id))
    .where(
      studentId !== undefined && status
        ? eq(smsLogsTable.studentId, studentId)
        : studentId !== undefined
          ? eq(smsLogsTable.studentId, studentId)
          : status
            ? eq(smsLogsTable.status, status)
            : undefined
    )
    .orderBy(desc(smsLogsTable.sentAt))
    .limit(limit ?? 50);

  res.json(logs.map(l => ({ ...l, sentAt: l.sentAt.toISOString() })));
});

export default router;
