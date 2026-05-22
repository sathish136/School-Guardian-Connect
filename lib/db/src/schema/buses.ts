import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const busesTable = pgTable("buses", {
  id: serial("id").primaryKey(),
  busNumber: text("bus_number").notNull().unique(),
  driverName: text("driver_name").notNull(),
  driverPhone: text("driver_phone").notNull(),
  routeId: integer("route_id"),
  capacity: integer("capacity").notNull().default(40),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBusSchema = createInsertSchema(busesTable).omit({ id: true, createdAt: true });
export type InsertBus = z.infer<typeof insertBusSchema>;
export type Bus = typeof busesTable.$inferSelect;
