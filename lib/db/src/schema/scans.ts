import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scansTable = pgTable("scans", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  tripId: integer("trip_id").notNull(),
  scanType: text("scan_type").notNull(),
  scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull().defaultNow(),
  location: text("location"),
  smsSent: boolean("sms_sent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertScanSchema = createInsertSchema(scansTable).omit({ id: true, createdAt: true, scannedAt: true, smsSent: true });
export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scansTable.$inferSelect;
