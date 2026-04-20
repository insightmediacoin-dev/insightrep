import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase-admin";
import { isValidEmail } from "@/lib/phone";

const TTL_MINUTES = 10;

export async function POST(request) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = 'InsightRep <noreply@insightmedia.co.in>';
  const admin = createAdminClient();

  if (!admin) return NextResponse.json({ ok: false, message: "Supabase admin client not configured." }, { status: 500 });
  if (!resendKey) return NextResponse.json({ ok: false, message: "RESEND_API_KEY not configured." }, { status: 500 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 }); }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) return NextResponse.json({ ok: false, message: "Valid email required." }, { status: 400 });

  const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000).toISOString();

  const { error: upsertError } = await admin.from("otp_store").upsert({ identifier: email, otp, expires_at: expiresAt }, { onConflict: "identifier" });
  if (upsertError) return NextResponse.json({ ok: false, message: upsertError.message }, { status: 500 });

  const resend = new Resend(resendKey);
  const { error: sendError } = await resend.emails.send({
    from: fromEmail,
    to: [email],
    subject: "Your InsightRep OTP",
    html: `<div style="font-family:Arial,sans-serif"><h2>Your InsightRep OTP</h2><p>Use this code to log in:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px">${otp}</p><p>This OTP expires in ${TTL_MINUTES} minutes.</p></div>`,
  });
  if (sendError) return NextResponse.json({ ok: false, message: sendError.message }, { status: 502 });

  return NextResponse.json({ ok: true });
}
