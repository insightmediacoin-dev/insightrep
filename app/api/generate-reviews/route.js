import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase-admin";

const FREE_MONTHLY_LIMIT = 10;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 9 LOCAL archetypes — rotated randomly, grouped in 3 pools of 3
// Each archetype is a real city-dweller, not a tourist or blogger
const ARCHETYPE_POOLS = [
  [
    {
      name: "The Casual Local",
      voice: "Lives nearby. Been here before or heard about it from friends. Types like sending a WhatsApp message — no grammar pressure, no structure. Just says what they felt. 'The biryani was fire ngl' kind of energy. Short, real, punchy.",
      length: "1-2 sentences only. Under 25 words.",
      opener: "Start with what they ate OR what stood out. Never 'I visited' or 'We went'.",
    },
    {
      name: "The Working Professional",
      voice: "Comes here for team lunches, client meetings, or quick dinners after work. Focused on reliability, service speed, and value for money. Structured but not stiff. Mentions if it works for work occasions.",
      length: "3-4 sentences. Practical and specific.",
      opener: "Start with the occasion: 'Came here for a team outing' or 'Been coming for work lunches'.",
    },
    {
      name: "The Weekend Family Person",
      voice: "Brought family — parents, kids, or partner. Cares about portions, variety, and comfort. Warm tone. Naturally mentions who they came with. Ends with whether the family would come back.",
      length: "2-3 sentences. Warm and natural.",
      opener: "Start with who they brought or why they picked this place for the family.",
    },
  ],
  [
    {
      name: "The College Crowd",
      voice: "Young local, tight budget, but knows good food. Honest and unfiltered. No over-praising. Uses phrases like 'actually really good', 'didn't expect much but', 'would def come back'. Energy is chill.",
      length: "1-2 sentences. Casual, real, under 30 words.",
      opener: "Start with expectation vs reality OR just what they liked most.",
    },
    {
      name: "The Repeat Visitor",
      voice: "Has been multiple times. Writes with authority — not discovering the place, confirming it. Knows the menu. Mentions their usual order or what they always get. Confident, not gushing.",
      length: "3-4 sentences. Specific and informed.",
      opener: "Start with the fact they keep coming back: 'Third time here' or 'Been coming for months'.",
    },
    {
      name: "The Evening Out Person",
      voice: "Came for a relaxed evening — date, group, or solo. Writes about the full experience: food, vibe, service. Ends with a specific recommendation: 'great for a date', 'good for large groups', 'perfect chill spot'.",
      length: "2-3 sentences. Experiential and warm.",
      opener: "Start with the mood or occasion: 'Perfect for a chill Friday evening' or 'Came here for a birthday dinner'.",
    },
  ],
  [
    {
      name: "The No-Nonsense Regular",
      voice: "Direct, experienced, seen many restaurants. Respects quality without overreacting. If something was good — says it plainly. Writes like an older local who doesn't waste words. Confident verdict.",
      length: "1-2 sentences. Blunt and credible.",
      opener: "Start with a direct verdict: 'Solid place', 'Good food, reasonable prices', 'Consistent as always'.",
    },
    {
      name: "The Office Area Dweller",
      voice: "Works or lives close by. Goes there regularly — not for a special occasion but just because it's reliable. Mentions location naturally as a local would. Focused on consistency and whether it's a good regular spot.",
      length: "3-4 sentences. Grounded and practical.",
      opener: "Start with proximity or habit: 'Works near here and comes often' or 'Been a regular since it opened'.",
    },
    {
      name: "The Friend Group Person",
      voice: "Came with a bunch of friends — birthday, catch-up, or random plan. Writes about how the restaurant handled a group. Mentions noise level, how accommodating the staff was, whether it was worth it for groups.",
      length: "2-3 sentences. Social and upbeat.",
      opener: "Start with the group context: 'Came here for a friend's birthday' or 'Visited with a big group'.",
    },
  ],
];

