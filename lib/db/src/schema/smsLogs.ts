import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const smsLogsTable = pgTable("sms_logs", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  guardianPhone: text("guardian_phone").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSmsLogSchema = createInsertSchema(smsLogsTable).omit({ id: true, createdAt: true, sentAt: true });
export type InsertSmsLog = z.infer<typeof insertSmsLogSchema>;
export type SmsLog = typeof smsLogsTable.$inferSelect;
