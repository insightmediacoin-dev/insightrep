import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase-admin";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const FREE_MONTHLY_LIMIT = 10;
const RATE_LIMIT_MAX     = 5;
const RATE_LIMIT_WINDOW  = 60; // minutes
const ARCHETYPE_MEMORY   = 15; // how many recent archetype picks to remember per business

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

// Food-type businesses are the only ones where dining_vibe / price_range /
// food-specific special_features / dinner-time framing are meaningful.
const FOOD_TYPES = new Set(["restaurant", "cafe", "bar", "bakery", "fastfood", "dhaba"]);

function getType(type) {
  const key = String(type ?? "").trim().toLowerCase();
  return BUSINESS_TYPES[key] ?? BUSINESS_TYPES.other;
}

function isFoodType(type) {
  return FOOD_TYPES.has(String(type ?? "").trim().toLowerCase());
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

// Universal features — safe for ANY business type.
const UNIVERSAL_FEATURE_MAP = {
  parking:      "parking available",
  delivery:     "home delivery",
  late_night:   "open late night",
  wifi:         "free Wi-Fi",
  pet_friendly: "pet friendly",
};

// Food-only features — dropped entirely for non-food types, even if stale
// data exists on the row.
const FOOD_ONLY_FEATURE_MAP = {
  rooftop:        "rooftop seating",
  live_music:     "live music",
  private_dining: "private dining available",
  outdoor:        "outdoor seating",
  pure_veg:       "pure vegetarian",
};

// ─────────────────────────────────────────────────────────────────────────────
// PURCHASE FREQUENCY — how often a real customer of this business type
// actually returns. Drives archetype selection and banned repeat-visit
// language. Classified once per business by GPT-4o-mini, then cached on the
// business row (businesses.purchase_frequency) — never re-classified unless
// manually cleared.
// ─────────────────────────────────────────────────────────────────────────────

const VALID_FREQUENCIES = ["high_frequency", "infrequent_considered", "recurring_spaced"];

const PURCHASE_FRAMING = {
  high_frequency: "This is a business customers visit repeatedly. Repeat-visit language ('been coming here for months', 'my regular spot', 'come here every week') is natural and allowed.",
  infrequent_considered: "This is a considered, infrequent purchase — most customers buy once, or once every several years. NEVER claim repeat visits, being a 'regular', or 'coming back often'. Instead, reviewers should reference: comparing options before deciding, the specific reason they chose this business over others, how the product/service has performed since purchase, or that they'd point a friend making the same kind of purchase toward this business.",
  recurring_spaced: "Customers return occasionally, but on a long or irregular cycle — NOT weekly or monthly. Light repeat framing is fine ('second time I've used them', 'been here a couple of times over the year') but never imply frequent or regular visits.",
};

const FREQUENCY_BANNED_PHRASES = {
  infrequent_considered: [
    "been coming here", "regular here", "every time i visit", "my go-to",
    "come here often", "keep coming back", "coming here for months",
    "coming here for years", "whenever i need", "always come here",
  ],
};

async function classifyPurchaseFrequency(openai, biz) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `Classify a business into exactly one purchase-frequency category based on real customer behavior.

Categories:
- high_frequency: customers visit repeatedly — daily, weekly, or monthly (e.g. restaurant, cafe, gym, salon, grocery/kirana store)
- infrequent_considered: customers make a rare, considered purchase — often once, after comparing options (e.g. mattress, furniture, jewelry, electronics, real estate, appliances, home renovation)
- recurring_spaced: customers return occasionally but on a long, irregular cycle — not weekly (e.g. clinic, optician, tailor, education institute, travel agency)

Examples:
"Mattress and furniture retail store" -> infrequent_considered
"Multi-cuisine restaurant" -> high_frequency
"Physiotherapy clinic" -> recurring_spaced
"Jewelry showroom" -> infrequent_considered
"Neighborhood gym" -> high_frequency
"Driving school / coaching institute" -> recurring_spaced
"Grocery / kirana store" -> high_frequency
"Electronics showroom (TVs, appliances)" -> infrequent_considered
"Optician / eyewear store" -> recurring_spaced
"Travel agency" -> recurring_spaced
"Salon / spa" -> high_frequency

Return ONLY JSON: { "frequency": "high_frequency" | "infrequent_considered" | "recurring_spaced" }`,
        },
        {
          role: "user",
          content: `Business type: ${biz.business_type || "unknown"}\nDescription: ${biz.description || "none"}\nProducts/services: ${biz.products || "none"}`,
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(raw);
    if (VALID_FREQUENCIES.includes(parsed.frequency)) return parsed.frequency;
  } catch {}
  return "high_frequency"; // safe default — matches pre-existing behavior
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWER ARCHETYPES — split by purchase frequency
// SHARED archetypes contain no frequency-specific claims and are reused
// across all three pools. HIGH_FREQ_ONLY / INFREQUENT_ONLY / RECURRING_ONLY
// are the frequency-specific voices layered on top.
// ─────────────────────────────────────────────────────────────────────────────

