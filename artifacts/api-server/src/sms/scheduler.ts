import { db, smsQueueTable } from "@workspace/db";
import { and, eq, lte } from "drizzle-orm";
import { sendSms } from "./sender";

function formatDatePl(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

async function checkPending(): Promise<void> {
  const now = new Date();

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
    const dateLabel = formatDatePl(row.date);
    const msg =
      `Dzien dobry \uD83D\uDE0A\n` +
      `Salon Pieknosci Ewelina potwierdza wizyte:\n\n` +
      `\uD83D\uDCC5 ${dateLabel}\n` +
      `\u23F0 ${row.time}\n\n` +
      `W razie zmiany prosimy o kontakt.\n` +
      `Do zobaczenia \uD83D\uDC85`;

    console.log(`[SMS] Sending confirmation → ${row.phone} (appt: ${row.appointmentId})`);
    await sendSms(row.phone, msg);

    await db
      .update(smsQueueTable)
      .set({ confirmationSent: true })
      .where(eq(smsQueueTable.id, row.id));
  }

  const pendingReminders = await db
    .select()
    .from(smsQueueTable)
    .where(
      and(
        eq(smsQueueTable.reminderSent, false),
        eq(smsQueueTable.cancelled, false)
      )
    );

  const hours24Ms = 24 * 60 * 60 * 1000;

  for (const row of pendingReminders) {
    const apptStart = new Date(`${row.date}T${row.time}:00`).getTime();
    const diffMs = apptStart - now.getTime();

    if (diffMs > 0 && diffMs <= hours24Ms) {
      const dateLabel = formatDatePl(row.date);
      const msg =
        `Przypomnienie \uD83D\uDE0A\n\n` +
        `Jutro ma Pani wizyte w Salonie Pieknosci Ewelina:\n\n` +
        `\uD83D\uDCC5 ${dateLabel}\n` +
        `\u23F0 ${row.time}\n\n` +
        `Do zobaczenia \uD83D\uDC85`;

      console.log(`[SMS] Sending reminder → ${row.phone} (appt: ${row.appointmentId})`);
      await sendSms(row.phone, msg);

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
