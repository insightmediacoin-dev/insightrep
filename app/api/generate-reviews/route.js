import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase-admin";

const FREE_MONTHLY_LIMIT = 10;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Strip emojis from generated reviews
function stripEmojis(text) {
  return text
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{1F000}-\u{1F02F}]/gu, '')
    .replace(/[\u{1F0A0}-\u{1F0FF}]/gu, '')
    .replace(/[\u{1F100}-\u{1F1FF}]/gu, '')
    .replace(/[\u{1F200}-\u{1F2FF}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
    .trim();
}

// 9 LOCAL archetypes in 3 pools — rotated randomly each generation
// All are city-dwellers, not tourists
const ARCHETYPE_POOLS = [
  [
    {
      name: "The Casual Local",
      voice: "Lives in the city, comes here regularly or has heard about it from friends. Writes exactly like they would type a WhatsApp message to a friend — no grammar pressure, no structure, just what they felt. Short, real, direct. Energy is confident and unbothered.",
      length: "1-2 sentences only. Maximum 25 words. No more.",
      opener: "Start with what they ate, what stood out, or a direct verdict. NEVER start with 'I visited', 'We went', 'I recently', 'We decided to'.",
    },
    {
      name: "The Working Professional",
      voice: "Works in the city, visits for team lunches, client meetings, or after-work dinners. Values speed, reliability, and consistent quality. Writes practically — mentions the occasion, what worked, whether it suits a work setting. Not a foodie. A busy person who knows what they need.",
      length: "3-4 sentences. Practical and specific.",
      opener: "Start with the work occasion: 'Came here for a team lunch', 'Been bringing clients here', 'Stopped by after work'. Never start with 'I recently visited'.",
    },
    {
      name: "The Family Person",
      voice: "Brought family — partner, kids, or parents. Cares about portion size, variety on the menu, comfort, and staff patience. Warm and natural tone. Mentions who they came with without making it sound like a travel log. Ends with whether the family would return.",
      length: "2-3 sentences. Warm and grounded.",
      opener: "Start with who they brought or the occasion: 'Took the family here', 'Came with my parents', 'Brought the kids'. Not 'We decided to visit'.",
    },
  ],
  [
    {
      name: "The Young Local",
      voice: "19-26 years old, lives in the city, knows the area well, budget-conscious but values quality. Honest and unfiltered without being negative. Uses natural phrases like 'actually really good', 'not bad at all', 'would come back for sure'. Chill energy. Does not over-praise.",
      length: "1-2 sentences only. Maximum 30 words. Casual and real.",
      opener: "Start with what impressed them OR a quick expectation vs reality. Never 'I recently' or 'We visited' type openers.",
    },
    {
      name: "The Repeat Visitor",
      voice: "Has been here multiple times. Speaks with authority — not discovering the place, confirming its quality. Knows the menu, has a usual order, compares this visit to past ones. Confident tone, not gushing. Makes it clear they live here and come back because it's worth it.",
      length: "3-4 sentences. Specific and informed.",
      opener: "Start with the fact they keep returning: 'Third time here now', 'Been coming for months', 'Always end up back here'.",
    },
    {
      name: "The Weekend Outing Person",
      voice: "Came for a relaxed weekend meal or evening — date, group of friends, or solo wind-down. Writes about the full experience: food, vibe, how the evening felt. Ends with a specific recommendation tied to an occasion: 'great for a date', 'good for groups', 'perfect chill evening spot'.",
      length: "2-3 sentences. Experiential and warm.",
      opener: "Start with the mood or occasion: 'Good spot for a lazy Sunday lunch', 'Came here for a chill Friday evening', 'Took a friend here for her birthday'.",
    },
  ],
  [
    {
      name: "The No-Nonsense Regular",
      voice: "Direct, confident, experienced. Has been to many restaurants in the city and knows what good looks like. Does not get excited easily. Gives a plain, honest verdict. Sounds like a 40-55 year old local who has options and chose this place because it delivers.",
      length: "1-2 sentences only. Blunt and credible.",
      opener: "Start with a direct verdict: 'Solid place', 'Good food, fair prices', 'Consistent as always', 'Reliable spot'.",
    },
    {
      name: "The Office Area Regular",
      voice: "Works or lives near the restaurant. Goes there not for special occasions but because it is a reliable everyday spot. Writes about consistency, whether it handles the lunch rush well, and if it is a dependable go-to. Mentions the area naturally without making it sound like a location review.",
      length: "3-4 sentences. Grounded and practical.",
      opener: "Start with the habit or proximity: 'Been a regular here since it opened', 'Works nearby and comes often', 'Go-to spot in the area'.",
    },
    {
      name: "The Group Celebration Person",
      voice: "Came with a group — birthday, anniversary, or a casual friends hangout. Writes about how the restaurant handled a crowd: table arrangements, if food came out together, noise level, staff attentiveness. Ends with whether they would bring a group back.",
      length: "2-3 sentences. Social and honest.",
      opener: "Start with the group context: 'Came here for a friend's birthday', 'Booked a table for 10', 'Visited with a large group'.",
    },
  ],
];

// Star rating emotional calibration
const STAR_CALIBRATION = {
  5: {
    sentiment: "absolutely loved the experience — everything was great",
    tone: "Pure positive. Strong enthusiasm. Genuine recommendation. Zero complaints or hedging.",
    closing: "Clear 'will be back' or strong recommendation. High conviction ending.",
    forbidden: "ZERO negatives. ZERO 'but'. ZERO 'however'. ZERO hedging. ZERO qualifiers. Nothing that sounds remotely like a complaint or reservation.",
  },
  4: {
    sentiment: "really enjoyed it — great experience overall with one small logistical note allowed",
    tone: "Strongly positive throughout. One very minor, calm, logistical observation is optional. Allowed examples: 'gets busy on weekends so book in advance', 'parking nearby is limited', 'waiting area is small'. NEVER mention food quality issues, slow service, or staff as a 4-star observation.",
    closing: "Confident positive recommendation. Clear verdict.",
    forbidden: "ZERO food complaints. ZERO service complaints. ZERO 'disappointed'. ZERO 'expected better'. Only minor logistical notes — and only if completely natural.",
  },
  3: {
    sentiment: "honest mixed experience — some things worked, some fell short of expectations",
    tone: "Fair and balanced. Calm — not angry, not fake-positive. Like a trusted friend telling you the honest truth about a place. Acknowledges both what worked and what did not.",
    closing: "'Worth trying once', 'has potential', 'decent for the price but has room to improve'. NEVER a strong positive close. Never 'amazing', 'best', 'must visit'.",
    forbidden: "ZERO fake enthusiasm. ZERO 'amazing', 'best', 'must visit', 'highly recommend'. The tone must genuinely match 3 stars — a fair, honest review from someone who was not blown away.",
  },
};

// Negative aspect handling rules
const NEGATIVE_HANDLING = `
CRITICAL — HOW TO HANDLE NEGATIVE ASPECTS OR CUSTOMER NOTES:

5-STAR REVIEWS:
Completely ignore any negative mentioned. Do not reference it in any way. Focus entirely on positives.

4-STAR REVIEWS:
If a negative was mentioned, you may include ONE very minor, calm, logistical note in ONE review only.
BANNED: "service was slow", "food was cold", "staff was rude", "waited too long", "very disappointing", "not worth it"
ALLOWED: "gets busy during lunch hours", "parking can be tricky", "booking in advance is a good idea on weekends"
The note must sound like a helpful tip — NOT a complaint. If the negative cannot be reframed as a helpful tip, ignore it entirely.

3-STAR REVIEWS:
Acknowledge the issue honestly but with complete calm. The reviewer is fair — not angry, not vindictive.
BANNED: "terrible service", "worst experience ever", "disgusting", "pathetic", "will never return", "complete waste of money"
ALLOWED: "wait time was longer than expected", "service became less attentive once it got busy", "food was okay but not their best work", "has room to improve on consistency"
One honest observation per review is sufficient. Do not pile on multiple negatives.

UNIVERSAL RULE FOR ALL STAR RATINGS:
Every review — even 3-star — must leave the reader feeling that this is a place worth considering. The goal is honest, constructive feedback that helps the business improve — not content that destroys its reputation.
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

  const foodRule = hasCustomerNote
    ? `Customer shared their own note: "${customerNote}". Use ONLY what they mentioned for any food or product references — ignore the business product list entirely. Distribute specific details across the 3 reviews — different detail in each review, never repeat the same detail across all 3.`
    : featuredProducts.length > 0
      ? `Products you may reference: [${featuredProducts.join(", ")}]. Rules: (1) Use maximum 1 product name across all 3 reviews combined. (2) Only if it fits naturally inside a sentence. (3) Never force it. (4) Never repeat it.`
      : `Do not mention any specific dish or product names. Speak naturally about the food or experience in general terms.`;

  const keywordRule = keywords.length > 0
    ? `SEO keywords available: [${keywords.join(", ")}]. Rules: (1) Use maximum 1 keyword across all 3 reviews combined. (2) Only inside a natural flowing sentence — never as a label, title, or standalone phrase. (3) WRONG: "Best Restaurant Chhatrapati Sambhajinagar". RIGHT: "one of the better spots I have come across in Sambhajinagar". (4) Skip entirely if it does not fit naturally.`
    : `No SEO keywords provided. Use business name and city naturally where it fits.`;

  const systemPrompt = `You are a specialist in writing authentic Google Maps reviews that sound exactly like real LOCAL customers — people who live in the city, not tourists visiting it.

THE MOST IMPORTANT RULE OF ALL:
Every reviewer is a LOCAL RESIDENT of ${cityName}. They live here. They know this area. They are not on a trip. They are not discovering this place for the first time. They have options in their city and they chose this business. Their writing must reflect that — familiar, confident, and completely unbothered.

LOCAL vs TOURIST — understand the difference:
LOCAL sounds like: "Solid place, been here a few times now" / "Good spot for a work lunch" / "Always end up coming back here"
TOURIST sounds like: "Discovered this wonderful hidden gem" / "Had the pleasure of visiting" / "What a delightful find in this city"

PERMANENTLY BANNED WORDS AND PHRASES — ZERO TOLERANCE:
hidden gem, gem, nestled, vibrant atmosphere, cozy ambiance, culinary journey, gastronomic, exquisite, impeccable, commendable, exceptional, delightful, testament to, truly amazing, wonderful experience, stumbled upon, discovered this place, found this place, I had the pleasure, I recently visited, we decided to visit, we decided to check out, one must try, a must-visit (for 3-star only), highly recommend (for 3-star only), truly, exemplary, courteous staff (overly formal), above and beyond (for ordinary visits), top notch, would bring people here, would book again (use 'will come back' instead)

BANNED STRUCTURAL PATTERNS — NEVER DO THESE:
- Opening any review with "I recently visited [name]"
- Opening any review with "We decided to visit / check out"
- Opening any review with "I had the pleasure of visiting"
- Using the business name more than ONCE in a single review
- Using the city name more than ONCE in a single review
- Mentioning InsightRep, QR codes, apps, or review prompts
- Using SEO keywords as standalone title-case labels
- Using emojis anywhere in any review
- Indirect superlatives like "my friend said it is the best in town"

ABSOLUTE NON-NEGOTIABLE RULES:
1. Business name: "${exactBusinessName}" — copy this exactly, never shorten or alter even one character
2. Output ONLY valid JSON: { "reviews": ["review1", "review2", "review3"] }
3. Each of the 3 reviews must start with a completely DIFFERENT first word — no shared openers
4. Each review must feel written by a genuinely different type of local person — different vocabulary, sentence length, rhythm, detail level, emotional temperature
5. Star calibration: ${calibration.forbidden}
6. ${foodRule}
7. ${keywordRule}
8. Never abbreviate city names — full name or skip entirely
9. Never hallucinate any detail not explicitly provided
10. No emojis anywhere — not even in punctuation style

${NEGATIVE_HANDLING}`;

  const userPrompt = `Write 3 Google Maps reviews for ${exactBusinessName} — a ${businessTypeLabel} in ${cityName}.

STAR RATING: ${stars} out of 5
EMOTIONAL TONE: ${calibration.sentiment}
TONE GUIDE: ${calibration.tone}
CLOSING STYLE: ${calibration.closing}
WHAT THE CUSTOMER HIGHLIGHTED: ${aspectLabel}
${hasCustomerNote ? `CUSTOMER'S OWN WORDS: "${customerNote}"` : ""}

CONTEXT FOR ALL 3 REVIEWS:
The person writing each review is a LOCAL resident of ${cityName}. They are not a tourist. They know this city well. They have plenty of options nearby. They chose ${exactBusinessName} — and now they are writing about their experience. Every word must reflect that local familiarity.

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

MANDATORY SELF-CHECK — Before outputting, verify every review passes ALL of these:

✓ LOCAL TEST: Does it sound like someone who LIVES in ${cityName} — not a tourist, not a blogger, not a food critic?
✓ STAR TEST: Does it match the ${stars}-star emotional tone exactly — no tone mismatch at all?
✓ DISTINCT TEST: Is each review completely different from the other two in vocabulary, structure, and personality?
✓ HUMAN TEST: Would a real person actually type this exact text on their phone?
✓ CLEAN TEST: Are ALL banned words, banned phrases, and banned structural patterns completely absent?
✓ NAME TEST: Is the business name used exactly once per review and spelled exactly as "${exactBusinessName}"?
✓ NEGATIVE TEST: If there was a negative aspect mentioned — is it handled constructively and calmly, NOT as a complaint?
✓ EMOJI TEST: Are there ZERO emojis anywhere in any review?

If ANY check fails — rewrite that review completely before outputting.`;

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
      ? parsed.reviews
          .map(r => stripEmojis(String(r).trim()))
          .filter(Boolean)
      : [];

    if (reviews.length < 3) return NextResponse.json({ ok: false, message: "Model returned fewer than 3 reviews." }, { status: 502 });

    return NextResponse.json({ ok: true, reviews: reviews.slice(0, 3) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "OpenAI request failed";
    return NextResponse.json({ ok: false, message }, { status: 502 });
  }
}
