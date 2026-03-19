export async function sendSms(phone: string, message: string): Promise<void> {
  const token = process.env.SMSAPI_TOKEN;
  if (!token) {
    console.warn("[SMS] SMSAPI_TOKEN not set — skipping send to", phone);
    return;
  }

  const params = new URLSearchParams({ to: phone, message, format: "json" });

  try {
    const res = await fetch("https://api.smsapi.pl/sms.do", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json();
    console.log(`[SMS] Sent to ${phone}:`, JSON.stringify(data));
  } catch (err) {
    console.error(`[SMS] Failed to send to ${phone}:`, err);
  }
}
