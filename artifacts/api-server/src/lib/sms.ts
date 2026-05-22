import { db } from "@workspace/db";
import { smsGatewayTable, smsLogsTable } from "@workspace/db";
import { logger } from "./logger";

export async function sendSms(
  studentId: number,
  guardianPhone: string,
  message: string
): Promise<boolean> {
  const [gateway] = await db.select().from(smsGatewayTable).limit(1);

  if (!gateway || !gateway.isActive) {
    logger.info({ studentId }, "SMS gateway not configured or inactive, logging only");
    await db.insert(smsLogsTable).values({
      studentId,
      guardianPhone,
      message,
      status: "pending",
      errorMessage: "SMS gateway not configured",
    });
    return false;
  }

  try {
    const response = await fetch(gateway.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${gateway.apiKey}`,
      },
      body: JSON.stringify({
        to: guardianPhone,
        from: gateway.senderId,
        message,
      }),
    });

    if (response.ok) {
      await db.insert(smsLogsTable).values({
        studentId,
        guardianPhone,
        message,
        status: "sent",
      });
      logger.info({ studentId, guardianPhone }, "SMS sent successfully");
      return true;
    } else {
      const errorText = await response.text();
      await db.insert(smsLogsTable).values({
        studentId,
        guardianPhone,
        message,
        status: "failed",
        errorMessage: `HTTP ${response.status}: ${errorText}`,
      });
      logger.warn({ studentId, status: response.status }, "SMS send failed");
      return false;
    }
  } catch (err) {
    await db.insert(smsLogsTable).values({
      studentId,
      guardianPhone,
      message,
      status: "failed",
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    });
    logger.error({ err, studentId }, "SMS send error");
    return false;
  }
}
