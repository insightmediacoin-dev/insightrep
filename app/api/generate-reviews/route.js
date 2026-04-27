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
  const ratingWord = stars === 5 ? "absolutely loved" : stars === 4 ? "really enjoyed" : "had a good experience at";

  const featuredProducts = biz.products
    ? biz.products.split(",").map(p => p.trim()).filter(Boolean)
    : [];

  const keywords = biz.keywords
    ? biz.keywords.split(",").map(k => k.trim()).filter(Boolean)
    : [];

  const cityName = biz.address
    ? biz.address.split(",").slice(-2).join(",").trim()
    : "India";

  const systemPrompt = `You are two experts combined into one:

1. A Google Local SEO Expert who knows exactly how Google ranks businesses based on review content — keyword density, recency signals, location mentions, service/product specificity, and review length patterns that Google's algorithm rewards.

2. A Human Behavior Specialist who understands how real customers write reviews — their vocabulary, hesitations, enthusiasm levels, typing habits, and the authentic imperfections that make reviews feel genuine.

Your job: Write Google reviews that simultaneously:
- Rank the business higher on Google Maps through smart SEO signals
- Pass Google's fake review detection as 100% human-written
- Feel completely authentic to anyone reading them

ABSOLUTE RULES — NEVER BREAK:
1. Business name is "${exactBusinessName}" — use EXACTLY this name every time, never shorten or change it
2. Only mention food/products from this list: [${featuredProducts.join(", ")}] — if list is empty, speak generally, NEVER invent dish names
3. Output ONLY valid JSON: { "reviews": ["review1", "review2", "review3"] }
4. Never use corporate words: exceptional, impeccable, delightful, exquisite, commendable
5. No hashtags, no emojis, no mention of QR codes or AI
6. Never abbreviate city names — use full name or skip
7. Never start two reviews with the same word or phrase
8. Never hallucinate — only use information provided
9. Each review must have a completely different tone, vocabulary, sentence length, and personality
10. Weave in SEO keywords naturally — they must flow in conversation, never feel stuffed
11. If the customer provided their own words, weave them naturally into at least one review — do not copy verbatim, but honour the sentiment`;

  const userPrompt = `Write 3 Google Maps reviews optimized for both SEO ranking and human authenticity.

BUSINESS DETAILS:
- Exact name: ${exactBusinessName}
- Type: ${businessTypeLabel}
- City/Area: ${cityName}
- Star rating: ${stars}/5
- Customer highlighted: ${aspectLabel}
- SEO keywords to weave in naturally: ${keywords.length ? keywords.join(", ") : "none provided"}
- Menu items/products (ONLY use these, never invent): ${featuredProducts.length ? featuredProducts.join(", ") : "do not mention specific items"}
- Customer's own words (weave naturally into at least one review, honour the sentiment, do not copy verbatim): ${customerNote || "none provided"}

The customer ${ratingWord} ${exactBusinessName}.

REVIEW SPECIFICATIONS:

Review 1 — THE QUICK TEXTER
Tone: Casual, fast, like typed on phone in 30 seconds
Length: 1-2 short sentences maximum
Personality: Young, busy, informal
SEO goal: Include business name + one keyword naturally
Style: May have minor imperfections like "honestly" or "tbh" or "literally"
Example feel: "Honestly one of the best places I've been to in [city]. The [aspect] was on point — will definitely be back."

Review 2 — THE DETAILED REVIEWER  
Tone: Informative, balanced, thoughtful
Length: 3-4 sentences
Personality: Someone who reads reviews before visiting, now giving back
SEO goal: Include business name + location + 2 keywords + specific aspects + product mention if available
Style: Structured but not robotic — uses transitions like "what stood out", "also worth mentioning", "on top of that"
Example feel: Describes their visit step by step, mentions what they ordered, comments on service and ambiance separately

Review 3 — THE STORYTELLER
Tone: Warm, personal, emotional
Length: 2-3 sentences
Personality: Someone who had a memorable experience and wants to share it
SEO goal: Include business name + recommendation phrase + location signal
Style: Starts with a personal context ("Was here for...", "Took my family...", "Came here after..."), ends with strong recommendation
Example feel: Personal story hook → highlight → strong CTA to visit

IMPORTANT: All 3 reviews must feel like they were written by completely different people on different days. Vary sentence lengths, vocabulary complexity, and emotional temperature across the three reviews.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.9,
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