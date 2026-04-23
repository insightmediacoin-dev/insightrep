import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, message: "Supabase admin client not configured." }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const businessId = String(searchParams.get("businessId") ?? "").trim();
  if (!businessId) return NextResponse.json({ ok: false, message: "businessId required." }, { status: 400 });

  const [scansRes, reviewsRes] = await Promise.all([
    admin.from("qr_scans").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    admin.from("review_copies").select("id", { count: "exact", head: true }).eq("business_id", businessId),
  ]);

  return NextResponse.json({
    ok: true,
    scans: scansRes.count ?? 0,
    reviews: reviewsRes.count ?? 0,
  });
}