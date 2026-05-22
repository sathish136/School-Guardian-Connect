/**
 * ADMS (Attendance Data Management System) server for ZKTeco biometric devices.
 * Devices connect on port 8081 and POST attendance punches here.
 * On each punch, we look up the student by biometricId and fire an SMS.
 */
import express from "express";
import { db } from "@workspace/db";
import { devicesTable, studentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendSms } from "./lib/sms";
import { logger } from "./lib/logger";
import { sql } from "drizzle-orm";

const adms = express();
adms.use(express.text({ type: "*/*" }));
adms.use(express.urlencoded({ extended: true }));

async function upsertDevice(sn: string, ip: string): Promise<void> {
  try {
    await db
      .insert(devicesTable)
      .values({ serialNumber: sn, ipAddress: ip, isOnline: true, lastSeen: new Date() })
      .onConflictDoUpdate({
        target: devicesTable.serialNumber,
        set: { ipAddress: ip, isOnline: true, lastSeen: new Date() },
      });
  } catch (err) {
    logger.error({ err, sn }, "Failed to upsert device");
  }
}

async function markDeviceOffline(sn: string): Promise<void> {
  try {
    await db
      .update(devicesTable)
      .set({ isOnline: false })
      .where(eq(devicesTable.serialNumber, sn));
  } catch (_) {/* best-effort */}
}

/**
 * ZK device heartbeat / registration
 * GET /iclock/cdata?SN=<serial>&options=all&pushver=2.2&language=69
 */
adms.get("/iclock/cdata", async (req, res) => {
  const sn = String(req.query["SN"] ?? req.query["sn"] ?? "");
  const ip = req.ip ?? "";
  if (sn) await upsertDevice(sn, ip);

  res.setHeader("Content-Type", "text/plain");
  res.send(
    `GET OPTION FROM: ${sn}\nATTLOGStamp=None\nOPERLOGStamp=9999\nATTPHOTOStamp=None\n` +
    `ErrorDelay=30\nDelay=10\nTransTimes=00:00;14:05\nTransInterval=1\n` +
    `TransFlag=TransData AttLog OpLog AttPhoto EnrollUser ChgUser EnrollFP DelFP UserPic\n` +
    `TimeZone=8\nRealtime=1\nEncrypt=None\n`
  );
});

/**
 * ZK device posts attendance data
 * POST /iclock/cdata?SN=<serial>&table=ATTLOG&Stamp=<timestamp>
 * Body lines: uid\tuser_id\tYYYY-MM-DD HH:MM:SS\tstatus\tverify_type\twork_code
 */
adms.post("/iclock/cdata", async (req, res) => {
  const sn = String(req.query["SN"] ?? req.query["sn"] ?? "");
  const table = String(req.query["table"] ?? "");
  const ip = req.ip ?? "";

  if (sn) await upsertDevice(sn, ip);

  if (table === "ATTLOG") {
    const body = typeof req.body === "string" ? req.body : "";
    const lines = body.split(/\r?\n/).filter(l => l.trim().length > 0);

    let count = 0;
    for (const line of lines) {
      const parts = line.split("\t");
      if (parts.length < 3) continue;

      const userId = parts[1]?.trim();
      const timestamp = parts[2]?.trim();
      const status = parts[3]?.trim() ?? "0";
      // 0 = check-in (board), 1 = check-out (alight)
      const scanType = status === "1" ? "alight" : "board";

      if (!userId) continue;

      try {
        const [student] = await db
          .select()
          .from(studentsTable)
          .where(eq(studentsTable.biometricId, userId));

        if (student && student.isActive) {
          const time = timestamp ? new Date(timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
          const action = scanType === "board" ? "boarded" : "alighted from";
          const message = `SafeRide: ${student.name} has ${action} the school bus at ${time}. Device: ${sn}.`;

          await sendSms(student.id, student.guardianPhone, message);

          await db
            .update(devicesTable)
            .set({ totalPunches: sql`${devicesTable.totalPunches} + 1` })
            .where(eq(devicesTable.serialNumber, sn));

          logger.info({ userId, studentName: student.name, scanType }, "Punch processed");
        } else {
          logger.warn({ userId }, "No active student found for biometric ID");
        }
      } catch (err) {
        logger.error({ err, userId }, "Error processing punch");
      }
      count++;
    }

    res.setHeader("Content-Type", "text/plain");
    res.send(`OK: ${count}`);
    return;
  }

  res.setHeader("Content-Type", "text/plain");
  res.send("OK");
});

/**
 * ZK device polls for pending commands
 * GET /iclock/getrequest?SN=<serial>
 */
adms.get("/iclock/getrequest", async (req, res) => {
  const sn = String(req.query["SN"] ?? req.query["sn"] ?? "");
  const ip = req.ip ?? "";
  if (sn) await upsertDevice(sn, ip);
  res.setHeader("Content-Type", "text/plain");
  res.send("");
});

/**
 * ZK device acknowledges command execution
 * POST /iclock/devicecmd
 */
adms.post("/iclock/devicecmd", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.send("OK");
});

/**
 * Periodic job: mark devices offline if not seen in 2 minutes
 */
setInterval(async () => {
  const cutoff = new Date(Date.now() - 2 * 60 * 1000);
  try {
    await db
      .update(devicesTable)
      .set({ isOnline: false })
      .where(sql`${devicesTable.isOnline} = true AND ${devicesTable.lastSeen} < ${cutoff}`);
  } catch (_) {/* ignore */}
}, 30_000);

export { adms, markDeviceOffline };
