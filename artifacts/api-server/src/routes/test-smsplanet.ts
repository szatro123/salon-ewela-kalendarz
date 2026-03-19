import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const SMSPLANET_URL = "https://api2.smsplanet.pl/sms";

function normalizePhone(raw: string): string {
  let p = raw.replace(/[\s\-]/g, "").replace(/^\+/, "");
  if (p.length === 9) p = "48" + p;
  return p;
}

router.post("/", async (req: Request, res: Response) => {
  const { phone, message } = req.body ?? {};

  if (typeof phone !== "string" || !phone || typeof message !== "string" || !message) {
    res.status(400).json({ error: "bad_request", message: "phone and message required" });
    return;
  }

  // ── Token check ────────────────────────────────────────────────────────────
  const token = process.env.SMSPLANET_TOKEN;
  console.log("[SMSPlanet] token present :", token ? "YES (" + token.length + " chars)" : "NO — SMSPLANET_TOKEN not set");
  if (!token) {
    res.status(500).json({ ok: false, error: "SMSPLANET_TOKEN not set in environment" });
    return;
  }

  // ── Phone normalisation ────────────────────────────────────────────────────
  const rawPhone        = phone;
  const normalizedPhone = normalizePhone(rawPhone);

  // ── Request body (token goes in Authorization header only) ─────────────────
  const requestBody = {
    from:    "TEST",
    to:      normalizedPhone,
    message: message,
  };

  console.log("[SMSPlanet] endpoint URL  :", SMSPLANET_URL);
  console.log("[SMSPlanet] raw phone     :", rawPhone);
  console.log("[SMSPlanet] normalized    :", normalizedPhone);
  console.log("[SMSPlanet] sender (from) :", requestBody.from);
  console.log("[SMSPlanet] message       :", message);
  console.log("[SMSPlanet] request body  :", JSON.stringify(requestBody));

  let httpStatus: number | null = null;
  let responseBody              = "";

  try {
    const apiRes = await fetch(SMSPLANET_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    httpStatus   = apiRes.status;
    responseBody = await apiRes.text();

    console.log("[SMSPlanet] HTTP status   :", httpStatus);
    console.log("[SMSPlanet] response body :", responseBody);

    let parsed: unknown;
    try { parsed = JSON.parse(responseBody); } catch { parsed = responseBody; }

    res.json({
      ok:              apiRes.ok,
      normalizedPhone,
      httpStatus,
      responseRaw:     responseBody,
      response:        parsed,
    });

  } catch (err) {
    const errText = err instanceof Error ? err.message : String(err);
    console.error("[SMSPlanet] thrown error  :", errText);
    res.status(500).json({
      ok:              false,
      normalizedPhone,
      httpStatus,
      responseRaw:     responseBody,
      error:           errText,
    });
  }
});

export default router;
