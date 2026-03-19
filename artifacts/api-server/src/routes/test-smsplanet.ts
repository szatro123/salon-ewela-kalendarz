import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

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

  const token = process.env.SMSPLANET_TOKEN;
  if (!token) {
    res.status(500).json({ error: "SMSPLANET_TOKEN not set" });
    return;
  }

  const rawPhone = phone;
  const normalizedPhone = normalizePhone(rawPhone);

  const requestBody = {
    token,
    to: normalizedPhone,
    message,
    sender: "TEST",
  };

  console.log("[SMSPlanet] raw phone     :", rawPhone);
  console.log("[SMSPlanet] normalized    :", normalizedPhone);
  console.log("[SMSPlanet] request body  :", JSON.stringify({ ...requestBody, token: "***" }));

  let httpStatus: number | null = null;
  let responseBody: string | null = null;

  try {
    const apiRes = await fetch("https://api2.smsplanet.pl/sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    httpStatus = apiRes.status;
    responseBody = await apiRes.text();

    console.log("[SMSPlanet] HTTP status   :", httpStatus);
    console.log("[SMSPlanet] response body :", responseBody);

    let parsed: unknown;
    try { parsed = JSON.parse(responseBody); } catch { parsed = responseBody; }

    res.json({ ok: apiRes.ok, normalizedPhone, httpStatus, response: parsed });
  } catch (err) {
    const errText = err instanceof Error ? err.message : String(err);
    console.error("[SMSPlanet] thrown error  :", errText);
    res.status(500).json({ ok: false, normalizedPhone, httpStatus, responseBody, error: errText });
  }
});

export default router;
