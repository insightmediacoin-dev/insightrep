import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase-admin";

const FREE_MONTHLY_LIMIT = 10;

// Random pool helpers — picked at runtime so every generation is structurally different
const OPENERS = [
  "Was here last weekend and",
  "Visited with my family and",
  "Came here for lunch and",
  "Tried this place for the first time and",
  "Been meaning to visit for a while —",
  "Stopped by on a whim and",
  "Came here after work and",
  "Took my friends here and",
  "Had dinner here recently and",
  "Visited on a weekday evening and",
  "My colleague recommended this place —",
  "Finally tried this after seeing it online and",
];

const CLOSERS = [
  "Will definitely be back.",
  "Highly recommend if you're nearby.",
  "Worth a visit for sure.",
  "Would recommend to anyone in the area.",
  "10/10 would visit again.",
  "Solid spot — will return.",
  "One of my go-to places now.",
  "Good experience overall.",
  "Would not hesitate to come back.",
  "Definitely going back soon.",
];

const FILLER_PHRASES = [
  "what stood out was",
  "the highlight for me was",
  "honestly the best part was",
  "I particularly enjoyed",
  "worth mentioning is",
  "what really impressed me was",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

  const businessTypeLabel = biz.business_type === "other"
    ? (biz.business_category || "business")
    : biz.business_type || "restaurant";

  const exactBusinessName = biz.name.trim();
  const aspectLabel = tags.length ? tags.join(", ") : "overall experience";
  const ratingWord = stars === 5 ? "absolutely loved" : stars === 4 ? "really enjoyed" : "had a decent experience at";

  const featuredProducts = biz.products
    ? biz.products.split(",").map(p => p.trim()).filter(Boolean)
    : [];

  const keywords = biz.keywords
    ? biz.keywords.split(",").map(k => k.trim()).filter(Boolean)
    : [];

  const cityName = biz.address
    ? biz.address.split(",").slice(-2).join(",").trim()
    : "India";

  // Pick random variation seeds to force structural diversity
  const opener1 = pick(OPENERS);
  const opener2 = pick(OPENERS.filter(o => o !== opener1));
  const opener3 = pick(OPENERS.filter(o => o !== opener1 && o !== opener2));
  const closer1 = pick(CLOSERS);
  const closer2 = pick(CLOSERS.filter(c => c !== closer1));
  const closer3 = pick(CLOSERS.filter(c => c !== closer1 && c !== closer2));
  const filler1 = pick(FILLER_PHRASES);
  const filler2 = pick(FILLER_PHRASES.filter(f => f !== filler1));

  // Product guidance — only suggest if customer note doesn't override
  const productGuidance = featuredProducts.length > 0
    ? `You MAY reference one of these products IF it fits naturally and the customer note does not already mention a specific dish: [${featuredProducts.join(", ")}]. Never force a product mention. Never mention more than one product per review.`
    : `Do not mention any specific dish names — speak generally about the food.`;

  const systemPrompt = `You are a review-writing specialist who writes authentic, human Google reviews for local businesses. Your reviews must:

- Sound like they were written by real, different people on different days
- Vary completely in structure, vocabulary, sentence length, and emotional tone across all 3
- Be impossible to pattern-match or flag as AI-generated
- Include natural SEO signals without keyword stuffing

HARD RULES — NEVER BREAK:
1. Business name: "${exactBusinessName}" — use EXACTLY as written, every time
2. Output ONLY valid JSON: { "reviews": ["review1", "review2", "review3"] }
3. No corporate/AI words: exceptional, impeccable, delightful, exquisite, commendable, vibrant, testament
4. No hashtags, no emojis, no mention of QR codes or apps
5. Never start two reviews with the same word
6. Each review must feel written by a completely different person — different vocabulary level, different sentence rhythm, different emotional temperature
7. CUSTOMER NOTE IS HIGHEST PRIORITY: If the customer provided specific details (dish name, wait time, specific incident), those MUST appear authentically in at least 2 of the 3 reviews. Do not ignore, skip, or generalize these details. Use the exact dish name or detail they mentioned.
8. ${productGuidance}
9. Never invent details not provided`;

  const userPrompt = `Write 3 Google Maps reviews for this business. Each must feel written by a completely different person.

BUSINESS:
- Name: ${exactBusinessName}
- Type: ${businessTypeLabel}
- City: ${cityName}
- Rating: ${stars}/5 stars
- Customer highlighted: ${aspectLabel}
- SEO keywords (use 1-2 naturally per review, never force): ${keywords.length ? keywords.join(", ") : "none"}
${customerNote ? `
⚠️ CUSTOMER'S OWN EXPERIENCE — MANDATORY IN AT LEAST 2 REVIEWS:
"${customerNote}"
You MUST reference the specific details from this note (exact dish, wait time, or whatever they mentioned). Do not paraphrase into something generic. If they said "chicken tikka", write "chicken tikka" — not "the food" or a different dish.
` : ""}

The customer ${ratingWord} ${exactBusinessName}.

REVIEW STRUCTURE GUIDE (follow these openers and closers exactly, fill the middle naturally):

Review 1 — SHORT & CASUAL (1-2 sentences max, like a quick phone text):
Start with: "${opener1}"
End with: "${closer1}"
Tone: Young, informal, fast. No full sentences required.
SEO: Business name + one keyword only.

Review 2 — DETAILED & BALANCED (3-4 sentences):
Start with: "${opener2}"
${filler1} [specific aspect or customer note detail].
End with: "${closer2}"
Tone: Thoughtful, like someone who researches before visiting. Mentions specific details.
SEO: Business name + city + 1-2 keywords + customer note detail if provided.

Review 3 — PERSONAL & WARM (2-3 sentences):
Start with: "${opener3}"
${filler2} [highlight — must include customer note detail if provided].
End with: "${closer3}"
Tone: Conversational, genuine, slightly emotional. Strong recommendation.
SEO: Business name + recommendation phrase + location.

CRITICAL: All 3 must read as if written by completely different people. Vary: sentence length, vocabulary complexity, punctuation style, and emotional warmth.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 1.1,
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