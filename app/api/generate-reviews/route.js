import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase-admin";

const FREE_MONTHLY_LIMIT = 10;

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, message: "OPENAI_API_KEY is not set." }, { status: 503 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, message: "Supabase admin client not configured." }, { status: 500 });

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const { businessId, rating, aspects } = body;
  if (!businessId || typeof businessId !== "string")
    return NextResponse.json({ ok: false, message: "businessId required." }, { status: 400 });

  const stars = Number(rating);
  if (!Number.isInteger(stars) || stars < 3 || stars > 5)
    return NextResponse.json({ ok: false, message: "Rating must be 3, 4, or 5." }, { status: 400 });

  const tags = Array.isArray(aspects) ? aspects.filter(a => typeof a === "string") : [];

  const { data: biz, error } = await admin
    .from("businesses")
    .select("name, address, gmb_link, keywords, products, plan, business_type, business_category")
    .eq("id", businessId)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  if (!biz) return NextResponse.json({ ok: false, message: "Business not found." }, { status: 404 });

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

  const businessTypeLabel = biz.business_type === "other"
    ? (biz.business_category || "business")
    : biz.business_type || "restaurant";

  const aspectLabel = tags.length ? tags.join(", ") : "overall experience";
  const ratingWord = stars === 5 ? "absolutely loved" : stars === 4 ? "really enjoyed" : "had a good experience at";

  const systemPrompt = `You are a real customer writing a genuine Google Maps review. You write in natural, conversational Indian English — the way a real person would type on their phone. Your reviews feel authentic, varied, and human.

STRICT RULES:
- Output ONLY valid JSON: { "reviews": ["review1", "review2", "review3"] }
- Each review must be COMPLETELY DIFFERENT in structure, tone, opening, and style
- Review 1: casual and short (1-2 sentences, like someone typed it quickly on their phone)
- Review 2: detailed and specific (3-4 sentences, mentions specific aspects or items)
- Review 3: story-like or emotional (2-3 sentences, personal feel, recommendation)
- Never start two reviews with the same word or phrase
- Never use the same sentence structure twice
- Use natural Indian English — mix of formal and casual is fine
- Occasionally use phrases like "honestly", "must say", "totally", "definitely", "hands down"
- Weave in SEO keywords and products ONLY if they fit naturally — never force them
- No hashtags, no emojis, no AI mentions, no mention of QR or prompts
- No corporate language like "exceptional", "impeccable", "delightful experience"
- Sound like a real person, not a marketing brochure
- Match the review context to the business type`;

  const userPrompt = `Write 3 Google reviews for this business:

Business name: ${biz.name}
Business type: ${businessTypeLabel}
Location: ${biz.address || "India"}
Star rating given: ${stars} stars
Customer highlighted: ${aspectLabel}
SEO keywords (use naturally if possible): ${biz.keywords || "none"}
Featured items to mention (only if fits naturally): ${biz.products || "none"}

The customer ${ratingWord} ${biz.name}. Make each review feel like it was written by a different person:
- Review 1: A busy person who types quickly — short, punchy, direct
- Review 2: A detailed person who explains their experience — specific, informative
- Review 3: An emotional person who wants to recommend — warm, personal, encouraging

All 3 must sound like genuine ${businessTypeLabel} customers, not marketing copy.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 1.0,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
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