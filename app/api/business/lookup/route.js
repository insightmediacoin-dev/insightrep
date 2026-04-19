import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { isValidOwnerIdentifier } from "@/lib/phone";

const BUSINESS_COLUMNS =
  "id, created_at, owner_phone, name, address, gmb_link, keywords, products, plan";

export async function GET(request) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, message: "Supabase admin client not configured." }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const identifier = String(searchParams.get("identifier") ?? searchParams.get("phone") ?? "").trim().toLowerCase();
  if (!isValidOwnerIdentifier(identifier)) return NextResponse.json({ ok: false, message: "Invalid identifier." }, { status: 400 });

  const { data, error } = await admin.from("businesses").select(BUSINESS_COLUMNS).eq("owner_phone", identifier).maybeSingle();
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });

  return NextResponse.json({ ok: true, business: data });
}
