import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

const CRON_SECRET = process.env.CRON_SECRET ?? "insightrep_cron_2026";

export async function GET(request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, message: "Admin client not configured." }, { status: 500 });

  // Find all active businesses where plan_expires_at has passed
  const { data: expired, error } = await admin
    .from("businesses")
    .select("id, name, owner_phone")
    .eq("status", "active")
    .lt("plan_expires_at", new Date().toISOString())
    .not("plan_expires_at", "is", null);

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

  if (!expired || expired.length === 0) {
    return NextResponse.json({ ok: true, expired: 0, message: "No businesses to expire." });
  }

  // Set them all to expired
  const ids = expired.map(b => b.id);
  const { error: updateError } = await admin
    .from("businesses")
    .update({ status: "expired" })
    .in("id", ids);

  if (updateError) return NextResponse.json({ ok: false, message: updateError.message }, { status: 500 });

  console.log(`[auto-expire] Expired ${expired.length} businesses:`, expired.map(b => b.name));

  return NextResponse.json({
    ok: true,
    expired: expired.length,
    businesses: expired.map(b => ({ id: b.id, name: b.name })),
  });
}