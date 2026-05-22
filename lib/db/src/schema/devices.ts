import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const devicesTable = pgTable("devices", {
  id: serial("id").primaryKey(),
  serialNumber: text("serial_number").notNull().unique(),
  deviceName: text("device_name"),
  ipAddress: text("ip_address"),
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
  isOnline: boolean("is_online").notNull().default(false),
  totalPunches: integer("total_punches").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDeviceSchema = createInsertSchema(devicesTable).omit({ id: true, createdAt: true });
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devicesTable.$inferSelect;
