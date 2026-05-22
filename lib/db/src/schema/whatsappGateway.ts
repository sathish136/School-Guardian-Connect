import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const whatsappGatewayTable = pgTable("whatsapp_gateway", {
  id: serial("id").primaryKey(),
  instanceId: text("instance_id").notNull(),
  token: text("token").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWhatsappGatewaySchema = createInsertSchema(whatsappGatewayTable).omit({ id: true, updatedAt: true });
export type InsertWhatsappGateway = z.infer<typeof insertWhatsappGatewaySchema>;
export type WhatsappGateway = typeof whatsappGatewayTable.$inferSelect;