const SHARED_ARCHETYPES = {
  straight_shooter: {
    id: "straight_shooter",
    voice: "Blunt. Local. High standards. Short verdict — no decoration.",
    length: "1–2 sentences max.",
    open: "Start with a direct verdict: 'Solid place', 'Good [service/food/product], fair price'.",
  },
  detail_noticer: {
    id: "detail_noticer",
    voice: "Remembers a specific moment or detail — one thing that stood out. Makes the review feel real and firsthand.",
    length: "3–4 sentences.",
    open: "Start with the specific thing that impressed: 'What stood out was...', or dive straight into the detail.",
  },
  value_assessor: {
    id: "value_assessor",
    voice: "Fair-minded. Thinks about quality vs price. Mentions whether it felt worth it — not cheap, just honest.",
    length: "2–3 sentences.",
    open: "Start with value: 'Good value for what you get', 'Worth every rupee'.",
  },
  vibe_noticer: {
    id: "vibe_noticer",
    voice: "Pays attention to atmosphere — how the place feels, staff attitude, energy. Mentions vibe alongside the product or service.",
    length: "2–3 sentences.",
    open: "Start with the atmosphere: 'The vibe here is...', 'Really like the feel of this place'.",
  },
  first_timer_converted: {
    id: "first_timer_converted",
    voice: "First visit. Came on a recommendation or just tried it. Pleasantly impressed. Ends with intent to return or recommend.",
    length: "2–3 sentences.",
    open: "Start with first visit: 'First time here', 'Came on a friend's tip'.",
  },
  group_visitor: {
    id: "group_visitor",
    voice: "Came with friends, family or colleagues. Cares whether the place handled the group well and if everyone left happy.",
    length: "2–3 sentences.",
    open: "Start with the group: 'Came with family', 'Brought my team here', 'Group of six of us came'.",
  },
  occasion_visitor: {
    id: "occasion_visitor",
    voice: "Came for a specific occasion or need. Mentions it naturally and how the place suited it.",
    length: "2–3 sentences.",
    open: "Start with the occasion: 'Needed this for a birthday', 'Was looking for this for a specific purpose'.",
  },
};

const HIGH_FREQ_ONLY = {
  repeat_local: {
    id: "repeat_local",
    voice: "Has visited multiple times. Speaks with quiet confidence. No need to over-explain — just shares what they know.",
    length: "2–3 sentences.",
    open: "Start with repeat visits: 'Been coming here for months', 'Third time this year'.",
  },
  casual_local: {
    id: "casual_local",
    voice: "Relaxed, conversational. Lives nearby. Writes like texting a friend — honest, natural, unbothered.",
    length: "1–2 sentences.",
    open: "Start casually: 'Pretty solid spot', 'Honestly one of the better [places] around here'.",
  },
};

