export async function sendSms(phone: string, message: string): Promise<void> {
  const token = process.env.SMSAPI_TOKEN;
  if (!token) {
    console.warn("[SMS] SMSAPI_TOKEN not set — skipping send to", phone);
    return;
  }

  const params = new URLSearchParams({ to: phone, message, format: "json" });

  console.log(`[SMS] → Sending to: ${phone}`);

  let res: Response;
  let rawBody: string;

  try {
    res = await fetch("https://api.smsapi.pl/sms.do", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    rawBody = await res.text();
  } catch (err) {
    console.error(`[SMS] ✗ Network error sending to ${phone}:`, err);
    return;
  }

  console.log(`[SMS] HTTP ${res.status} for ${phone}`);

  try {
    const data = JSON.parse(rawBody);
    if (res.ok) {
      console.log(`[SMS] ✓ Success for ${phone}:`, JSON.stringify(data));
    } else {
      console.error(`[SMS] ✗ Error for ${phone}:`, JSON.stringify(data));
    }
  } catch {
    if (res.ok) {
      console.log(`[SMS] ✓ Success for ${phone} (raw):`, rawBody);
    } else {
      console.error(`[SMS] ✗ Error for ${phone} (raw):`, rawBody);
    }
  }
}
