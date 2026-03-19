import { Router, type IRouter, type Request, type Response } from "express";
import { db, smsQueueTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/schedule", async (req: Request, res: Response) => {
  const { appointmentId, clientName, phone, date, time, duration } = req.body ?? {};

  if (
    typeof appointmentId !== "string" || !appointmentId ||
    typeof clientName !== "string" || !clientName ||
    typeof phone !== "string" || !phone ||
    typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    typeof time !== "string" || !/^\d{2}:\d{2}$/.test(time) ||
    typeof duration !== "number" || !Number.isInteger(duration) || duration <= 0
  ) {
    res.status(400).json({ error: "bad_request", message: "Invalid body" });
    return;
  }

  await db
    .update(smsQueueTable)
    .set({ cancelled: true })
    .where(eq(smsQueueTable.appointmentId, appointmentId));

  const confirmScheduledAt = new Date(Date.now() + 1 * 60 * 1000);

  await db.insert(smsQueueTable).values({
    appointmentId,
    clientName,
    phone,
    date,
    time,
    duration,
    confirmScheduledAt,
  });

  console.log(`[SMS] Scheduled for appointment ${appointmentId} (${clientName}, ${date} ${time})`);
  res.json({ ok: true });
});

router.delete("/cancel/:appointmentId", async (req: Request, res: Response) => {
  const { appointmentId } = req.params;
  await db
    .update(smsQueueTable)
    .set({ cancelled: true })
    .where(eq(smsQueueTable.appointmentId, appointmentId));
  console.log(`[SMS] Cancelled for appointment ${appointmentId}`);
  res.json({ ok: true });
});

export default router;
