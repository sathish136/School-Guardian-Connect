import { Router } from "express";
import { db } from "@workspace/db";
import { whatsappGatewayTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpsertWhatsappGatewayBody, TestWhatsappGatewayBody } from "@workspace/api-zod";

const router = Router();

router.get("/whatsapp-gateway", async (_req, res) => {
  const [gw] = await db.select().from(whatsappGatewayTable).limit(1);
  if (!gw) {
    res.status(404).json({ error: "WhatsApp gateway not configured" });
    return;
  }
  res.json({ ...gw, updatedAt: gw.updatedAt.toISOString() });
});

router.put("/whatsapp-gateway", async (req, res) => {
  const body = UpsertWhatsappGatewayBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [existing] = await db.select().from(whatsappGatewayTable).limit(1);
  let gw;
  if (existing) {
    [gw] = await db
      .update(whatsappGatewayTable)
      .set({ ...body.data, updatedAt: new Date() })
      .where(eq(whatsappGatewayTable.id, existing.id))
      .returning();
  } else {
    [gw] = await db.insert(whatsappGatewayTable).values(body.data).returning();
  }
  res.json({ ...gw, updatedAt: gw.updatedAt.toISOString() });
});

router.post("/whatsapp-gateway/test", async (req, res) => {
  const body = TestWhatsappGatewayBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ success: false, error: "Phone number is required" });
    return;
  }

  const [gw] = await db.select().from(whatsappGatewayTable).limit(1);
  if (!gw) {
    res.json({ success: false, error: "WhatsApp gateway not configured. Save your Instance ID and Token first." });
    return;
  }

  try {
    const url = `https://api.ultramsg.com/${gw.instanceId}/messages/chat`;
    const params = new URLSearchParams({
      token: gw.token,
      to: body.data.phone,
      body: "✅ SafePass test message — your WhatsApp integration is working correctly!",
    });
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const json = await response.json() as { sent?: string; error?: string };
    if (json.error) {
      res.json({ success: false, error: json.error });
    } else {
      res.json({ success: true });
    }
  } catch (err) {
    res.json({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
});

export default router;
