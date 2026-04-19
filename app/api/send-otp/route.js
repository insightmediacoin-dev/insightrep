import { NextResponse } from "next/server";
import { isIndiaPhone } from "@/lib/phone";

/**
 * When MSG91_AUTH_KEY is set, wire your template in the MSG91 dashboard and
 * extend this route to call their API. Until then, OTP verification accepts
 * the test code 123456 from /api/verify-otp.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const { phone } = body;
  if (!phone || !isIndiaPhone(phone)) {
    return NextResponse.json(
      { ok: false, message: "Valid +91 mobile number required." },
      { status: 400 },
    );
  }

  const smsConfigured = Boolean(process.env.MSG91_AUTH_KEY);

  return NextResponse.json({
    ok: true,
    smsConfigured,
    hint: smsConfigured
      ? "MSG91 is configured — connect this route to your OTP template in MSG91."
      : "Test mode: use OTP 123456",
  });
}
