import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

// Confirmed from https://smsplanet.pl/doc/slate/index.html
// POST https://api2.smsplanet.pl/sms
// Content-Type: application/x-www-form-urlencoded
// Authorization: Bearer TOKEN
// Body params: from, to, msg   (NOT "message", NOT JSON)
const SMSPLANET_URL = "https://api2.smsplanet.pl/sms";

function normalizePhone(raw: string): string {
  let p = raw.replace(/[\s\-]/g, "").replace(/^\+/, "");
  if (p.length === 9) p = "48" + p;
  return p;
}

router.post("/", async (req: Request, res: Response) => {
  console.log("[SMSPlanet] ▶ /api/test-smsplanet hit — body:", JSON.stringify(req.body));

  const { phone, message } = req.body ?? {};

  if (typeof phone !== "string" || !phone || typeof message !== "string" || !message) {
    res.status(400).json({ error: "bad_request", message: "phone and message required" });
    return;
  }

  // ── Token check ─────────────────────────────────────────────────────────────
  const token = process.env.SMSPLANET_TOKEN;
  console.log("[SMSPlanet] token present :", token ? `YES (${token.length} chars)` : "NO — SMSPLANET_TOKEN not set");
  if (!token) {
    res.status(500).json({ ok: false, error: "SMSPLANET_TOKEN not set in environment" });
    return;
  }

  // ── Phone normalisation ──────────────────────────────────────────────────────
  const rawPhone        = phone;
  const normalizedPhone = normalizePhone(rawPhone);

  // ── Build form-encoded body (required by SMSPlanet — NOT JSON) ───────────────
  const formBody = new URLSearchParams({
    from: "TEST",
    to:   normalizedPhone,
    msg:  message,          // ← correct field name is "msg", not "message"
  });

  console.log("[SMSPlanet] endpoint URL  :", SMSPLANET_URL);
  console.log("[SMSPlanet] raw phone     :", rawPhone);
  console.log("[SMSPlanet] normalized    :", normalizedPhone);
  console.log("[SMSPlanet] content-type  : application/x-www-form-urlencoded");
  console.log("[SMSPlanet] form body     :", formBody.toString());

  let httpStatus: number | null   = null;
  let contentType                 = "";
  let responseBody                = "";

  try {
    const apiRes = await fetch(SMSPLANET_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${token}`,
      },
      body: formBody.toString(),
    });

    httpStatus   = apiRes.status;
    contentType  = apiRes.headers.get("content-type") ?? "";
    responseBody = await apiRes.text();

    console.log("[SMSPlanet] HTTP status   :", httpStatus);
    console.log("[SMSPlanet] content-type  :", contentType);
    console.log("[SMSPlanet] response body :", responseBody);

    // Treat HTML response as an error — real API always returns JSON
    if (contentType.includes("text/html")) {
      console.error("[SMSPlanet] ✗ Got HTML back — endpoint or auth is wrong");
      res.json({
        ok:              false,
        normalizedPhone,
        httpStatus,
        contentType,
        responseRaw:     responseBody.slice(0, 400),
        error:           "Got HTML instead of JSON — check URL or auth",
      });
      return;
    }

    let parsed: unknown;
    try { parsed = JSON.parse(responseBody); } catch { parsed = responseBody; }

    const isSuccess = apiRes.ok && !contentType.includes("text/html");
    console.log(isSuccess ? "[SMSPlanet] ✓ Success" : "[SMSPlanet] ✗ API error");

    res.json({
      ok:              isSuccess,
      normalizedPhone,
      httpStatus,
      contentType,
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
      contentType,
      responseRaw:     responseBody,
      error:           errText,
    });
  }
});

export default router;