// Star rating emotional calibration
const STAR_CALIBRATION = {
  5: {
    sentiment: "absolutely loved it — everything exceeded expectations",
    tone: "Pure positive. Genuine enthusiasm. Strong recommendation. Zero complaints.",
    closing: "Clear 'will be back' or 'must visit' energy. High conviction.",
    forbidden: "ZERO negatives. ZERO 'but'. ZERO 'however'. ZERO hedging. Nothing that remotely sounds like a complaint.",
  },
  4: {
    sentiment: "really enjoyed it — great experience overall",
    tone: "Strongly positive. One very minor, calm, logistical observation is allowed but not required. Observation examples: 'gets busy on weekends', 'parking is a bit tricky', 'small waiting area'. NEVER mention food quality issues or slow service as a 4-star.",
    closing: "Confidently recommend. Positive verdict.",
    forbidden: "No food complaints. No service complaints. No 'disappointed'. Only minor logistical observations if truly natural.",
  },
  3: {
    sentiment: "mixed honest experience — some things were good, some fell short",
    tone: "Fair and balanced. Acknowledge both what worked and what didn't. Calm tone — not angry, not fake-positive. Like a friend telling you the truth about a place.",
    closing: "'Worth trying once', 'has potential', 'decent for the price'. Never strong positive close.",
    forbidden: "No 'amazing', 'best', 'must visit', 'highly recommend'. Tone must genuinely match 3 stars. Do NOT fake enthusiasm.",
  },
};

