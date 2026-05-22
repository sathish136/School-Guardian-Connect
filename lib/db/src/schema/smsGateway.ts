import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const smsGatewayTable = pgTable("sms_gateway", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(),
  apiUrl: text("api_url").notNull(),
  apiKey: text("api_key").notNull(),
  senderId: text("sender_id").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSmsGatewaySchema = createInsertSchema(smsGatewayTable).omit({ id: true, updatedAt: true });
export type InsertSmsGateway = z.infer<typeof insertSmsGatewaySchema>;
export type SmsGateway = typeof smsGatewayTable.$inferSelect;
