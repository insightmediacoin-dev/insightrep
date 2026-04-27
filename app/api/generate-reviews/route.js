import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase-admin";

const FREE_MONTHLY_LIMIT = 10;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Randomized persona seeds — forces structural variety every generation
const PERSONA_SETS = [
  {
    p1: { style: "A college student who types fast and keeps it real. 1-2 short sentences. Casual slang allowed. No punctuation perfection needed." },
    p2: { style: "A working professional in their 30s. Visits for lunch/dinner. 3-4 well-structured sentences. Mentions specific details about food, service, ambiance separately." },
    p3: { style: "A family person who came with spouse or kids. Warm and personal. 2-3 sentences. Starts with context of visit, ends with strong recommendation." },
  },
  {
    p1: { style: "A foodie who reviews places regularly. Very direct, confident tone. 1-2 punchy sentences. Gets straight to the point." },
    p2: { style: "A first-time visitor who did research before coming. Shares whether it lived up to expectations. 3-4 sentences. Thoughtful and balanced." },
    p3: { style: "Someone who was pleasantly surprised. Came with low expectations, left impressed. 2-3 sentences. Conversational and genuine." },
  },
  {
    p1: { style: "A local resident who knows the area well. Compares it favorably to other spots. 1-2 sentences. Confident recommendation." },
    p2: { style: "A detail-oriented reviewer. Notes specific things: what they ordered, how long it took, how staff behaved. 3-4 sentences. Honest and specific." },
    p3: { style: "Someone celebrating a small occasion — birthday, date, promotion. Emotional and warm. 2-3 sentences. Personal story angle." },
  },
];

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
  const ratingWord = stars === 5 ? "absolutely loved" : stars === 4 ? "really enjoyed" : "had a good experience at";

  // Customer note takes full control of food mentions
  const customerMentionedFood = customerNote.length > 0;
  const productLine = customerMentionedFood
    ? `The customer already mentioned specific food/details in their note. DO NOT add any product from the profile list — only use what the customer said.`
    : featuredProducts.length > 0
      ? `If mentioning food feels natural, pick ONE from this list only: [${featuredProducts.join(", ")}]. Never mention more than one. If it doesn't fit naturally, skip it entirely.`
      : `Do not mention any specific dish or product names.`;

  const personas = pick(PERSONA_SETS);

  const systemPrompt = `You write Google Maps reviews that rank businesses higher on Google Search while sounding 100% human-written. You understand both SEO and human psychology.

Your reviews must:
- Sound like real people wrote them — different ages, different writing styles, different levels of detail
- Include location and keyword signals naturally woven into the text — never stuffed
- Be completely unique in structure and vocabulary each time — no templates, no repeated phrases
- Pass any AI detection tool as human-written

ABSOLUTE RULES:
1. Business name is "${exactBusinessName}" — use EXACTLY this, never shorten or alter
2. Output ONLY valid JSON: { "reviews": ["r1", "r2", "r3"] }
3. Banned words: exceptional, impeccable, delightful, exquisite, commendable, vibrant, cozy, nestled, testament, gem, hidden gem
4. No hashtags, no emojis, no mention of apps or QR codes
5. Each review must start with a different word — no two reviews can share the same opening word
6. Never hallucinate facts not provided
7. ${productLine}
8. CUSTOMER NOTE RULE: If a customer note is provided, the specific details in it (dish name, wait time, incident) MUST appear word-for-word or near-verbatim in at least 2 of the 3 reviews. This overrides everything else.`;

  const userPrompt = `Write 3 Google Maps reviews for ${exactBusinessName}, a ${businessTypeLabel} in ${cityName}.

FACTS:
- Star rating given: ${stars}/5
- Customer highlighted: ${aspectLabel}
- The customer ${ratingWord} ${exactBusinessName}
- SEO keywords to weave in naturally (use 1-2 per review, never force them): ${keywords.length ? keywords.join(", ") : "none — just use business name and location"}
${customerNote ? `
CUSTOMER'S OWN EXPERIENCE (treat this as a real memory — use these exact details in at least 2 reviews):
"${customerNote}"
` : ""}

REVIEW PERSONAS — write each review as this exact type of person:

Review 1 — ${personas.p1.style}
SEO goal: Include business name + city + one keyword naturally.

Review 2 — ${personas.p2.style}
SEO goal: Include business name + city + 2 keywords + specific detail from customer note if provided.

Review 3 — ${personas.p3.style}
SEO goal: Include business name + strong recommendation phrase + city mention.

QUALITY BAR: Each review should feel like it could have been posted on Google by a real person today. Read each one before outputting — if it sounds like AI or a template, rewrite it.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.95,
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