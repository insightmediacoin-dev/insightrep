import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "577151032779";

export async function POST(request) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, message: "Admin client not configured." }, { status: 500 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 }); }

  const { businessId, action, adminSecret, planExpiresAt } = body;

  if (!ADMIN_SECRET || adminSecret !== ADMIN_SECRET) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  if (!businessId || !action) {
    return NextResponse.json({ ok: false, message: "businessId and action required." }, { status: 400 });
  }

  const validActions = ["active", "paused", "expired"];
  if (!validActions.includes(action)) {
    return NextResponse.json({ ok: false, message: "Invalid action." }, { status: 400 });
  }

  const updatePayload = { status: action };
  if (planExpiresAt) updatePayload.plan_expires_at = planExpiresAt;

  const { error } = await admin
    .from("businesses")
    .update(updatePayload)
    .eq("id", businessId);

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, businessId, status: action });
}