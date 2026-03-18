import { Router, type IRouter } from "express";
import { db, appointmentsTable } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";
import {
  CreateAppointmentBody,
  UpdateAppointmentBody,
  ListAppointmentsQueryParams,
  GetAppointmentParams,
  UpdateAppointmentParams,
  DeleteAppointmentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

async function checkDoubleBooking(
  date: string,
  time: string,
  duration: number,
  excludeId?: number
): Promise<boolean> {
  const allOnDate = await db
    .select()
    .from(appointmentsTable)
    .where(
      excludeId !== undefined
        ? and(
            eq(appointmentsTable.date, date),
            ne(appointmentsTable.id, excludeId),
            ne(appointmentsTable.status, "cancelled"),
            ne(appointmentsTable.status, "no_show")
          )
        : and(
            eq(appointmentsTable.date, date),
            ne(appointmentsTable.status, "cancelled"),
            ne(appointmentsTable.status, "no_show")
          )
    );

  const newStart = timeToMinutes(time);
  const newEnd = newStart + duration;

  for (const appt of allOnDate) {
    const existStart = timeToMinutes(appt.time);
    const existEnd = existStart + appt.duration;
    if (newStart < existEnd && newEnd > existStart) {
      return true;
    }
  }
  return false;
}

router.get("/", async (req, res) => {
  const query = ListAppointmentsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "bad_request", message: "Invalid query params" });
    return;
  }

  let rows;
  if (query.data.date) {
    rows = await db
      .select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.date, query.data.date))
      .orderBy(appointmentsTable.time);
  } else {
    rows = await db
      .select()
      .from(appointmentsTable)
      .orderBy(appointmentsTable.date, appointmentsTable.time);
  }

  res.json(
    rows.map((r) => ({
      ...r,
      price: parseFloat(r.price),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
  );
});

router.post("/", async (req, res) => {
  const body = CreateAppointmentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "bad_request", message: "Invalid request body" });
    return;
  }

  const { clientName, phone, service, date, time, duration, price, notes, status } = body.data;

  const conflict = await checkDoubleBooking(date, time, duration);
  if (conflict) {
    res.status(409).json({
      error: "double_booking",
      message: "This time slot overlaps with an existing appointment.",
    });
    return;
  }

  const [created] = await db
    .insert(appointmentsTable)
    .values({
      clientName,
      phone,
      service,
      date,
      time,
      duration,
      price: String(price),
      notes: notes ?? null,
      status,
    })
    .returning();

  res.status(201).json({
    ...created,
    price: parseFloat(created.price),
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  });
});

router.get("/:id", async (req, res) => {
  const params = GetAppointmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "bad_request", message: "Invalid id" });
    return;
  }

  const [row] = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "not_found", message: "Appointment not found" });
    return;
  }

  res.json({
    ...row,
    price: parseFloat(row.price),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
});

router.put("/:id", async (req, res) => {
  const params = UpdateAppointmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "bad_request", message: "Invalid id" });
    return;
  }

  const body = UpdateAppointmentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "bad_request", message: "Invalid request body" });
    return;
  }

  const { clientName, phone, service, date, time, duration, price, notes, status } = body.data;

  const [existing] = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "not_found", message: "Appointment not found" });
    return;
  }

  const conflict = await checkDoubleBooking(date, time, duration, params.data.id);
  if (conflict) {
    res.status(409).json({
      error: "double_booking",
      message: "This time slot overlaps with an existing appointment.",
    });
    return;
  }

  const [updated] = await db
    .update(appointmentsTable)
    .set({
      clientName,
      phone,
      service,
      date,
      time,
      duration,
      price: String(price),
      notes: notes ?? null,
      status,
      updatedAt: new Date(),
    })
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  res.json({
    ...updated,
    price: parseFloat(updated.price),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

router.delete("/:id", async (req, res) => {
  const params = DeleteAppointmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "bad_request", message: "Invalid id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "not_found", message: "Appointment not found" });
    return;
  }

  await db.delete(appointmentsTable).where(eq(appointmentsTable.id, params.data.id));
  res.status(204).send();
});

export default router;
