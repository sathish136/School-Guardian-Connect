import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tripsTable = pgTable("trips", {
  id: serial("id").primaryKey(),
  busId: integer("bus_id").notNull(),
  routeId: integer("route_id"),
  status: text("status").notNull().default("active"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  totalBoardings: integer("total_boardings").notNull().default(0),
  totalAlightings: integer("total_alightings").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTripSchema = createInsertSchema(tripsTable).omit({ id: true, createdAt: true, startedAt: true, totalBoardings: true, totalAlightings: true });
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof tripsTable.$inferSelect;
