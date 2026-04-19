import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { isValidOwnerIdentifier } from "@/lib/phone";

export async function POST(request) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, message: "Supabase admin client not configured." }, { status: 500 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 }); }

  const ownerIdentifier = String(body.owner_phone ?? body.phone ?? "").trim().toLowerCase();
  const businessName = body.name ?? body.business_name;
  const gmbLink = body.gmb_link ?? body.google_review_link;
  const keywords = body.keywords ?? body.seo_keywords;
  const products = body.products ?? body.featured_products;
  const { address, plan } = body;

  if (!isValidOwnerIdentifier(ownerIdentifier)) return NextResponse.json({ ok: false, message: "Valid owner identifier required." }, { status: 400 });
  if (!businessName || typeof businessName !== "string") return NextResponse.json({ ok: false, message: "Business name required." }, { status: 400 });
  if (!gmbLink || typeof gmbLink !== "string") return NextResponse.json({ ok: false, message: "GMB / Google review link required." }, { status: 400 });

  const row = { owner_phone: ownerIdentifier, name: businessName.trim(), address: String(address ?? "").trim(), gmb_link: gmbLink.trim(), keywords: String(keywords ?? "").trim(), products: String(products ?? "").trim(), plan: typeof plan === "string" && plan.trim() ? plan.trim() : "free" };

  const { data, error } = await admin.from("businesses").upsert(row, { onConflict: "owner_phone" }).select("id").single();
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, businessId: data.id });
}
