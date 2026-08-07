import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { isValidOwnerIdentifier, isValidEmail } from "@/lib/phone";
import { Resend } from "resend";
import OpenAI from "openai";
import crypto from "crypto";

const CATEGORY_MAP = {
  restaurant: "food",
  cafe: "food",
  bakery: "food",
  fastfood: "food",
  dhaba: "food",
  hotel: "hospitality",
  bar: "hospitality",
  lounge: "hospitality",
  salon: "beauty",
  gym: "fitness",
  clinic: "healthcare",
  retail: "retail",
  agency: "agency",
  education: "education",
  travel: "travel",
  other: "other",
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPERIENCE CHIP GENERATION
// One general chip (overall vibe) + up to 5 product-specific chips.
// Only called when business_type / products / keywords / description changes.
// ─────────────────────────────────────────────────────────────────────────────

function hashChipInputs(input) {
  return crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

async function generateExperienceChips(openai, { businessType, businessCategory, description, products, keywords }) {
  if (!openai) return null;

  const productList = products.length ? products.join(", ") : "";
  const keywordList = keywords.length ? keywords.join(", ") : "";

  const prompt = `You generate short customer-facing "mood chips" for a Google review collection app. A customer scans a QR code and taps one chip describing their visit before an AI writes their review — so chips must be SPECIFIC to this exact business, not generic.

BUSINESS TYPE: ${businessType}
CATEGORY: ${businessCategory}
DESCRIPTION: ${description || "Not provided"}
FEATURED PRODUCTS/SERVICES: ${productList || "None listed"}
SEO KEYWORDS: ${keywordList || "None listed"}

Generate chips in this exact structure:

1. Exactly ONE "general" chip — captures the overall experience at THIS business specifically (use the description/category, not a generic template). id must be "general".

2. One PRODUCT-SPECIFIC chip per item in FEATURED PRODUCTS/SERVICES, up to a maximum of 5. Each chip must reference that exact product/service by name. If fewer than 5 products are listed, generate exactly that many product chips — do not pad with invented products. If NO products are listed, generate up to 3 chips instead based on the description and keywords, focused on distinct aspects of the business (not products).

For EVERY chip, return:
- "id": short lowercase snake_case unique id (e.g. "orthopedic_mattress")
- "label": 2-4 word button label shown to the customer (e.g. "Orthopedic Mattress")
- "icon": one relevant emoji
- "desc": 3-6 word description shown under the label (e.g. "Loved the back support")
- "aspects": array of 2-3 short aspect words for internal AI use (e.g. ["Comfort","Back support","Product quality"])
- "moodLabel": one natural lowercase sentence describing this visit reason, used internally to seed the review-writing AI (e.g. "purchased the orthopedic mattress and loved the back support and comfort")

Return ONLY valid JSON, no markdown, no explanation:
{ "chips": [ { "id": "...", "label": "...", "icon": "...", "desc": "...", "aspects": ["..."], "moodLabel": "..." } ] }`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.6,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.chips) || parsed.chips.length === 0) return null;

    // Ensure general chip is first
    const chips = parsed.chips.slice(0, 6);
    const generalIdx = chips.findIndex((c) => c.id === "general");
    if (generalIdx > 0) {
      const [general] = chips.splice(generalIdx, 1);
      chips.unshift(general);
    }

    return chips;
  } catch {
    return null; // Fail silently — page.js falls back to static chips
  }
}

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

  // business_type is required, never silently defaults
  const normalizedType = String(business_type ?? "").trim().toLowerCase();
  if (!normalizedType) {
    return NextResponse.json({ ok: false, message: "Business type is required." }, { status: 400 });
  }

  const normalizedCategory =
    (business_category && String(business_category).trim()) ||
    CATEGORY_MAP[normalizedType] ||
    "other";

  const descriptionTrimmed = String(body.description ?? "").trim();
  const productsTrimmed    = String(products ?? "").trim();
  const keywordsTrimmed    = String(keywords ?? "").trim();
  const productsArr = productsTrimmed ? productsTrimmed.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const keywordsArr = keywordsTrimmed ? keywordsTrimmed.split(",").map((s) => s.trim()).filter(Boolean) : [];

  // Check if business exists — also pull existing chip hash to avoid regenerating unnecessarily
  const { data: existing } = await admin
    .from("businesses")
    .select("id, experience_chips_hash")
    .eq("owner_phone", ownerIdentifier)
    .maybeSingle();

  const isNewBusiness = !existing;

  const row = {
    owner_phone:       ownerIdentifier,
    name:              businessName.trim(),
    address:           String(address ?? "").trim(),
    locality:          String(body.locality ?? "").trim(),
    gmb_link:          gmbLink.trim(),
    keywords:          keywordsTrimmed,
    products:          productsTrimmed,
    plan:              typeof plan === "string" && plan.trim() ? plan.trim() : "free",
    business_type:     normalizedType,
    business_category: normalizedCategory,
    description:       descriptionTrimmed,
    dining_vibe:       String(body.dining_vibe ?? "").trim(),
    price_range:       String(body.price_range ?? "").trim(),
    customer_profiles: String(body.customer_profiles ?? "").trim(),
    special_features:  String(body.special_features ?? "").trim(),
  };

  // ── Experience chip generation — only regenerate if inputs actually changed ──
  const chipHash = hashChipInputs({
    businessType: normalizedType,
    businessCategory: normalizedCategory,
    description: descriptionTrimmed,
    products: productsArr,
    keywords: keywordsArr,
  });

  const needsChipGeneration = isNewBusiness || chipHash !== existing?.experience_chips_hash;

  if (needsChipGeneration) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      const openai = new OpenAI({ apiKey });
      const chips = await generateExperienceChips(openai, {
        businessType: normalizedType,
        businessCategory: normalizedCategory,
        description: descriptionTrimmed,
        products: productsArr,
        keywords: keywordsArr,
      });
      if (chips) {
        row.experience_chips      = { chips, generatedAt: new Date().toISOString() };
        row.experience_chips_hash = chipHash;
      }
      // If generation fails, we simply don't touch experience_chips —
      // existing chips (or null → static fallback) stay in place.
    }
  }

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