const INFREQUENT_ONLY = {
  researched_before_buying: {
    id: "researched_before_buying",
    voice: "Compared a few options or stores before deciding. Explains briefly why they picked this one — price, honesty, quality, no pressure from staff.",
    length: "2–3 sentences.",
    open: "Start with the comparison or decision: 'Checked a couple of places before deciding on', 'Compared prices at two other stores first'.",
  },
  decision_confidence: {
    id: "decision_confidence",
    voice: "Focuses on what made the buying decision easy — honest advice from staff, no pushy upselling, clear pricing. Practical, reassured tone.",
    length: "2–3 sentences.",
    open: "Start with the deciding factor: 'What sealed it for me was...', 'No pressure to upgrade, straightforward pricing'.",
  },
  post_purchase_performance: {
    id: "post_purchase_performance",
    voice: "Bought a while ago and is reviewing based on how it has held up or performed since. Never claims repeat visits — this is about product/service quality after the purchase.",
    length: "2–3 sentences.",
    open: "Start referencing time since purchase: 'It's been a few months since I bought this and', 'Still holding up well since I got it from'.",
  },
  referral_intent: {
    id: "referral_intent",
    voice: "Frames the review as advice to someone else considering the same purchase — not personal repeat intent. Warm, helpful tone.",
    length: "2–3 sentences.",
    open: "Start with advice framing: 'If you're looking for a', 'Would point anyone shopping for this kind of thing toward'.",
  },
};

const RECURRING_ONLY = {
  soft_repeat: {
    id: "soft_repeat",
    voice: "Has used this business more than once, but spaced out over months — never implies weekly or frequent visits.",
    length: "2–3 sentences.",
    open: "Start with light repeat: 'Second time I've used', 'Been back here a couple of times over the year'.",
  },
  practical_local: {
    id: "practical_local",
    voice: "Relaxed, practical tone. Mentions they'll return when they next need the service — not implying frequent visits.",
    length: "1–2 sentences.",
    open: "Start casually with future intent: 'Would go back here when I next need', 'Straightforward experience, no complaints'.",
  },
};

const ARCHETYPE_POOLS = {
  high_frequency:         [...Object.values(SHARED_ARCHETYPES), ...Object.values(HIGH_FREQ_ONLY)],
  infrequent_considered:  [...Object.values(SHARED_ARCHETYPES), ...Object.values(INFREQUENT_ONLY)],
  recurring_spaced:       [...Object.values(SHARED_ARCHETYPES), ...Object.values(RECURRING_ONLY)],
};

// Diversity memory: exclude archetypes used recently for this business so
// the same customer voice doesn't repeat across nearby scans. Falls back to
// the full pool if too few archetypes remain after exclusion.
function pickArchetypesWithMemory(pool, recentIds, n) {
  const recent = Array.isArray(recentIds) ? recentIds : [];
  const filtered = pool.filter(a => !recent.includes(a.id));
  const source = filtered.length >= n ? filtered : pool;
  return pickN(source, n);
}

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
// TIME CONTEXT — split food vs non-food so "early dinner" / "late dinner"
// never leaks into a salon, clinic, gym, or retail review.
// ─────────────────────────────────────────────────────────────────────────────

const TIME_CONTEXT_FOOD = {
  morning:   "morning (6am–11am) — breakfast, early outing, morning coffee",
  afternoon: "afternoon (11am–4pm) — lunch, afternoon break, midday visit",
  evening:   "evening (4pm–8pm) — early dinner, post-work, evening outing",
  night:     "night (8pm–12am) — late dinner, night out, celebration, catch-up",
};

const TIME_CONTEXT_NEUTRAL = {
  morning:   "morning (6am–11am) — early in the day",
  afternoon: "afternoon (11am–4pm) — midday",
  evening:   "evening (4pm–8pm) — after work hours",
  night:     "night (8pm–12am) — later in the day",
};

// ─────────────────────────────────────────────────────────────────────────────
// SEO INJECTION — keyword rotation instead of random pick, so coverage is
// even across all of a business's keywords instead of leaving some at zero.
// ─────────────────────────────────────────────────────────────────────────────

