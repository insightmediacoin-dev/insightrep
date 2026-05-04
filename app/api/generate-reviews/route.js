import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase-admin";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const FREE_MONTHLY_LIMIT = 10;
const RATE_LIMIT_MAX     = 5;
const RATE_LIMIT_WINDOW  = 60; // minutes

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

function stripEmojis(text) {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")
    .trim();
}

function getTimeSlot(hour) {
  if (hour >= 6  && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "afternoon";
  if (hour >= 16 && hour < 20) return "evening";
  return "night";
}

async function checkRateLimit(admin, ip, businessId) {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW * 60 * 1000).toISOString();
  const key = `${ip}:${businessId}`;
  try {
    const { count } = await admin
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("key", key)
      .gte("created_at", windowStart);
    if ((count ?? 0) >= RATE_LIMIT_MAX) return { allowed: false };
    await admin.from("rate_limits").insert({ key, created_at: new Date().toISOString() });
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS TYPE DEFINITIONS
// Every category — drives language, banned phrases, reviewing context
// ─────────────────────────────────────────────────────────────────────────────

const BUSINESS_TYPES = {
  restaurant:  { label: "restaurant",        visited: "came here to eat",                    reviewing: "food, service and dining experience",              banned: [] },
  cafe:        { label: "cafe",              visited: "came for coffee or a bite",            reviewing: "coffee, drinks, snacks and cafe atmosphere",       banned: [] },
  hotel:       { label: "hotel",             visited: "stayed here",                          reviewing: "rooms, facilities, service and overall stay",       banned: ["dinner spot","meal was","food was","dishes","menu item","biryani","thali","evening meal","restaurant"] },
  bar:         { label: "bar",               visited: "came here for drinks",                 reviewing: "drinks, cocktails, vibe and bar service",           banned: [] },
  bakery:      { label: "bakery",            visited: "came for baked goods",                 reviewing: "baked goods, pastries and freshness",               banned: ["dinner spot","evening meal","lunch spot"] },
  fastfood:    { label: "quick service restaurant", visited: "came for a quick meal",          reviewing: "food, speed and value for money",                  banned: [] },
  dhaba:       { label: "dhaba",             visited: "stopped here for a meal",              reviewing: "food, taste, portions and value",                   banned: [] },
  salon:       { label: "salon",             visited: "came for a haircut or treatment",      reviewing: "service quality, staff skill and cleanliness",      banned: ["dinner spot","meal","food was","dishes","menu","restaurant","biryani","dining","evening meal","quiet meal","cuisine","ambiance of the food"] },
  gym:         { label: "gym",               visited: "came here for a workout",              reviewing: "equipment, trainers, cleanliness and facilities",   banned: ["dinner spot","meal","food was","dishes","menu","restaurant","biryani","dining","cuisine","quiet meal"] },
  retail:      { label: "store",             visited: "came here to shop",                    reviewing: "product range, pricing and shopping experience",    banned: ["dinner spot","meal","food was","dishes","menu","biryani","dining","cuisine"] },
  clinic:      { label: "clinic",            visited: "visited for a consultation",           reviewing: "doctor, staff, cleanliness and consultation quality",banned: ["dinner spot","meal","food","dishes","menu","restaurant","biryani","dining","cuisine"] },
  agency:      { label: "agency",            visited: "engaged their services",               reviewing: "service quality, professionalism and results",      banned: ["dinner spot","meal","food","dishes","menu","restaurant","biryani","dining","cuisine","ambiance","seating"] },
  education:   { label: "institute",         visited: "enrolled for classes here",            reviewing: "teaching quality, faculty and learning environment", banned: ["dinner spot","meal","food","dishes","menu","restaurant","biryani","dining","cuisine"] },
  travel:      { label: "travel agency",     visited: "booked a tour or package here",        reviewing: "tour packages, travel services and overall experience", banned: ["dinner spot","meal","food was","dishes","menu","biryani","dining"] },
  other:       { label: "business",          visited: "came here",                            reviewing: "overall service and experience",                    banned: [] },
};

function getType(type) {
  return BUSINESS_TYPES[type] ?? BUSINESS_TYPES.other;
}

// ─────────────────────────────────────────────────────────────────────────────
// LABEL MAPS
// ─────────────────────────────────────────────────────────────────────────────

const PRICE_LABELS = {
  budget:  "budget-friendly (under ₹200/person)",
  mid:     "mid-range (₹200–500/person)",
  premium: "premium (₹500–1000/person)",
  luxury:  "luxury (₹1000+/person)",
};

const VIBE_LABELS = {
  casual:        "casual everyday spot",
  fine_dining:   "fine dining restaurant",
  family:        "family-style restaurant",
  takeaway:      "takeaway-focused",
  cafe_hangout:  "cafe and hangout spot",
  bar_nightlife: "bar and nightlife venue",
};

const PROFILE_MAP = {
  professionals: "working professionals",
  families:      "families with children",
  students:      "college students",
  couples:       "couples",
  seniors:       "senior citizens",
  mixed:         "mixed crowd",
};

const FEATURE_MAP = {
  rooftop:        "rooftop seating",
  live_music:     "live music",
  private_dining: "private dining available",
  outdoor:        "outdoor seating",
  parking:        "parking available",
  delivery:       "home delivery",
  pure_veg:       "pure vegetarian",
  late_night:     "open late night",
  wifi:           "free Wi-Fi",
  pet_friendly:   "pet friendly",
};

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWER ARCHETYPES
// Universal — works for every business type
// ─────────────────────────────────────────────────────────────────────────────

const ARCHETYPES = [
  {
    id: "repeat_local",
    voice: "Has visited multiple times. Speaks with quiet confidence. No need to over-explain — just shares what they know.",
    length: "2–3 sentences.",
    open: "Start with repeat visits: 'Been coming here for months', 'Third time this year'.",
  },
  {
    id: "first_timer_converted",
    voice: "First visit. Came on a recommendation or just tried it. Pleasantly impressed. Ends with intent to return.",
    length: "2–3 sentences.",
    open: "Start with first visit: 'First time here', 'Came on a friend's tip'.",
  },
  {
    id: "straight_shooter",
    voice: "Blunt. Local. High standards. Short verdict — no decoration.",
    length: "1–2 sentences max.",
    open: "Start with a direct verdict: 'Solid place', 'Good [service/food/product], fair price'.",
  },
  {
    id: "detail_noticer",
    voice: "Remembers a specific moment or detail — one thing that stood out. Makes the review feel real and firsthand.",
    length: "3–4 sentences.",
    open: "Start with the specific thing that impressed: 'What stood out was...', or dive straight into the detail.",
  },
  {
    id: "group_visitor",
    voice: "Came with friends, family or colleagues. Cares whether the place handled the group well and if everyone left happy.",
    length: "2–3 sentences.",
    open: "Start with the group: 'Came with family', 'Brought my team here', 'Group of six of us came'.",
  },
  {
    id: "occasion_visitor",
    voice: "Came for a specific occasion — birthday, anniversary, work lunch, date night. Mentions the occasion naturally and how the place suited it.",
    length: "2–3 sentences.",
    open: "Start with the occasion: 'Came for a birthday dinner', 'Used this for a client lunch'.",
  },
  {
    id: "value_assessor",
    voice: "Fair-minded. Thinks about quality vs price. Mentions whether it felt worth it — not cheap, just honest.",
    length: "2–3 sentences.",
    open: "Start with value: 'Good value for what you get', 'Worth every rupee'.",
  },
  {
    id: "vibe_noticer",
    voice: "Pays attention to atmosphere — how the place feels, lighting, noise level, energy. Mentions vibe alongside the product or service.",
    length: "2–3 sentences.",
    open: "Start with the atmosphere: 'The vibe here is...', 'Really like the feel of this place'.",
  },
  {
    id: "casual_local",
    voice: "Relaxed, conversational. Lives nearby. Writes like texting a friend — honest, natural, unbothered.",
    length: "1–2 sentences.",
    open: "Start casually: 'Pretty solid spot', 'Honestly one of the better [places] around here'.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STAR CALIBRATION
// ─────────────────────────────────────────────────────────────────────────────

const STAR_RULES = {
  5: {
    sentiment: "loved everything — nothing to complain about",
    tone:      "Pure positive. Enthusiastic but genuine. No complaints, no hedging, no 'but', no 'however'. Zero qualifiers.",
    closing:   "Strong 'will be back' or clear recommendation.",
    hard_rule: "ABSOLUTE: Zero negatives. If a negative appears anywhere — delete the review and rewrite.",
  },
  4: {
    sentiment: "really enjoyed it — great experience overall",
    tone:      "Strongly positive. Same direction as 5-star but slightly less intense. NEVER invent observations like 'parking was tricky', 'it got crowded', 'wait was long', 'noise level' — these MUST NOT appear unless the customer explicitly mentioned them.",
    closing:   "Confident positive recommendation.",
    hard_rule: "If customer mentioned NOTHING negative — write ZERO negatives. Treat like 5-star in positivity.",
  },
  3: {
    sentiment: "decent visit — some things worked, some did not",
    tone:      "Balanced and honest. Not angry — like a fair friend giving their real take. One calm honest observation maximum.",
    closing:   "'Worth trying once', 'has potential', 'decent for the price'. Never a strong positive close.",
    hard_rule: "NEVER: 'terrible', 'worst', 'disgusting', 'will never return', 'pathetic'. One fair observation is enough.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SEO INJECTION — the most important part for clients
// ─────────────────────────────────────────────────────────────────────────────

function buildSeoRule(keywords, businessName, cityName) {
  // Always inject business name + city naturally as baseline SEO
  // Keywords are bonus layer on top
  const baseRule = `Business name "${businessName}" appears exactly ONCE per review — spelled correctly every time. City "${cityName}" appears maximum ONCE per review. Both are critical for local SEO — they must appear naturally inside a sentence, never as a standalone label.`;

  if (!keywords || keywords.length === 0) {
    return `SEO RULES:\n${baseRule}\nNo additional keywords provided — business name and city are your SEO anchors.`;
  }

  // Pick 1 keyword to use across all 3 reviews
  const chosenKeyword = pick(keywords);

  return `SEO RULES:
${baseRule}

Primary keyword to embed: "${chosenKeyword}"
- Use this keyword in EXACTLY ONE of the 3 reviews
- It must appear inside a naturally flowing sentence — NEVER as a title-case label or standalone phrase
- WRONG: "Best Restaurant Sambhajinagar" | RIGHT: "one of the better spots I've found in Sambhajinagar for this"
- If it does not fit naturally in any review — skip it. Forced keywords hurt more than help.

All other keywords available (DO NOT use — future use only): [${keywords.filter(k => k !== chosenKeyword).join(", ")}]`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, message: "OpenAI not configured." }, { status: 503 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, message: "Database not configured." }, { status: 500 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 }); }

  const { businessId, rating, aspects, customNote, moodLabel } = body;

  if (!businessId || typeof businessId !== "string")
    return NextResponse.json({ ok: false, message: "businessId required." }, { status: 400 });

  const stars = Number(rating);
  if (!Number.isInteger(stars) || stars < 3 || stars > 5)
    return NextResponse.json({ ok: false, message: "Rating must be 3, 4, or 5." }, { status: 400 });

  // Rate limit
  const rateCheck = await checkRateLimit(admin, ip, businessId);
  if (!rateCheck.allowed) {
    return NextResponse.json({ ok: false, message: "Too many requests. Please wait.", rateLimited: true }, { status: 429 });
  }

  // ── Fetch business ──────────────────────────────────────────────────────────
  const { data: biz, error: bizError } = await admin
    .from("businesses")
    .select("name, address, locality, gmb_link, keywords, products, plan, business_type, business_category, description, dining_vibe, price_range, customer_profiles, special_features")
    .eq("id", businessId)
    .maybeSingle();

  if (bizError) return NextResponse.json({ ok: false, message: bizError.message }, { status: 500 });
  if (!biz)     return NextResponse.json({ ok: false, message: "Business not found." }, { status: 404 });

  // Free plan limit
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
      return NextResponse.json({ ok: false, message: `Free plan limit reached. Upgrade to continue.`, limitReached: true }, { status: 403 });
    }
  }

  // ── Build context ───────────────────────────────────────────────────────────
  const typeConfig = getType(biz.business_type);

  const businessName = biz.name.trim();
  const cityName     = biz.locality?.trim()
    || (biz.address ? biz.address.split(",").slice(-2).join(",").trim() : "India");

  // Decode JSON fields
  let customerProfiles = [];
  let specialFeatures  = [];
  try { customerProfiles = JSON.parse(biz.customer_profiles || "[]"); } catch {}
  try { specialFeatures  = JSON.parse(biz.special_features  || "[]"); } catch {}

  // Products and keywords
  const products = biz.products
    ? biz.products.split(",").map(p => p.trim()).filter(Boolean)
    : [];
  const keywords = biz.keywords
    ? biz.keywords.split(",").map(k => k.trim()).filter(Boolean)
    : [];

  // Build rich business profile — every non-null field contributes
  const profileLines = [
    biz.description?.trim()       ? biz.description.trim() : null,
    biz.dining_vibe               ? `Style: ${VIBE_LABELS[biz.dining_vibe] || biz.dining_vibe}` : null,
    biz.price_range               ? `Price range: ${PRICE_LABELS[biz.price_range] || biz.price_range}` : null,
    customerProfiles.length > 0   ? `Typical customers: ${customerProfiles.map(p => PROFILE_MAP[p] || p).filter(Boolean).join(", ")}` : null,
    specialFeatures.length  > 0   ? `Special features: ${specialFeatures.map(f => FEATURE_MAP[f] || f).filter(Boolean).join(", ")}` : null,
    products.length > 0           ? `Notable items: ${products.slice(0, 6).join(", ")}` : null,
  ].filter(Boolean);

  const businessProfile = profileLines.join("\n");
  const hasProfile      = profileLines.length > 0;

  // Customer input
  const tags         = Array.isArray(aspects) ? aspects.filter(a => typeof a === "string") : [];
  const customerNote = typeof customNote === "string" ? customNote.trim().slice(0, 300) : "";
  const noteIsUsable = customerNote.length >= 25; // only use note if substantive

  const aspectLabel = tags.length > 0 ? tags.join(", ") : "overall experience";

  // Time context
  const nowIST    = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hourIST   = nowIST.getHours();
  const isWeekend = nowIST.getDay() === 0 || nowIST.getDay() === 6;
  const timeSlot  = getTimeSlot(hourIST);

  const TIME_CONTEXT = {
    morning:   "morning (6am–11am) — breakfast, early outing, morning coffee",
    afternoon: "afternoon (11am–4pm) — lunch, afternoon break, midday visit",
    evening:   "evening (4pm–8pm) — early dinner, post-work, evening outing",
    night:     "night (8pm–12am) — late dinner, night out, celebration, catch-up",
  };

  const DAY_CONTEXT = isWeekend
    ? "Weekend — family outings, leisure, celebrations and group visits are natural."
    : "Weekday — work lunches, post-work visits, quick stops are natural.";

  // Pick 3 archetypes randomly
  const [a1, a2, a3] = pickN(ARCHETYPES, 3);

  const calibration = STAR_RULES[stars];
  const seoRule     = buildSeoRule(keywords, businessName, cityName);

  // Product reference instruction
  let productInstruction;
  if (noteIsUsable) {
    productInstruction = `Customer's own note: "${customerNote}"\nUse ONLY what they specifically mentioned. Distribute details across the 3 reviews — never repeat the same detail twice. If their note is vague, write from the business profile instead.`;
  } else if (products.length > 0) {
    productInstruction = `Notable items available to reference: [${products.join(", ")}]\nUse maximum 1 item name across all 3 reviews combined. Only if it fits naturally. Never force it. Never repeat.`;
  } else {
    productInstruction = `No specific items available. Write about ${typeConfig.reviewing} in natural general terms. Never invent specific item names.`;
  }

  // Banned phrases for this business type
  const bannedLine = typeConfig.banned.length > 0
    ? `\nPERMANENTLY BANNED for a ${typeConfig.label} (restaurant-only phrases that must never appear here):\n${typeConfig.banned.map(b => `"${b}"`).join(", ")}`
    : "";

  // ── SYSTEM PROMPT ───────────────────────────────────────────────────────────
  const systemPrompt = `You write authentic Google Maps reviews that sound exactly like real local customers — people who LIVE in ${cityName}. Not tourists. Not marketers. Real locals.

━━━ WHO YOU ARE WRITING FOR ━━━
Business: ${businessName}
Type: ${typeConfig.label}
City: ${cityName}

Every reviewer is a LOCAL RESIDENT of ${cityName}. They live here. They know this city. They chose ${businessName}. Their language is familiar, confident and unbothered — not tourist-excited.

━━━ BUSINESS TYPE CONTEXT ━━━
This is a ${typeConfig.label}.
- Reviewer ${typeConfig.visited}
- They are reviewing: ${typeConfig.reviewing}
${bannedLine}

━━━ BUSINESS PROFILE ━━━
${hasProfile ? businessProfile : `No additional profile data. Write from business type context (${typeConfig.label}) only. Do NOT invent any specific details.`}

━━━ STAR RATING RULES ━━━
Rating: ${stars}/5
Sentiment: ${calibration.sentiment}
Tone: ${calibration.tone}
Closing style: ${calibration.closing}
HARD RULE: ${calibration.hard_rule}

━━━ NEGATIVE FEEDBACK HANDLING ━━━
5★: Ignore ALL negatives. Pure positive. No exceptions.
4★: Customer mentioned nothing negative = write ZERO negatives. NEVER invent: parking difficulty, long wait, crowds, noise — unless customer explicitly said so.
3★: Maximum ONE calm honest observation. Never angry, never extreme.
ALL: Every review — even 3★ — must leave the reader feeling this place is worth visiting.

━━━ PRODUCT / SERVICE REFERENCES ━━━
${productInstruction}

━━━ ${seoRule} ━━━

━━━ LANGUAGE RULES — NON-NEGOTIABLE ━━━
BANNED WORDS (never use any of these):
hidden gem, gem, nestled, vibrant, cozy ambiance, culinary journey, gastronomic, exquisite, impeccable, commendable, exceptional, delightful, testament to, truly amazing, wonderful experience, stumbled upon, discovered this place, I recently visited, we decided to visit, I had the pleasure, one must try, above and beyond, top notch, exemplary, truly, certainly, absolutely

BANNED PATTERNS:
- Opening with "I recently visited [name]" or "We decided to check out"
- Using the business name more than ONCE per review
- Using the city name more than ONCE per review  
- Title-case SEO phrases: "Best Restaurant Sambhajinagar" — never
- Emojis anywhere
- Multiple exclamation marks
- Corporate tone: reads like a press release
- Fake enthusiasm: "AMAZING!!!", "absolutely loved every single moment"

REQUIRED PATTERNS:
- Each review starts with a COMPLETELY different first word
- Each review sounds like a COMPLETELY different person — different vocabulary, structure, length
- Varied sentence rhythm — short punchy lines mixed with slightly longer ones
- Sounds typed on a phone by a real person, not written in a document
- Business name used exactly once, spelled correctly: "${businessName}"

━━━ OUTPUT FORMAT ━━━
Return ONLY valid JSON — no markdown, no explanation, nothing else:
{ "reviews": ["review one text", "review two text", "review three text"] }`;

  // ── USER PROMPT ─────────────────────────────────────────────────────────────
  const userPrompt = `Write 3 Google Maps reviews for ${businessName} (${typeConfig.label} in ${cityName}).

VISIT DETAILS:
- Star rating: ${stars}/5
- Customer highlighted: ${aspectLabel}
- Time of visit: ${TIME_CONTEXT[timeSlot]}
- Day type: ${DAY_CONTEXT}
- Visit purpose/mood: ${moodLabel ?? "general visit"}
${noteIsUsable ? `- Customer's own words: "${customerNote}"` : ""}

REVIEWER 1 — ${a1.id}
Personality: ${a1.voice}
Length: ${a1.length}
Opening: ${a1.open}

REVIEWER 2 — ${a2.id}
Personality: ${a2.voice}
Length: ${a2.length}
Opening: ${a2.open}

REVIEWER 3 — ${a3.id}
Personality: ${a3.voice}
Length: ${a3.length}
Opening: ${a3.open}

FINAL CHECK — before outputting, confirm every review:
✓ Correct business type language (${typeConfig.label})
✓ ${stars}★ tone — no inflation, no deflation
✓ Sounds like a local from ${cityName}, not a tourist
✓ Different first word, different structure, different length from the other two
✓ Business name exactly once, spelled: "${businessName}"
✓ City name maximum once
✓ Zero banned words, zero emojis, zero corporate language
✓ SEO: business name + city embedded naturally
✓ No invented negatives for 4–5★

Output JSON only.`;

  // ── CALL GPT-4o ─────────────────────────────────────────────────────────────
  try {
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model:           "gpt-4o",
      response_format: { type: "json_object" },
      temperature:     0.75,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return NextResponse.json({ ok: false, message: "Empty model response." }, { status: 502 });

    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { return NextResponse.json({ ok: false, message: "Model returned invalid JSON." }, { status: 502 }); }

    const reviews = Array.isArray(parsed.reviews)
      ? parsed.reviews.map(r => stripEmojis(String(r).trim())).filter(r => r.length > 20)
      : [];

    if (reviews.length < 3)
      return NextResponse.json({ ok: false, message: "Model returned fewer than 3 reviews. Please try again." }, { status: 502 });

    return NextResponse.json({ ok: true, reviews: reviews.slice(0, 3) });

  } catch (e) {
    return NextResponse.json({
      ok:      false,
      message: e instanceof Error ? e.message : "OpenAI request failed",
    }, { status: 502 });
  }
}
