import { Router, type IRouter, type Request, type Response } from "express";
import { db, smsQueueTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const CONFIRM_DELAY_MS = 1 * 60 * 1000;     // 1 minute

router.post("/schedule", async (req: Request, res: Response) => {
  const { appointmentId, clientName, phone, service, date, time, duration } = req.body ?? {};

  if (
    typeof appointmentId !== "string" || !appointmentId ||
    typeof clientName    !== "string" || !clientName    ||
    typeof phone         !== "string" || !phone         ||
    typeof service       !== "string" || !service       ||
    typeof date          !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    typeof time          !== "string" || !/^\d{2}:\d{2}$/.test(time)       ||
    typeof duration      !== "number" || !Number.isInteger(duration) || duration <= 0
  ) {
    res.status(400).json({ error: "bad_request", message: "Invalid body" });
    return;
  }

  // Cancel any existing pending SMS for this appointment (handles edits)
  await db
    .update(smsQueueTable)
    .set({ cancelled: true })
    .where(eq(smsQueueTable.appointmentId, appointmentId));

  const confirmScheduledAt = new Date(Date.now() + CONFIRM_DELAY_MS);

  await db.insert(smsQueueTable).values({
    appointmentId,
    clientName,
    phone,
    service,
    date,
    time,
    duration,
    confirmScheduledAt,
  });

  console.log(
    `[SMS] Scheduled — appt: ${appointmentId} | ${clientName} | ${service} | ${date} ${time} | ` +
    `confirm in ${CONFIRM_DELAY_MS / 60000} min`
  );
  res.json({ ok: true });
});

router.delete("/cancel/:appointmentId", async (req: Request, res: Response) => {
  const { appointmentId } = req.params;
  await db
    .update(smsQueueTable)
    .set({ cancelled: true })
    .where(eq(smsQueueTable.appointmentId, appointmentId));
  console.log(`[SMS] Cancelled — appt: ${appointmentId}`);
  res.json({ ok: true });
});

export default router;
