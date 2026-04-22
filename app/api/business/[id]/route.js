import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

const BUSINESS_COLUMNS =
  "id, created_at, owner_phone, name, address, gmb_link, keywords, products, plan, owner_name, owner_designation, owner_city, owner_whatsapp, business_type, business_category";
  
export async function GET(_request, context) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, message: "Supabase admin client not configured." },
      { status: 500 },
    );
  }

  const { id } = await context.params;

  const { data, error } = await admin
    .from("businesses")
    .select(BUSINESS_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, business: data });
}