function pickLeastUsedKeyword(keywords, usage) {
  if (!keywords || keywords.length === 0) return null;
  const safeUsage = usage && typeof usage === "object" ? usage : {};
  let min = Infinity;
  let candidates = [];
  for (const k of keywords) {
    const count = safeUsage[k] || 0;
    if (count < min) { min = count; candidates = [k]; }
    else if (count === min) { candidates.push(k); }
  }
  return pick(candidates);
}

function buildSeoRule(keywords, chosenKeyword, businessName, cityName) {
  const baseRule = `Business name "${businessName}" appears exactly ONCE per review — spelled correctly every time. City "${cityName}" appears maximum ONCE per review. Both are critical for local SEO — they must appear naturally inside a sentence, never as a standalone label.`;

  if (!keywords || keywords.length === 0 || !chosenKeyword) {
    return `SEO RULES:\n${baseRule}\nNo additional keywords provided — business name and city are your SEO anchors.`;
  }

  return `SEO RULES:
${baseRule}

Primary keyword to embed: "${chosenKeyword}"
- Use this keyword in EXACTLY ONE of the 3 reviews
- It must appear inside a naturally flowing sentence — NEVER as a title-case label or standalone phrase
- WRONG: "Best Retail Store Sambhajinagar" | RIGHT: "one of the better spots I've found in Sambhajinagar for this"
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

  const { businessId, rating, aspects, customNote, moodLabel, productFocus } = body;

  if (!businessId || typeof businessId !== "string")
    return NextResponse.json({ ok: false, message: "businessId required." }, { status: 400 });

  const stars = Number(rating);
  if (!Number.isInteger(stars) || stars < 3 || stars > 5)
    return NextResponse.json({ ok: false, message: "Rating must be 3, 4, or 5." }, { status: 400 });

  const rateCheck = await checkRateLimit(admin, ip, businessId);
  if (!rateCheck.allowed) {
    return NextResponse.json({ ok: false, message: "Too many requests. Please wait.", rateLimited: true }, { status: 429 });
  }

  // ── Fetch business ──────────────────────────────────────────────────────────
  const { data: biz, error: bizError } = await admin
    .from("businesses")
    .select("name, address, locality, gmb_link, keywords, products, plan, business_type, business_category, description, dining_vibe, price_range, customer_profiles, special_features, purchase_frequency, recent_archetype_ids, keyword_usage")
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

  const openai = new OpenAI({ apiKey });

  // ── Purchase frequency — classify once, cache forever ──────────────────────
  let purchaseFrequency = biz.purchase_frequency;
  if (!purchaseFrequency) {
    purchaseFrequency = await classifyPurchaseFrequency(openai, biz);
    admin.from("businesses").update({ purchase_frequency: purchaseFrequency }).eq("id", businessId).then(() => {}).catch(() => {});
  }

  // ── Build context ───────────────────────────────────────────────────────────
  const typeConfig = getType(biz.business_type);
  const foodType    = isFoodType(biz.business_type);

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

  // Filter special_features to what's valid for this business type
  const allowedFeatureMap = foodType
    ? { ...UNIVERSAL_FEATURE_MAP, ...FOOD_ONLY_FEATURE_MAP }
    : UNIVERSAL_FEATURE_MAP;
  const filteredFeatures = specialFeatures.filter(f => allowedFeatureMap[f]);

  // Build rich business profile — dining_vibe/price_range only for food types
  const profileLines = [
    biz.description?.trim() ? biz.description.trim() : null,
    foodType && biz.dining_vibe ? `Style: ${VIBE_LABELS[biz.dining_vibe] || biz.dining_vibe}` : null,
    foodType && biz.price_range ? `Price range: ${PRICE_LABELS[biz.price_range] || biz.price_range}` : null,
    customerProfiles.length > 0 ? `Typical customers: ${customerProfiles.map(p => PROFILE_MAP[p] || p).filter(Boolean).join(", ")}` : null,
    filteredFeatures.length  > 0 ? `Special features: ${filteredFeatures.map(f => allowedFeatureMap[f]).join(", ")}` : null,
    products.length > 0 ? `Notable items: ${products.slice(0, 6).join(", ")}` : null,
  ].filter(Boolean);

  const businessProfile = profileLines.join("\n");
  const hasProfile      = profileLines.length > 0;

  // Customer input
  const tags         = Array.isArray(aspects) ? aspects.filter(a => typeof a === "string") : [];
  const customerNote = typeof customNote === "string" ? customNote.trim().slice(0, 300) : "";
  const noteIsUsable = customerNote.length >= 25;

  const aspectLabel = tags.length > 0 ? tags.join(", ") : "overall experience";

  const focusedProduct = typeof productFocus === "string" ? productFocus.trim() : "";
  const hasProductFocus = focusedProduct.length > 0;

  // Time context — food gets dinner/lunch framing, everyone else gets neutral framing
  const nowIST    = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hourIST   = nowIST.getHours();
  const isWeekend = nowIST.getDay() === 0 || nowIST.getDay() === 6;
  const timeSlot  = getTimeSlot(hourIST);
  const TIME_CONTEXT = foodType ? TIME_CONTEXT_FOOD : TIME_CONTEXT_NEUTRAL;

  const DAY_CONTEXT = isWeekend
    ? "Weekend — leisure and family time are natural."
    : "Weekday — work-adjacent visits and quick stops are natural.";

  // ── Archetypes — frequency pool + diversity memory ─────────────────────────
  const archetypePool = ARCHETYPE_POOLS[purchaseFrequency] || ARCHETYPE_POOLS.high_frequency;
  const [a1, a2, a3] = pickArchetypesWithMemory(archetypePool, biz.recent_archetype_ids, 3);

  const calibration = STAR_RULES[stars];

  // ── SEO keyword — least-used rotation ───────────────────────────────────────
  const chosenKeyword = pickLeastUsedKeyword(keywords, biz.keyword_usage);
  const seoRule = buildSeoRule(keywords, chosenKeyword, businessName, cityName);

  // ── Product reference instruction ─────────────────────────────────────────
  const instructionParts = [];

  if (hasProductFocus) {
    instructionParts.push(
      `Customer specifically selected this product/service: "${focusedProduct}". ` +
      `This is MANDATORY — all 3 reviews must mention "${focusedProduct}" by name or a very close natural variant (e.g. paraphrasing is fine, omitting it is not). ` +
      `Vary the phrasing and sentence position across the 3 reviews so it doesn't feel repetitive or copy-pasted, but every single review must reference it. ` +
      `Other items from the business profile may appear only as brief secondary context — never replace the focused product as the main subject.`
    );
  }

  if (noteIsUsable) {
    instructionParts.push(
      `Customer's own note: "${customerNote}"\n` +
      `Use ONLY what they specifically mentioned, in addition to the product focus above if present. Distribute details across the 3 reviews — never repeat the same detail twice. If their note is vague, fall back to the business profile instead.`
    );
  } else if (!hasProductFocus && products.length > 0) {
    instructionParts.push(
      `Notable items available to reference: [${products.join(", ")}]\n` +
      `Use maximum 1 item name across all 3 reviews combined. Only if it fits naturally. Never force it. Never repeat.`
    );
  } else if (!hasProductFocus) {
    instructionParts.push(
      `No specific items available. Write about ${typeConfig.reviewing} in natural general terms. Never invent specific item names.`
    );
  }

  const productInstruction = instructionParts.join("\n\n");

  // Banned phrases: business type + purchase frequency
  const frequencyBanned = FREQUENCY_BANNED_PHRASES[purchaseFrequency] || [];
  const combinedBanned  = [...typeConfig.banned, ...frequencyBanned];
  const bannedLine = combinedBanned.length > 0
    ? `\nPERMANENTLY BANNED phrases for this business (context-specific — must never appear):\n${combinedBanned.map(b => `"${b}"`).join(", ")}`
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

