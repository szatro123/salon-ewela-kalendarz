import { db, smsQueueTable } from "@workspace/db";
import { and, eq, lte } from "drizzle-orm";
import { sendSms } from "./sender";

// ── Message templates ──────────────────────────────────────────────────────
// To shorten delays for testing:
//   CONFIRM_DELAY_MS = 1 * 60 * 1000   (1 minute)
//   REMINDER_WINDOW_MS = 1 * 60 * 60 * 1000  (check within 1 hour)

function formatDatePl(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

export function buildConfirmationMsg(date: string, time: string, service: string): string {
  const dateLabel = formatDatePl(date);
  return (
    `Dzień dobry. Salon Piękności Ewelina potwierdza wizytę dnia ${dateLabel} o godz. ${time}. ` +
    `Usługa: ${service}. Do zobaczenia.`
  );
}

export function buildReminderMsg(time: string, service: string): string {
  return (
    `Przypomnienie: jutro o godz. ${time} ma Pani wizytę w Salonie Piękności Ewelina. ` +
    `Usługa: ${service}. Do zobaczenia.`
  );
}

// ── Scheduler ─────────────────────────────────────────────────────────────
async function checkPending(): Promise<void> {
  const now = new Date();

  // 1. Confirmation SMS — send when confirmScheduledAt has passed
  const pendingConfirmations = await db
    .select()
    .from(smsQueueTable)
    .where(
      and(
        eq(smsQueueTable.confirmationSent, false),
        eq(smsQueueTable.cancelled, false),
        lte(smsQueueTable.confirmScheduledAt, now)
      )
    );

  for (const row of pendingConfirmations) {
    const message = buildConfirmationMsg(row.date, row.time, row.service);
    await sendSms({
      appointmentId: row.appointmentId,
      type:          "confirmation",
      rawPhone:      row.phone,
      message,
    });
    await db
      .update(smsQueueTable)
      .set({ confirmationSent: true })
      .where(eq(smsQueueTable.id, row.id));
  }

  // 2. Reminder SMS — send when appointment is within 24 h
  const hours24Ms = 24 * 60 * 60 * 1000;

  const pendingReminders = await db
    .select()
    .from(smsQueueTable)
    .where(
      and(
        eq(smsQueueTable.reminderSent, false),
        eq(smsQueueTable.cancelled, false)
      )
    );

  for (const row of pendingReminders) {
    const apptStart = new Date(`${row.date}T${row.time}:00`).getTime();
    const diffMs    = apptStart - now.getTime();

    if (diffMs > 0 && diffMs <= hours24Ms) {
      const message = buildReminderMsg(row.time, row.service);
      await sendSms({
        appointmentId: row.appointmentId,
        type:          "reminder",
        rawPhone:      row.phone,
        message,
      });
      await db
        .update(smsQueueTable)
        .set({ reminderSent: true })
        .where(eq(smsQueueTable.id, row.id));
    }
  }
}

export function startScheduler(): void {
  console.log("[SMS Scheduler] Started — checking every 60 s");
  checkPending().catch((e) => console.error("[SMS Scheduler] initial check error:", e));
  setInterval(() => {
    checkPending().catch((e) => console.error("[SMS Scheduler] error:", e));
  }, 60_000);
}
