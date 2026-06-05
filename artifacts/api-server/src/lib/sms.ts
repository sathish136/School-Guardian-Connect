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

async function sendHutchSms(
  username: string,
  password: string,
  mask: string,
  phone: string,
  message: string
): Promise<void> {
  // Step 1: Login to get access token
  const loginRes = await fetch("https://bsms.hutch.lk/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-VERSION": "v1",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!loginRes.ok) {
    const err = await loginRes.text();
    throw new Error(`Hutch BSMS login failed HTTP ${loginRes.status}: ${err}`);
  }

  const loginJson = await loginRes.json() as { accessToken?: string; message?: string };
  const accessToken = loginJson.accessToken;
  if (!accessToken) {
    throw new Error(`Hutch BSMS login returned no token: ${JSON.stringify(loginJson)}`);
  }

  // Step 2: Send SMS
  const smsRes = await fetch("https://bsms.hutch.lk/api/sendsms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-VERSION": "v1",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      campaignName: username,
      mask,
      numbers: phone,
      content: message,
    }),
  });

  if (!smsRes.ok) {
    const err = await smsRes.text();
    throw new Error(`Hutch BSMS send failed HTTP ${smsRes.status}: ${err}`);
  }
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
    if (smsGateway.provider === "Hutch BSMS") {
      const username = process.env.HUTCH_SMS_USERNAME ?? smsGateway.apiKey;
      const password = process.env.HUTCH_SMS_PASSWORD;
      if (!password) {
        throw new Error("HUTCH_SMS_PASSWORD environment variable is not set");
      }
      await sendHutchSms(username, password, smsGateway.senderId, guardianPhone, message);
    } else {
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    }

    await db.insert(smsLogsTable).values({ studentId, guardianPhone, message, status: "sent" });
    logger.info({ studentId, guardianPhone, channel: "sms", provider: smsGateway.provider }, "SMS sent");
    return true;
  } catch (err) {
    await db.insert(smsLogsTable).values({
      studentId, guardianPhone, message, status: "failed",
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    });
    logger.error({ err, studentId }, "SMS send error");
    return false;
  }
}
