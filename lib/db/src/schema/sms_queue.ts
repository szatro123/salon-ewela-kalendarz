import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const smsQueueTable = pgTable("sms_queue", {
  id: serial("id").primaryKey(),
  appointmentId: text("appointment_id").notNull(),
  clientName: text("client_name").notNull(),
  phone: text("phone").notNull(),
  service: text("service").notNull().default(""),
  date: text("date").notNull(),
  time: text("time").notNull(),
  duration: integer("duration").notNull(),
  confirmScheduledAt: timestamp("confirm_scheduled_at").notNull(),
  confirmationSent: boolean("confirmation_sent").notNull().default(false),
  reminderSent: boolean("reminder_sent").notNull().default(false),
  cancelled: boolean("cancelled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SmsQueueRow = typeof smsQueueTable.$inferSelect;
