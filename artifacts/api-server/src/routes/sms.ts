import { Router } from "express";
import { db } from "@workspace/db";
import { smsGatewayTable, smsLogsTable, studentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  UpsertSmsGatewayBody,
  ListSmsLogsQueryParams,
  TestSmsGatewayBody,
} from "@workspace/api-zod";
import { sendSms } from "../lib/sms";

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

router.post("/sms-gateway/test", async (req, res) => {
  const body = TestSmsGatewayBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [gateway] = await db.select().from(smsGatewayTable).limit(1);
  if (!gateway || !gateway.isActive) {
    res.json({ success: false, error: "SMS gateway is not configured or inactive. Save your settings first." });
    return;
  }

  try {
    if (gateway.provider === "Hutch BSMS") {
      const username = process.env.HUTCH_SMS_USERNAME ?? gateway.apiKey;
      const password = process.env.HUTCH_SMS_PASSWORD;
      if (!password) {
        res.json({ success: false, error: "HUTCH_SMS_PASSWORD secret is not set" });
        return;
      }

      // Step 1: login
      const loginRes = await fetch("https://bsms.hutch.lk/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-VERSION": "v1" },
        body: JSON.stringify({ username, password }),
      });
      if (!loginRes.ok) {
        const err = await loginRes.text();
        res.json({ success: false, error: `Login failed (HTTP ${loginRes.status}): ${err}` });
        return;
      }
      const loginJson = await loginRes.json() as { accessToken?: string; message?: string };
      if (!loginJson.accessToken) {
        res.json({ success: false, error: `Login returned no token: ${JSON.stringify(loginJson)}` });
        return;
      }

      // Step 2: send
      const smsRes = await fetch("https://bsms.hutch.lk/api/sendsms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-VERSION": "v1",
          "Authorization": `Bearer ${loginJson.accessToken}`,
        },
        body: JSON.stringify({
          campaignName: username,
          mask: gateway.senderId,
          numbers: body.data.phone,
          content: "SafeRide Ops — test SMS. Your Hutch BSMS gateway is working correctly.",
        }),
      });

      if (!smsRes.ok) {
        const err = await smsRes.text();
        res.json({ success: false, error: `Send failed (HTTP ${smsRes.status}): ${err}` });
        return;
      }
      res.json({ success: true });
    } else {
      // Generic gateway test
      const response = await fetch(gateway.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${gateway.apiKey}` },
        body: JSON.stringify({ to: body.data.phone, from: gateway.senderId, message: "SafeRide Ops — test SMS." }),
      });
      res.json({ success: response.ok, error: response.ok ? undefined : `HTTP ${response.status}` });
    }
  } catch (err) {
    res.json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
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
