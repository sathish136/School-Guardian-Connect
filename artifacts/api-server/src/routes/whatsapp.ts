import { Router } from "express";
import { db } from "@workspace/db";
import { whatsappGatewayTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpsertWhatsappGatewayBody } from "@workspace/api-zod";

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

export default router;
