import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { isValidEmail } from "@/lib/phone";

export async function POST(request) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, message: "Supabase admin client not configured." }, { status: 500 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 }); }

  const email = String(body.email ?? "").trim().toLowerCase();
  const otp = String(body.otp ?? "").replace(/\D/g, "");
  if (!isValidEmail(email)) return NextResponse.json({ ok: false, message: "Valid email required." }, { status: 400 });
  if (otp.length !== 6) return NextResponse.json({ ok: false, message: "OTP required." }, { status: 400 });

  const { data, error } = await admin.from("otp_store").select("otp, expires_at").eq("identifier", email).maybeSingle();
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, message: "OTP not found." }, { status: 401 });
  if (data.otp !== otp) return NextResponse.json({ ok: false, message: "Invalid OTP." }, { status: 401 });
  if (new Date(data.expires_at).getTime() < Date.now()) return NextResponse.json({ ok: false, message: "OTP expired." }, { status: 401 });

  await admin.from("otp_store").delete().eq("identifier", email);
  return NextResponse.json({ ok: true });
}
