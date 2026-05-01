import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { isValidOwnerIdentifier, isValidEmail } from "@/lib/phone";
import { Resend } from "resend";

export async function POST(request) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, message: "Supabase admin client not configured." }, { status: 500 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 }); }

  const ownerIdentifier  = String(body.owner_phone ?? body.phone ?? "").trim().toLowerCase();
  const businessName     = body.name ?? body.business_name;
  const gmbLink          = body.gmb_link ?? body.google_review_link;
  const keywords         = body.keywords ?? body.seo_keywords;
  const products         = body.products ?? body.featured_products;
  const { address, plan, business_type, business_category } = body;

  if (!isValidOwnerIdentifier(ownerIdentifier)) return NextResponse.json({ ok: false, message: "Valid owner identifier required." }, { status: 400 });
  if (!businessName || typeof businessName !== "string") return NextResponse.json({ ok: false, message: "Business name required." }, { status: 400 });
  if (!gmbLink || typeof gmbLink !== "string") return NextResponse.json({ ok: false, message: "GMB / Google review link required." }, { status: 400 });

  // Check if business exists
  const { data: existing } = await admin
    .from("businesses")
    .select("id")
    .eq("owner_phone", ownerIdentifier)
    .maybeSingle();

  const isNewBusiness = !existing;

  const row = {
    owner_phone:       ownerIdentifier,
    name:              businessName.trim(),
    address:           String(address ?? "").trim(),
    locality:          String(body.locality ?? "").trim(),
    gmb_link:          gmbLink.trim(),
    keywords:          String(keywords ?? "").trim(),
    products:          String(products ?? "").trim(),
    plan:              typeof plan === "string" && plan.trim() ? plan.trim() : "free",
    business_type:     business_type ?? "restaurant",
    business_category: String(business_category ?? "").trim(),
    // ── NEW FIELDS ──────────────────────────────────────────────────────────
    description:       String(body.description ?? "").trim(),
    dining_vibe:       String(body.dining_vibe ?? "").trim(),
    price_range:       String(body.price_range ?? "").trim(),
    customer_profiles: String(body.customer_profiles ?? "").trim(),
    special_features:  String(body.special_features ?? "").trim(),
  };

  let data, error;

  if (isNewBusiness) {
    const result = await admin.from("businesses").insert(row).select("id").single();
    data  = result.data;
    error = result.error;
  } else {
    const result = await admin
      .from("businesses")
      .update(row)
      .eq("owner_phone", ownerIdentifier)
      .select("id")
      .single();
    data  = result.data;
    error = result.error;
  }

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

  // Send welcome email only for new signups with email identifier
  if (isNewBusiness && isValidEmail(ownerIdentifier)) {
    const resendKey  = process.env.RESEND_API_KEY;
    const fromEmail  = process.env.RESEND_FROM_EMAIL ?? "InsightRep <noreply@insightmedia.co.in>";

    if (resendKey) {
      const resend    = new Resend(resendKey);

      await resend.emails.send({
        from:    fromEmail,
        to:      [ownerIdentifier],
        subject: `Welcome to InsightRep, ${businessName.trim()}!`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0f1729;color:#fff;border-radius:16px;overflow:hidden">
            <div style="background:#E5322D;padding:24px 32px">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;color:#fff;opacity:0.8">INSIGHTREP</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:800;color:#fff">You are live!</h1>
            </div>
            <div style="padding:32px">
              <p style="margin:0 0 8px;color:#aaa;font-size:14px">Hi there,</p>
              <p style="margin:0 0 24px;color:#fff;font-size:15px">Welcome to InsightRep! <strong>${businessName.trim()}</strong> is now set up and ready to collect Google reviews.</p>
              <div style="background:#1a2540;border-radius:12px;padding:20px;margin-bottom:24px">
                <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#E5322D;text-transform:uppercase;letter-spacing:1px">Your next steps</p>
                <ol style="margin:0;padding-left:20px;color:#ccc;font-size:14px;line-height:2">
                  <li>Download your QR code from the dashboard</li>
                  <li>Print it and place it at your counter or tables</li>
                  <li>Your customers scan it and leave reviews in 60 seconds</li>
                </ol>
              </div>
              <a href="https://qr.insightmedia.co.in/dashboard" style="display:block;background:#E5322D;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:50px;font-weight:700;font-size:14px;margin-bottom:16px">Go to Dashboard</a>
              <p style="margin:24px 0 0;font-size:11px;color:#555;text-align:center">InsightRep · By Insight Media · Chh. Sambhajinagar</p>
            </div>
          </div>
        `,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true, businessId: data.id });
}
