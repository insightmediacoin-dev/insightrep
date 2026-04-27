import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase-admin";

const FREE_MONTHLY_LIMIT = 10;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const PERSONA_SETS = [
  {
    p1: "A young local who keeps reviews short and honest. 1-2 sentences max. Casual tone, no fluff.",
    p2: "A working professional who visits restaurants regularly. Writes 3-4 sentences. Mentions specific details — what they ordered, how the service was, whether they'd return.",
    p3: "Someone who came with family or friends. Warm but honest. 2-3 sentences. Shares personal context and gives a clear verdict.",
  },
  {
    p1: "A regular diner who gives straight opinions. 1-2 punchy sentences. Direct and confident.",
    p2: "A first-time visitor who researched before coming. 3-4 sentences. Shares whether it matched expectations, what stood out good or bad.",
    p3: "Someone who had a mixed or memorable experience. 2-3 sentences. Personal angle, honest conclusion.",
  },
  {
    p1: "A college student who reviews quickly from their phone. 1-2 sentences. Real language, no corporate tone.",
    p2: "A detail-focused reviewer. 3-4 sentences. Notes specific things: wait time, food quality, staff attitude, value.",
    p3: "Someone celebrating or visiting for a reason. 2-3 sentences. Emotional but grounded. Honest recommendation.",
  },
];

const TONE_BY_STARS = {
  5: {
    overall: "The customer had an excellent experience and wants to strongly recommend this place.",
    sentiment: "enthusiastic and positive — they loved everything",
    honesty: "No negatives needed. Pure recommendation.",
    closingStyle: "Strong 'must visit' recommendation.",
  },
  4: {
    overall: "The customer had a really good experience with one small thing that could be better.",
    sentiment: "positive but grounded — enjoyed it, one minor note",
    honesty: "Mostly positive. One small constructive observation is fine but not required.",
    closingStyle: "Recommend it, with slight nuance.",
  },
  3: {
    overall: "The customer had a decent but imperfect experience. They see potential but had clear issues.",
    sentiment: "honest and balanced — some good, some not so good",
    honesty: "Be honest. Mention what was good AND what needs improvement. Do NOT write falsely positive reviews for 3-star experiences. The review should reflect real mixed feelings.",
    closingStyle: "Cautious recommendation — 'worth trying but...' or 'could be better'.",
  },
};

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, message: "OPENAI_API_KEY is not set." }, { status: 503 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, message: "Supabase admin client not configured." }, { status: 500 });

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const { businessId, rating, aspects, customNote } = body;
  if (!businessId || typeof businessId !== "string")
    return NextResponse.json({ ok: false, message: "businessId required." }, { status: 400 });

  const stars = Number(rating);
  if (!Number.isInteger(stars) || stars < 3 || stars > 5)
    return NextResponse.json({ ok: false, message: "Rating must be 3, 4, or 5." }, { status: 400 });

  const tags = Array.isArray(aspects) ? aspects.filter(a => typeof a === "string") : [];
  const customerNote = typeof customNote === "string" ? customNote.trim().slice(0, 300) : "";

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

  const exactBusinessName = biz.name.trim();
  const businessTypeLabel = biz.business_type === "other"
    ? (biz.business_category || "business")
    : biz.business_type || "restaurant";

  const featuredProducts = biz.products
    ? biz.products.split(",").map(p => p.trim()).filter(Boolean)
    : [];

  const keywords = biz.keywords
    ? biz.keywords.split(",").map(k => k.trim()).filter(Boolean)
    : [];

  const cityName = biz.address
    ? biz.address.split(",").slice(-2).join(",").trim()
    : "India";

  const aspectLabel = tags.length ? tags.join(", ") : "overall experience";
  const tone = TONE_BY_STARS[stars];
  const personas = pick(PERSONA_SETS);

  // Customer note takes full priority over product list for food mentions
  const customerMentionedFood = customerNote.length > 0;
  const productGuidance = customerMentionedFood
    ? `The customer mentioned specific details in their note. Do NOT reference any product from the profile — only use what the customer said.`
    : featuredProducts.length > 0
      ? `You may mention ONE product from this list only if it fits naturally in the review: [${featuredProducts.join(", ")}]. Never force it. Never mention more than one per review.`
      : `Do not mention any specific dish or product names.`;

  // Keyword guidance — natural context, never dropped in raw
  const keywordGuidance = keywords.length > 0
    ? `SEO keywords to include naturally (1 per review max, only if it fits as part of a real sentence — never as a standalone phrase or title case label): ${keywords.join(", ")}`
    : `No keywords provided. Just use the business name and city naturally.`;

  const systemPrompt = `You write authentic Google Maps reviews for local businesses in India. Your reviews must read as if written by real customers — not AI, not a marketing agency.

ABSOLUTE RULES — NEVER BREAK:
1. Business name: "${exactBusinessName}" — use EXACTLY this every time, never shorten or alter
2. Output ONLY valid JSON: { "reviews": ["r1", "r2", "r3"] }
3. BANNED words and phrases: exceptional, impeccable, delightful, exquisite, commendable, vibrant, cozy, nestled, testament, gem, hidden gem, best restaurant in [city] (as a label), best bar in [city] (as a label). Never use keywords as title-case labels — only as natural sentence fragments.
4. No hashtags, no emojis, no mention of apps or QR codes
5. Never start two reviews with the same word
6. Never contradict the star rating — a 3-star review must NOT read like a 5-star review
7. ${productGuidance}
8. CUSTOMER NOTE IS MANDATORY: If provided, the exact details (dish, wait time, incident) MUST appear naturally in at least 2 of 3 reviews. Do not ignore or generalize.
9. ${keywordGuidance}
10. Never use city abbreviations — write the full city name or skip it`;

  const userPrompt = `Write 3 Google Maps reviews for ${exactBusinessName}, a ${businessTypeLabel} in ${cityName}.

STAR RATING: ${stars}/5
TONE REQUIRED: ${tone.sentiment}
SITUATION: ${tone.overall}
HONESTY LEVEL: ${tone.honesty}
CLOSING STYLE: ${tone.closingStyle}

CUSTOMER HIGHLIGHTED: ${aspectLabel}
${customerNote ? `
CUSTOMER'S EXACT EXPERIENCE — USE THESE DETAILS IN AT LEAST 2 REVIEWS:
"${customerNote}"
Reference the specific details from this note authentically. If they mentioned a wait time, use it. If they mentioned a dish, use that exact name.
` : ""}

Write each review as a completely different type of person:

Review 1 — ${personas.p1}
Review 2 — ${personas.p2}  
Review 3 — ${personas.p3}

FINAL CHECK before outputting: Read each review. Ask — does this match a ${stars}-star experience? Does it sound like a real person wrote it? Is the tone consistent with the rating? If not, rewrite before outputting.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.92,
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