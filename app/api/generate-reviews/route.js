import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase-admin";

const ASPECTS = new Set(["food", "service", "products", "ambiance"]);
const FREE_MONTHLY_LIMIT = 10;

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, message: "OPENAI_API_KEY is not set." }, { status: 503 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Supabase admin client not configured." }, { status: 500 });
  }

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const { businessId, rating, aspects } = body;
  if (!businessId || typeof businessId !== "string") {
    return NextResponse.json({ ok: false, message: "businessId required." }, { status: 400 });
  }

  const stars = Number(rating);
  if (!Number.isInteger(stars) || stars < 3 || stars > 5) {
    return NextResponse.json({ ok: false, message: "Rating must be 3, 4, or 5." }, { status: 400 });
  }

  const tags = Array.isArray(aspects)
    ? aspects.filter((a) => typeof a === "string" && ASPECTS.has(a))
    : [];

  const { data: biz, error } = await admin
    .from("businesses")
    .select("name, address, gmb_link, keywords, products, plan")
    .eq("id", businessId)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  if (!biz) return NextResponse.json({ ok: false, message: "Business not found." }, { status: 404 });

  // ✅ Free plan limit check
  if (!biz.plan || biz.plan === "free") {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count } = await admin
      .from("review_copies")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("copied_at", monthStart.toISOString());

    if ((count ?? 0) >= FREE_MONTHLY_LIMIT) {
      return NextResponse.json({
        ok: false,
        message: `Free plan limit reached (${FREE_MONTHLY_LIMIT} reviews/month). Upgrade to continue.`,
        limitReached: true,
      }, { status: 403 });
    }
  }

  const openai = new OpenAI({ apiKey });

  const userPayload = {
    businessName: biz.name,
    area: biz.address,
    seoKeywords: biz.keywords,
    featuredProducts: biz.products,
    starRating: stars,
    highlightAspects: tags.length ? tags : ["overall experience"],
    count: 3,
    rules: [
      "Write exactly 3 different Google Maps style reviews as a satisfied customer.",
      "Each review 2–4 short sentences, first person, natural Indian English is fine.",
      "Weave in keywords and featured products only when they fit organically — never keyword-stuff.",
      "No hashtags, no emojis, no 'As an AI', no mention of QR codes or prompts.",
      "Sound like real diners or hotel guests in India.",
    ],
  };

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.85,
      messages: [
        {
          role: "system",
          content: "You only output valid JSON with a single key `reviews` whose value is an array of exactly 3 non-empty strings.",
        },
        {
          role: "user",
          content: JSON.stringify(userPayload),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return NextResponse.json({ ok: false, message: "Empty model response." }, { status: 502 });

    const parsed = JSON.parse(raw);
    const reviews = Array.isArray(parsed.reviews)
      ? parsed.reviews.map((r) => String(r).trim()).filter(Boolean)
      : [];

    if (reviews.length < 3) return NextResponse.json({ ok: false, message: "Model returned fewer than 3 reviews." }, { status: 502 });

    return NextResponse.json({ ok: true, reviews: reviews.slice(0, 3) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "OpenAI request failed";
    return NextResponse.json({ ok: false, message }, { status: 502 });
  }
}