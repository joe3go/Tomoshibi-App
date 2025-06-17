import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

export const usageLog = pgTable("usage_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  wordFormUsed: text("word_form_used").notNull(),
  wordNormalized: text("word_normalized").notNull(),
  source: text("source").notNull(), // 'chat', 'scenario', 'popup'
  confidence: text("confidence").default("0.5"), // normalization confidence
  partOfSpeech: text("part_of_speech"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUsageLogSchema = createInsertSchema(usageLog).omit({
  id: true,
  createdAt: true,
});

export type InsertUsageLog = z.infer<typeof insertUsageLogSchema>;
export type UsageLog = typeof usageLog.$inferSelect;