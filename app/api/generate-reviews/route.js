import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase-admin";

const FREE_MONTHLY_LIMIT = 10;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Three completely distinct human archetypes — rotated randomly each generation
const ARCHETYPE_POOLS = [
  [
    {
      name: "The Quick Texter",
      voice: "Types like they're texting a friend. Short, punchy, zero corporate tone. Uses 'tbh', 'ngl', 'honestly', 'lowkey'. 1-2 sentences max. Incomplete sentences are fine. Never sounds like a review — sounds like a WhatsApp message.",
      length: "1-2 sentences only",
    },
    {
      name: "The Balanced Critic",
      voice: "Works in a corporate job, visits restaurants for client dinners and family outings. Writes like someone who reads reviews before going — now giving back. Mentions 2-3 specific details: what they ordered or experienced, service quality, whether they'd return. Structured but warm. Never robotic.",
      length: "3-4 sentences",
    },
    {
      name: "The Storyteller",
      voice: "Shares context before the review — who they came with, why they were there. Makes it feel like a memory. Honest conclusion. Reads like a personal diary entry, not a review form. Warm, human, specific.",
      length: "2-3 sentences",
    },
  ],
  [
    {
      name: "The Local Regular",
      voice: "Lives in the city, has been to many places nearby, speaks with authority. Confident and direct. References the area or compares naturally. 1-2 sentences. No fluff.",
      length: "1-2 sentences only",
    },
    {
      name: "The Detail Noticer",
      voice: "Pays attention to everything — wait time, staff attitude, cleanliness, food temperature, value for money. Writes like someone filling out a proper review. Honest about both positives and negatives. 3-4 specific sentences.",
      length: "3-4 sentences",
    },
    {
      name: "The Recommender",
      voice: "Came for a special reason — friends, family, celebration, or craving. Focuses on the emotional experience. Ends with a clear verdict on whether others should go. Genuine and conversational.",
      length: "2-3 sentences",
    },
  ],
  [
    {
      name: "The Millennial Foodie",
      voice: "Cares about vibe, food quality, and Instagram-worthiness but writes casually. Uses phrases like 'the vibe was', 'the food hit different', 'would definitely come back'. 1-2 sentences. Young energy.",
      length: "1-2 sentences only",
    },
    {
      name: "The Researcher",
      voice: "Did research before visiting. Compares expectations vs reality. Mentions specific things they noticed. Writes in a thoughtful, measured tone. 3-4 sentences. Ends with whether it met the bar.",
      length: "3-4 sentences",
    },
    {
      name: "The Honest Friend",
      voice: "Writes like they're telling a friend about the place over a call. Real, unfiltered, specific. Mentions one good thing and one thing to improve. Ends with a clear yes or maybe recommendation.",
      length: "2-3 sentences",
    },
  ],
];