// Negative aspect handling — convert complaints into constructive mentions
const NEGATIVE_HANDLING = `
HANDLING NEGATIVE ASPECTS OR NOTES:
If the customer mentioned something negative, handle it like this based on star rating:

5-STAR: Completely ignore any negative mentioned. Do not reference it. Focus only on positives.

4-STAR: If a negative was mentioned, you may include ONE very calm, minor observation in ONE review only.
  - NEVER say: "service was slow", "food was cold", "staff was rude", "long wait", "disappointing"  
  - INSTEAD say: "gets a bit crowded during peak hours", "parking could be easier", "waiting area is small"
  - The observation must sound like a minor inconvenience — NOT a complaint
  - If the negative cannot be reframed as minor, ignore it entirely

3-STAR: Acknowledge honestly but CALMLY. The reviewer is fair — not angry.
  - NEVER say: "terrible service", "worst experience", "disgusting", "will not return", "pathetic"
  - INSTEAD say: "wait time was a bit longer than expected", "service could be more attentive", "food was okay but not their best", "has room to improve on consistency"
  - One honest observation per review is enough — don't pile on negatives

UNIVERSAL RULE: Every review must make the restaurant look like a place worth visiting — even 3-star reviews. The goal is honest, constructive feedback that helps the business, not destroys it.
`;

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
  const hasCustomerNote = customerNote.length > 0;

  // Food/product rules
  const foodRule = hasCustomerNote
    ? `Customer shared their own note: "${customerNote}". Use ONLY what they mentioned for any food or product references. Ignore the business product list. Distribute specific details across the 3 reviews — never repeat the exact same detail in all 3.`
    : featuredProducts.length > 0
      ? `Products you may reference: [${featuredProducts.join(", ")}]. Rules: (1) Use maximum 1 product name across all 3 reviews combined. (2) Only if it fits naturally in a sentence. (3) Never force it. (4) Never repeat it across reviews.`
      : `Do not mention any specific dish or product names. Speak naturally about the food or experience in general terms.`;

  // SEO keyword rules
  const keywordRule = keywords.length > 0
    ? `SEO keywords available: [${keywords.join(", ")}]. Use maximum 1 keyword across all 3 reviews. Only inside a natural flowing sentence — never as a label, title, or standalone phrase. Example of WRONG usage: "Best Restaurant Sambhajinagar". Example of RIGHT usage: "honestly one of the better spots I've found in Sambhajinagar". Skip entirely if it doesn't fit naturally.`
    : `No SEO keywords. Use business name and city naturally where it fits.`;

  const systemPrompt = `You are a specialist in writing Google Maps reviews that sound exactly like real local customers — people who LIVE in the city, not tourists visiting it.

THE SINGLE MOST IMPORTANT RULE: Every reviewer is a LOCAL RESIDENT of ${cityName}. They are not discovering this place. They are not on a trip. They have options in their city and they chose this place. Their writing should reflect that — confident, familiar, unbothered.

What local writing sounds like:
- "The biryani here is solid" — not "I discovered this amazing hidden gem"
- "Been coming here for team lunches" — not "We decided to visit this establishment"  
- "Good spot for a weekend dinner" — not "During our visit to this charming place"
- "Service was quick, food was hot" — not "The staff exhibited exemplary hospitality"

BANNED WORDS AND PHRASES — NEVER USE ANY OF THESE:
hidden gem, gem, nestled, vibrant atmosphere, cozy ambiance, culinary, gastronomic, exquisite, impeccable, commendable, exceptional experience, delightful, testament to, truly amazing, wonderful experience, stumbled upon, discovered this place, found this place, had the pleasure, I recently visited, decided to visit, one must try, a must-visit (for 3-star)

BANNED STRUCTURAL PATTERNS:
- Opening with "I recently visited [name]"
- Opening with "We decided to check out"  
- Opening with "Had the pleasure of visiting"
- Using business name more than ONCE per review
- Using city name more than ONCE per review
- Using a keyword as a standalone title phrase
- Mentioning InsightRep, QR codes, or any app

ABSOLUTE NON-NEGOTIABLE RULES:
1. Business name: "${exactBusinessName}" — copy-paste exactly, never shorten or alter even slightly
2. Output ONLY valid JSON: { "reviews": ["r1", "r2", "r3"] }
3. Each of the 3 reviews must start with a completely DIFFERENT first word
4. Each review must feel written by a genuinely different type of LOCAL person — different vocabulary, sentence rhythm, detail level, emotional temperature
5. ${calibration.forbidden}
6. ${foodRule}
7. ${keywordRule}
8. Never use city abbreviations — full city name or skip entirely
9. Never hallucinate any detail not provided to you

${NEGATIVE_HANDLING}`;

  const userPrompt = `Write 3 Google Maps reviews for ${exactBusinessName} (${businessTypeLabel}, ${cityName}).

RATING: ${stars}/5
EMOTIONAL TONE: ${calibration.sentiment}
TONE GUIDE: ${calibration.tone}
CLOSING STYLE: ${calibration.closing}
WHAT CUSTOMER HIGHLIGHTED: ${aspectLabel}
${hasCustomerNote ? `CUSTOMER'S OWN WORDS: "${customerNote}"` : ""}

CONTEXT FOR ALL 3 REVIEWS: The reviewer is a LOCAL resident of ${cityName}. They know the city well. They have many options. They chose ${exactBusinessName}. Write accordingly.

---

REVIEW 1 — ${archetypes[0].name}
Personality: ${archetypes[0].voice}
Target length: ${archetypes[0].length}
How to open: ${archetypes[0].opener}

REVIEW 2 — ${archetypes[1].name}
Personality: ${archetypes[1].voice}
Target length: ${archetypes[1].length}
How to open: ${archetypes[1].opener}

REVIEW 3 — ${archetypes[2].name}
Personality: ${archetypes[2].voice}
Target length: ${archetypes[2].length}
How to open: ${archetypes[2].opener}

---

SELF-CHECK before outputting — verify each review passes ALL of these:
✓ Sounds unmistakably like a LOCAL — not a tourist, not a blogger
✓ Matches the ${stars}-star emotional tone exactly — no tone mismatch
✓ Completely different from the other two in vocabulary, structure, and personality
✓ Would a real person actually type this on their phone
✓ All banned words and patterns are absent
✓ Business name used exactly once and spelled correctly: "${exactBusinessName}"
✓ Negative aspects (if any) are handled constructively — not as complaints

If any check fails — rewrite that review before outputting.`;

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
