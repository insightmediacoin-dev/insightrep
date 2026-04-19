import { NextResponse } from "next/server";
import { isIndiaPhone } from "@/lib/phone";

const TEST_OTP = "123456";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const { phone, otp } = body;
  if (!phone || !isIndiaPhone(phone)) {
    return NextResponse.json(
      { ok: false, message: "Valid +91 mobile number required." },
      { status: 400 },
    );
  }

  const code = String(otp ?? "").replace(/\D/g, "");
  if (!code) {
    return NextResponse.json({ ok: false, message: "OTP required." }, { status: 400 });
  }

  if (code === TEST_OTP) {
    return NextResponse.json({ ok: true, testMode: true });
  }

  return NextResponse.json(
    {
      ok: false,
      message:
        "Invalid OTP. In test mode use 123456, or plug MSG91 verification here.",
    },
    { status: 401 },
  );
}
