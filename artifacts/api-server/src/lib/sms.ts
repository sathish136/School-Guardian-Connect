import { db } from "@workspace/db";
import { smsGatewayTable, smsLogsTable, whatsappGatewayTable } from "@workspace/db";
import { logger } from "./logger";

async function sendWhatsapp(
  instanceId: string,
  token: string,
  phone: string,
  message: string
): Promise<boolean> {
  const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
  const params = new URLSearchParams({ token, to: phone, body: message });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`UltraMsg HTTP ${response.status}: ${err}`);
  }
  const json = await response.json() as { sent?: string; error?: string };
  if (json.error) throw new Error(json.error);
  return true;
}

export async function sendSms(
  studentId: number,
  guardianPhone: string,
  message: string
): Promise<boolean> {
  // Try WhatsApp first if configured and active
  const [waGateway] = await db.select().from(whatsappGatewayTable).limit(1);

  if (waGateway?.isActive) {
    try {
      await sendWhatsapp(waGateway.instanceId, waGateway.token, guardianPhone, message);
      await db.insert(smsLogsTable).values({
        studentId,
        guardianPhone,
        message,
        status: "sent",
      });
      logger.info({ studentId, guardianPhone, channel: "whatsapp" }, "WhatsApp message sent");
      return true;
    } catch (err) {
      logger.warn({ err, studentId }, "WhatsApp send failed, falling back to SMS");
      await db.insert(smsLogsTable).values({
        studentId,
        guardianPhone,
        message,
        status: "failed",
        errorMessage: err instanceof Error ? `WhatsApp: ${err.message}` : "WhatsApp unknown error",
      });
      // Fall through to SMS
    }
  }

  // SMS gateway
  const [smsGateway] = await db.select().from(smsGatewayTable).limit(1);

  if (!smsGateway || !smsGateway.isActive) {
    logger.info({ studentId }, "SMS gateway not configured or inactive, logging only");
    await db.insert(smsLogsTable).values({
      studentId,
      guardianPhone,
      message,
      status: "pending",
      errorMessage: "No active gateway configured",
    });
    return false;
  }

  try {
    const response = await fetch(smsGateway.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${smsGateway.apiKey}`,
      },
      body: JSON.stringify({
        to: guardianPhone,
        from: smsGateway.senderId,
        message,
      }),
    });

    if (response.ok) {
      await db.insert(smsLogsTable).values({ studentId, guardianPhone, message, status: "sent" });
      logger.info({ studentId, guardianPhone, channel: "sms" }, "SMS sent");
      return true;
    } else {
      const errorText = await response.text();
      await db.insert(smsLogsTable).values({
        studentId, guardianPhone, message, status: "failed",
        errorMessage: `HTTP ${response.status}: ${errorText}`,
      });
      logger.warn({ studentId, status: response.status }, "SMS send failed");
      return false;
    }
  } catch (err) {
    await db.insert(smsLogsTable).values({
      studentId, guardianPhone, message, status: "failed",
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    });
    logger.error({ err, studentId }, "SMS send error");
    return false;
  }
}