━━━ PURCHASE PATTERN ━━━
${PURCHASE_FRAMING[purchaseFrequency]}

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
- Title-case SEO phrases: "Best Retail Store Sambhajinagar" — never
- Generic ad-copy closers: "must-visit for anyone looking for [X] solutions", "the go-to place for quality [X]" — reads like marketing copy, not a real customer
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
${hasProductFocus ? `- Product/service selected by customer: "${focusedProduct}" (MUST appear in all 3 reviews)` : ""}
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
✓ Matches the purchase pattern rule above — no false repeat-visit claims
✓ Sounds like a local from ${cityName}, not a tourist
✓ Different first word, different structure, different length from the other two
✓ Business name exactly once, spelled: "${businessName}"
✓ City name maximum once
✓ Zero banned words, zero emojis, zero corporate/ad-copy language
✓ SEO: business name + city embedded naturally
✓ No invented negatives for 4–5★
${hasProductFocus ? `✓ MANDATORY: "${focusedProduct}" (or a natural variant) appears in ALL 3 reviews — this is non-negotiable since the customer explicitly selected it` : ""}

Output JSON only.`;

  // ── CALL GPT-4o ─────────────────────────────────────────────────────────────
  try {
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

    let reviews = Array.isArray(parsed.reviews)
      ? parsed.reviews.map(r => stripEmojis(String(r).trim())).filter(r => r.length > 20)
      : [];

    if (hasProductFocus && reviews.length >= 3) {
      const focusLower = focusedProduct.toLowerCase();
      const missingCount = reviews.filter(r => !r.toLowerCase().includes(focusLower)).length;
      if (missingCount > 0) {
        const retryCompletion = await openai.chat.completions.create({
          model:           "gpt-4o",
          response_format: { type: "json_object" },
          temperature:     0.6,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user",   content: userPrompt + `\n\nSTRICT RETRY: Your previous attempt did not mention "${focusedProduct}" in every review. This time, literally include the words "${focusedProduct}" (or a very close variant) in EVERY SINGLE review — check each one before responding.` },
          ],
        });
        const retryRaw = retryCompletion.choices[0]?.message?.content;
        if (retryRaw) {
          try {
            const retryParsed = JSON.parse(retryRaw);
            const retryReviews = Array.isArray(retryParsed.reviews)
              ? retryParsed.reviews.map(r => stripEmojis(String(r).trim())).filter(r => r.length > 20)
              : [];
            if (retryReviews.length >= 3) reviews = retryReviews;
          } catch {}
        }
      }
    }

    if (reviews.length < 3)
      return NextResponse.json({ ok: false, message: "Model returned fewer than 3 reviews. Please try again." }, { status: 502 });

    reviews = reviews.slice(0, 3);

    // ── Post-generation memory updates (fire-and-forget, don't block response) ──
    const usedArchetypeIds = [a1.id, a2.id, a3.id];
    const updatedRecent = [
      ...(Array.isArray(biz.recent_archetype_ids) ? biz.recent_archetype_ids : []),
      ...usedArchetypeIds,
    ].slice(-ARCHETYPE_MEMORY);

    const updatedKeywordUsage = { ...(biz.keyword_usage && typeof biz.keyword_usage === "object" ? biz.keyword_usage : {}) };
    if (chosenKeyword && reviews.some(r => r.toLowerCase().includes(chosenKeyword.toLowerCase()))) {
      updatedKeywordUsage[chosenKeyword] = (updatedKeywordUsage[chosenKeyword] || 0) + 1;
    }

    admin.from("businesses")
      .update({ recent_archetype_ids: updatedRecent, keyword_usage: updatedKeywordUsage })
      .eq("id", businessId)
      .then(() => {})
      .catch(() => {});

    // meta is parallel to reviews — index i corresponds to reviews[i].
    // Use this to log which archetype was chosen when a customer copies a
    // review (see note below on wiring this into the copy-logging route).
    const meta = usedArchetypeIds.map(id => ({ archetypeId: id }));

    return NextResponse.json({ ok: true, reviews, meta });

  } catch (e) {
    return NextResponse.json({
      ok:      false,
      message: e instanceof Error ? e.message : "OpenAI request failed",
    }, { status: 502 });
  }
}