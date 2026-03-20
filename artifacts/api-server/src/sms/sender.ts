// SMSPlanet API v2 — https://smsplanet.pl/doc/slate/index.html
// POST https://api2.smsplanet.pl/sms
// Content-Type: application/x-www-form-urlencoded
// Authorization: Bearer TOKEN
// Form fields: from, to, msg

const SMSPLANET_URL = "https://api2.smsplanet.pl/sms";
const SENDER        = "TEST";

export function normalizePhone(raw: string): string {
  // Strip spaces, dashes, dots, parentheses, leading + sign
  let p = raw.replace(/[\s\-\.\(\)]/g, "").replace(/^\+/, "");
  // Remove leading 0 (some Polish numbers entered as 0600111222)
  if (p.startsWith("0") && p.length === 10) p = p.slice(1);
  // Prepend 48 country code if 9 bare digits remain
  if (p.length === 9) p = "48" + p;
  return p;
}

function isValidNormalizedPhone(normalized: string): boolean {
  // Must be exactly 11 digits starting with 48
  return /^\d{11}$/.test(normalized) && normalized.startsWith("48");
}

export async function sendSms(opts: {
  appointmentId: string;
  type: "confirmation" | "reminder";
  rawPhone: string;
  message: string;
}): Promise<void> {
  const { appointmentId, type, rawPhone, message } = opts;

  const normalizedPhone = normalizePhone(rawPhone);

  if (!isValidNormalizedPhone(normalizedPhone)) {
    console.log(`[SMS] Invalid phone "${rawPhone}" (normalized: "${normalizedPhone}") — SMS skipped (${type}, appt: ${appointmentId})`);
    return;
  }

  const token = process.env.SMSPLANET_TOKEN;
  if (!token) {
    console.warn(`[SMS] SMSPLANET_TOKEN not set — skipping ${type} for ${appointmentId}`);
    return;
  }

  const formBody = new URLSearchParams({
    from: SENDER,
    to:   normalizedPhone,
    msg:  message,
  });

  console.log(`[SMS] ▶ ${type} | appt: ${appointmentId}`);
  console.log(`[SMS]   raw phone     : ${rawPhone}`);
  console.log(`[SMS]   normalized    : ${normalizedPhone}`);
  console.log(`[SMS]   sender        : ${SENDER}`);
  console.log(`[SMS]   message       : ${message}`);
  console.log(`[SMS]   endpoint      : ${SMSPLANET_URL}`);

  let httpStatus: number | null = null;
  let responseBody              = "";

  try {
    const res = await fetch(SMSPLANET_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${token}`,
      },
      body: formBody.toString(),
    });

    httpStatus   = res.status;
    responseBody = await res.text();

    const contentType = res.headers.get("content-type") ?? "";

    console.log(`[SMS]   HTTP status   : ${httpStatus}`);
    console.log(`[SMS]   response body : ${responseBody}`);

    if (contentType.includes("text/html")) {
      console.error(`[SMS] ✗ Got HTML — wrong endpoint or auth (${type}, appt: ${appointmentId})`);
      return;
    }

    if (res.ok) {
      console.log(`[SMS] ✓ ${type} sent to ${normalizedPhone} (appt: ${appointmentId})`);
    } else {
      console.error(`[SMS] ✗ API error for ${type} (appt: ${appointmentId}): ${responseBody}`);
    }
  } catch (err) {
    const errText = err instanceof Error ? err.message : String(err);
    console.error(`[SMS] ✗ Network error for ${type} (appt: ${appointmentId}): ${errText}`);
    console.error(`[SMS]   HTTP status so far: ${httpStatus}`);
  }
}