const STAR_CALIBRATION = {
  5: {
    sentiment: "extremely positive — they loved everything about the visit",
    honesty: "Pure positive. No negatives. Strong recommendation. The customer is genuinely happy and wants to tell everyone.",
    closing: "Strong 'must visit' recommendation. High enthusiasm.",
    forbidden: "Do NOT mention any negatives, complaints, or areas of improvement.",
  },
  4: {
    sentiment: "positive — great experience with one small thing that could be slightly better",
    honesty: "Mostly glowing. One very minor observation is optional — like 'could be a bit less crowded' or 'parking could be better'. Overall verdict is clearly positive.",
    closing: "Recommend it confidently. Slight nuance allowed but not required.",
    forbidden: "Do NOT write anything that sounds like a complaint. Minor observations only.",
  },
  3: {
    sentiment: "mixed and honest — some things were good, some clearly disappointed them",
    honesty: "Be genuinely honest. Acknowledge what worked and what didn't. The customer is not angry — just giving honest feedback. The review should feel fair, not fake-positive or overly negative.",
    closing: "Cautious recommendation — 'decent but could be better', 'worth trying once', 'has potential'. Never say 'best place' or give a strong positive close.",
    forbidden: "Do NOT write a falsely positive review. Do NOT use phrases like 'one of the best', 'highly recommend', 'must visit'. The tone must match a 3-star reality.",
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
  const calibration = STAR_CALIBRATION[stars];
  const archetypes = pick(ARCHETYPE_POOLS);

  // Customer note completely overrides product mentions
  const hasCustomerNote = customerNote.length > 0;
  const foodRule = hasCustomerNote
    ? `The customer shared their own specific experience. Use ONLY what they mentioned for any food/product references. Completely ignore the business product list.`
    : featuredProducts.length > 0
      ? `You may reference ONE product from this list naturally in ONE review only — never force it, never repeat across reviews: [${featuredProducts.join(", ")}]`
      : `Do not mention any specific dish or product names.`;

  // Keyword rule — conversational only, never as a label
  const keywordRule = keywords.length > 0
    ? `SEO keywords available: [${keywords.join(", ")}]. Rules: (1) Use maximum 1 keyword per review. (2) Only use it if it flows naturally inside a sentence — like "been searching for a good bar in the area" not "Best Bar Beed Bypass Road". (3) Never use in title case. (4) If it doesn't fit naturally, skip it entirely.`
    : `No SEO keywords. Just use the business name and city naturally.`;

  // Distribute customer note details — not all in every review
  const noteRule = hasCustomerNote
    ? `Customer's experience: "${customerNote}"
DISTRIBUTION RULE: Spread the details across reviews — do NOT repeat the same detail in all 3. 
- Review 1: reference one specific detail from the note briefly
- Review 2: go deeper on the experience using 1-2 details from the note  
- Review 3: reference a different detail or the overall feeling from the note
This makes each review feel written by a different person who noticed different things.`
    : "";

  const systemPrompt = `You are a specialist in writing authentic, human Google Maps reviews for Indian restaurants, cafes, bars, and hospitality businesses. You understand both Google SEO and real human psychology.

Your reviews are used by real customers to post on Google. They must be indistinguishable from genuine human-written reviews.

ABSOLUTE RULES — ZERO EXCEPTIONS:
1. Business name: "${exactBusinessName}" — copy-paste exact, never alter
2. Output ONLY valid JSON: { "reviews": ["r1", "r2", "r3"] }
3. PERMANENTLY BANNED words/phrases: exceptional, impeccable, delightful, exquisite, commendable, vibrant, cozy, nestled, testament, gem, hidden gem, truly, wonderful, amazing experience (as generic filler), one of the best (for 3-star), must visit (for 3-star), highly recommend (for 3-star)
4. BANNED pattern: keyword as a standalone label e.g. "Best Restaurant Chhatrapati Sambhajinagar" or "Best Bar near me" — these are spam signals, never do this
5. No hashtags, no emojis, no mention of apps, QR codes, or InsightRep
6. Every review must start with a DIFFERENT word — no shared openers
7. Each review must feel written by a completely different person — different vocabulary, rhythm, detail level, and emotional tone
8. Star rating MUST match the emotional tone — ${calibration.forbidden}
9. ${foodRule}
10. ${keywordRule}
11. Never use city abbreviations — write full city name or skip
12. Never hallucinate facts not provided`;

  const userPrompt = `Write 3 Google Maps reviews for ${exactBusinessName} (${businessTypeLabel} in ${cityName}).

STAR RATING: ${stars}/5
EMOTIONAL TONE: ${calibration.sentiment}
HONESTY LEVEL: ${calibration.honesty}
CLOSING STYLE: ${calibration.closing}
CUSTOMER HIGHLIGHTED: ${aspectLabel}

${noteRule}

Write each review in the voice of a completely different person:

REVIEW 1 — ${archetypes[0].name}
Voice: ${archetypes[0].voice}
Length: ${archetypes[0].length}
SEO: Include business name + city naturally if it fits.

REVIEW 2 — ${archetypes[1].name}
Voice: ${archetypes[1].voice}
Length: ${archetypes[1].length}
SEO: Include business name + city + 1 keyword naturally if available.

REVIEW 3 — ${archetypes[2].name}
Voice: ${archetypes[2].voice}
Length: ${archetypes[2].length}
SEO: Include business name + recommendation phrase + city if it fits.

FINAL QUALITY CHECK — before outputting, verify each review:
✓ Does it match the ${stars}-star emotional tone?
✓ Does it sound like that specific type of person wrote it?
✓ Is it completely different from the other two in structure, vocabulary, and detail?
✓ Would a real person on Google actually write this?
If any answer is NO — rewrite that review before outputting.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.85,
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