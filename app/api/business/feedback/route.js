import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request) {
  try {
    const { businessId, rating, feedback } = await request.json();
    if (!businessId || !rating) return NextResponse.json({ ok: false, message: "Missing fields." }, { status: 400 });
    if (rating > 2) return NextResponse.json({ ok: false, message: "Only for low ratings." }, { status: 400 });
    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ ok: false, message: "Server error." }, { status: 500 });
    const { error } = await admin.from("feedbacks").insert({
      business_id: businessId,
      rating,
      feedback: feedback ? String(feedback).slice(0, 300) : null,
    });
    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    if (!businessId) return NextResponse.json({ ok: false, message: "Missing businessId." }, { status: 400 });
    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ ok: false, message: "Server error." }, { status: 500 });
    const { data, error } = await admin
      .from("feedbacks")
      .select("id, rating, feedback, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, feedbacks: data ?? [] });
  } catch (err) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
