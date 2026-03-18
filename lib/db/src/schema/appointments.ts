import { pgTable, serial, text, integer, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  phone: text("phone").notNull(),
  service: text("service").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  duration: integer("duration").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  status: appointmentStatusEnum("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
