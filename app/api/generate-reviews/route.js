import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase-admin";

const FREE_MONTHLY_LIMIT = 10;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Strip emojis
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

// ─── TIME SLOT DETECTION ──────────────────────────────────────────────────────
// Returns: morning | afternoon | evening | night
function getTimeSlot(hour) {
  if (hour >= 6  && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "afternoon";
  if (hour >= 16 && hour < 20) return "evening";
  return "night"; // 20:00 – 05:59
}

// ─── TIME-AWARE ARCHETYPES ────────────────────────────────────────────────────
// Each slot has 3 pools of 3 archetypes each.
// The pool is randomly rotated within the slot — so variety remains.

const TIME_ARCHETYPES = {

  morning: [
    [
      {
        name: "The Early Regular",
        voice: "Comes here most mornings before work or college. Knows the menu well. Short, confident, habitual. Writes like someone typing quickly before heading out.",
        length: "1-2 sentences max. Under 25 words.",
        opener: "Start with their morning habit: 'Start most mornings here', 'Been coming here for breakfast for months'.",
      },
      {
        name: "The Breakfast Explorer",
        voice: "Tried this place for breakfast on a recommendation or while passing by. Evaluates the morning menu, freshness, speed of service. Practical and honest.",
        length: "3-4 sentences. Covers food, speed, and value.",
        opener: "Start with why they came for breakfast: 'Came here for an early breakfast' or 'Been wanting to try their morning menu'.",
      },
      {
        name: "The Morning Family Person",
        voice: "Brought family or kids for a weekend morning meal. Relaxed energy. Cares about portion size and whether kids were happy. Warm tone.",
        length: "2-3 sentences. Warm and easy.",
        opener: "Start with the family context: 'Brought the kids here for a Sunday breakfast' or 'Came with my partner for a morning outing'.",
      },
    ],
    [
      {
        name: "The Pre-Work Coffee Person",
        voice: "Stops here every morning for coffee or a quick bite before work. Focused on speed, taste consistency, and whether it sets the day up right.",
        length: "1-2 sentences only. Punchy.",
        opener: "Start with the coffee or quick bite: 'The coffee here is the reason I come back every morning'.",
      },
      {
        name: "The Weekday Breakfast Regular",
        voice: "Has a routine — same time, same order most mornings. Writes with the authority of someone who knows this place inside out. No surprises, just consistency.",
        length: "3-4 sentences. Specific and grounded.",
        opener: "Start with the routine: 'Been coming here on weekday mornings for a while now'.",
      },
      {
        name: "The Weekend Brunch Person",
        voice: "Came for a relaxed weekend brunch — no rush. Writes about the full morning experience: food, atmosphere, how unhurried it felt. Ends with whether it is a good weekend spot.",
        length: "2-3 sentences. Relaxed and warm.",
        opener: "Start with the weekend energy: 'Perfect spot for a slow Saturday morning' or 'Came here for a lazy Sunday brunch'.",
      },
    ],
    [
      {
        name: "The No-Nonsense Morning Regular",
        voice: "Direct, experienced. Comes here regularly in the morning. Doesn't waste words — just says if the food and service were on point. Confident local voice.",
        length: "1-2 sentences. Blunt and credible.",
        opener: "Start with a direct verdict: 'Good breakfast spot', 'Solid morning option in the area'.",
      },
      {
        name: "The Morning Meeting Person",
        voice: "Uses this place for early morning catch-ups, informal meetings, or working remotely. Cares about Wi-Fi, seating comfort, noise level, and quality of coffee.",
        length: "3-4 sentences. Practical and specific.",
        opener: "Start with the work-morning context: 'Come here for early morning work sessions' or 'Good spot for a morning catch-up'.",
      },
      {
        name: "The Morning Solo Person",
        voice: "Came alone for a peaceful breakfast — reading, thinking, or just unwinding before the day starts. Cares about atmosphere, comfort, and being left to enjoy the food.",
        length: "2-3 sentences. Calm and personal.",
        opener: "Start with the solo morning mood: 'Good spot to come alone and start the day slowly'.",
      },
    ],
  ],

  afternoon: [
    [
      {
        name: "The Quick Lunch Person",
        voice: "Came for a fast, reliable lunch — probably from a nearby office or college. Cares about speed, portion size, and value. No time to waste. Short and direct.",
        length: "1-2 sentences max. Under 25 words.",
        opener: "Start with the lunch context: 'Solid lunch spot', 'Good quick lunch option nearby'.",
      },
      {
        name: "The Working Professional",
        voice: "Works in the city, comes for lunch meetings or solo work breaks. Values consistent quality, fast service, and whether it works for a professional setting.",
        length: "3-4 sentences. Practical and specific.",
        opener: "Start with the professional context: 'Been coming here for lunch meetings' or 'Regular lunch spot when working nearby'.",
      },
      {
        name: "The Post-College Lunch Group",
        voice: "Came with college friends for lunch after class. Budget-conscious but values taste and portions. Casual and honest. Uses natural young language.",
        length: "2-3 sentences. Casual and real.",
        opener: "Start with the group context: 'Came here with friends after class' or 'Good lunch spot near college'.",
      },
    ],
    [
      {
        name: "The Afternoon Tea / Snack Person",
        voice: "Came in the afternoon for coffee, tea, or a snack — not a full meal. Evaluates the café experience: ambiance, seating, beverage quality, and whether it is a good place to sit and relax.",
        length: "1-2 sentences. Light and easy.",
        opener: "Start with the afternoon break context: 'Good spot for an afternoon coffee break'.",
      },
      {
        name: "The Repeat Lunch Visitor",
        voice: "Has been coming here for lunch regularly. Speaks with authority. Knows what to order. Mentions their usual and whether this visit matched expectations.",
        length: "3-4 sentences. Informed and confident.",
        opener: "Start with repeat visits: 'Been coming here for lunch for months' or 'Third time this week — says enough'.",
      },
      {
        name: "The Afternoon Family Visit",
        voice: "Brought family for a relaxed afternoon meal or outing. Not a special occasion — just a casual family visit. Warm tone, mentions if the kids or elders were comfortable.",
        length: "2-3 sentences. Warm and grounded.",
        opener: "Start with the family afternoon context: 'Brought the family here for a relaxed afternoon lunch'.",
      },
    ],
    [
      {
        name: "The No-Nonsense Lunch Regular",
        voice: "Direct, practical, experienced. Has eaten here many times for lunch. Gives a plain verdict on food, speed, and whether it is worth the price.",
        length: "1-2 sentences. Blunt and credible.",
        opener: "Start with a direct verdict: 'Reliable lunch spot', 'Good food, quick service'.",
      },
      {
        name: "The Client Lunch Person",
        voice: "Brought a client or colleague here for a lunch meeting. Cares about presentation, professionalism of the setting, and whether it left a good impression.",
        length: "3-4 sentences. Professional and composed.",
        opener: "Start with the work context: 'Brought a client here for lunch' or 'Used this place for a work lunch meeting'.",
      },
      {
        name: "The Solo Lunch Break Person",
        voice: "Took a lunch break alone from work or studying. Values speed, a quiet table, and food that doesn't disappoint. Simple and honest.",
        length: "2-3 sentences. Simple and real.",
        opener: "Start with the solo break: 'Came here for a quick solo lunch break' or 'Good spot to decompress during a work break'.",
      },
    ],
  ],

  evening: [
    [
      {
        name: "The Post-Work Local",
        voice: "Came straight after work — tired, hungry, looking for something reliable and satisfying. Writes like someone who just wants good food after a long day. Direct and honest.",
        length: "1-2 sentences max. Under 25 words.",
        opener: "Start with the post-work context: 'Came here straight after work', 'Good spot to unwind after a long day'.",
      },
      {
        name: "The Early Dinner Person",
        voice: "Came for an early dinner — pre-cinema, pre-event, or just a relaxed early evening meal. Writes about the food and service quality. Not in a rush but not lingering either.",
        length: "3-4 sentences. Balanced and specific.",
        opener: "Start with the early dinner context: 'Came here before catching a movie' or 'Stopped in for an early dinner'.",
      },
      {
        name: "The Evening Family Dinner",
        voice: "Brought the family for a weekday or weekend evening dinner. Practical — cares about portions, variety, kids-friendliness, and whether the family left happy.",
        length: "2-3 sentences. Warm and family-focused.",
        opener: "Start with the family evening: 'Brought the family here for dinner' or 'Came with my parents for an evening meal'.",
      },
    ],
    [
      {
        name: "The Colleagues After-Work Outing",
        voice: "Came with work colleagues for an after-work meal or drinks. Relaxed but professional tone. Writes about whether the place worked well for a group and if the vibe suited the occasion.",
        length: "1-2 sentences. Easy and social.",
        opener: "Start with the after-work group: 'Came here with colleagues after work' or 'Good spot for an after-work outing'.",
      },
      {
        name: "The Evening Regular",
        voice: "Comes here often for evening meals. Knows the place well. Writes with the confidence of someone who has been many times — mentions what they always order or what stood out this visit.",
        length: "3-4 sentences. Specific and informed.",
        opener: "Start with the evening habit: 'Been coming here for evening meals for a while' or 'Regular evening spot for us'.",
      },
      {
        name: "The Couples Evening Outing",
        voice: "Came with partner for a relaxed evening meal — not a formal date, just a nice evening out. Mentions the atmosphere, food quality, and whether it felt like a good spot for couples.",
        length: "2-3 sentences. Warm and personal.",
        opener: "Start with the couple context: 'Came here with my partner for a quiet evening dinner' or 'Good spot for a relaxed evening out with someone'.",
      },
    ],
    [
      {
        name: "The No-Nonsense Evening Regular",
        voice: "Straight to the point. Has eaten here many evenings. Gives a plain verdict — food quality, service, and whether it is worth coming back to.",
        length: "1-2 sentences. Blunt and credible.",
        opener: "Start with a direct verdict: 'Good evening dinner spot', 'Solid place for a weekday dinner'.",
      },
      {
        name: "The Evening Friend Group",
        voice: "Came with a group of friends for an evening meal — casual hangout, not a big celebration. Mentions how well the place handled the group, and if everyone left satisfied.",
        length: "3-4 sentences. Social and honest.",
        opener: "Start with the friends context: 'Came here with a group of friends for dinner' or 'Good spot for an evening hangout with friends'.",
      },
      {
        name: "The Solo Evening Diner",
        voice: "Came alone for a peaceful evening meal — after work or just for some personal time. Values good food, comfortable seating, and not being rushed. Calm and reflective tone.",
        length: "2-3 sentences. Calm and personal.",
        opener: "Start with the solo evening: 'Came here alone for a quiet evening meal' or 'Good spot to have dinner by yourself'.",
      },
    ],
  ],

  night: [
    [
      {
        name: "The Night Out Local",
        voice: "Out for the evening — dinner with friends, catching up, or celebrating something small. Writes with energy but not over the top. Mentions the vibe, food quality, and whether it was worth staying out late for.",
        length: "1-2 sentences max. Punchy and energetic.",
        opener: "Start with the night out: 'Great spot for a night out', 'Came here for a late dinner with friends'.",
      },
      {
        name: "The Birthday or Celebration Person",
        voice: "Came for a birthday, anniversary, or small celebration. Mentions the occasion naturally. Writes about how the restaurant handled the group, food quality, and overall experience for the occasion.",
        length: "3-4 sentences. Personal and celebratory.",
        opener: "Start with the occasion: 'Came here for a birthday dinner', 'Celebrated a special occasion here last night'.",
      },
      {
        name: "The Late Dinner Couple",
        voice: "Came for a proper date night — late dinner, relaxed atmosphere, wanting a good experience. Evaluates ambiance, food quality, and whether it felt like the right setting for a date.",
        length: "2-3 sentences. Warm and romantic without being dramatic.",
        opener: "Start with the date context: 'Came here for a date night dinner', 'Good spot for a late romantic dinner'.",
      },
    ],
    [
      {
        name: "The Large Group Night Out",
        voice: "Came with a big group — mixed crowd, noisy, celebratory. Cares about whether the restaurant could handle the numbers, if food came together, and whether everyone had a good time.",
        length: "1-2 sentences. Social and direct.",
        opener: "Start with the group: 'Came here with a large group for dinner', 'Booked a table for 12 here'.",
      },
      {
        name: "The Night Regular",
        voice: "Comes here regularly for late dinners or night outings. Knows the menu well. Writes with the comfort of someone who keeps returning — compares this night to previous visits.",
        length: "3-4 sentences. Confident and specific.",
        opener: "Start with the regular night visit: 'Been coming here for late dinners for months' or 'Third time this month — still impressed'.",
      },
      {
        name: "The Post-Event Dinner Group",
        voice: "Came here after a movie, concert, match, or event. Hungry, in good spirits, looking for a satisfying late dinner. Mentions the post-event context naturally and how well the restaurant delivered.",
        length: "2-3 sentences. Upbeat and satisfied.",
        opener: "Start with the post-event context: 'Came here after a movie for a late dinner' or 'Stopped here after an event with friends'.",
      },
    ],
    [
      {
        name: "The No-Nonsense Night Diner",
        voice: "Direct and confident. Has been here late nights before. Gives a plain honest verdict — food quality, service speed at night, and whether the place holds up late.",
        length: "1-2 sentences. Blunt and credible.",
        opener: "Start with a direct verdict: 'Solid late-night dinner option', 'Holds up well even at night'.",
      },
      {
        name: "The Friends Catch-Up Group",
        voice: "Came with a group of close friends for dinner — catching up after a long time or just a regular get-together. Casual, warm, mentions if the setting worked for conversations and long stays.",
        length: "3-4 sentences. Social and warm.",
        opener: "Start with the catch-up: 'Came here for a friends catch-up dinner', 'Got the whole group together here for dinner'.",
      },
      {
        name: "The Solo Late Diner",
        voice: "Came alone late in the evening — long day, needed a good meal, no one to coordinate with. Values good food, attentive but not intrusive service, and a comfortable solo experience.",
        length: "2-3 sentences. Calm and grounded.",
        opener: "Start with the solo night context: 'Came here alone for a late dinner after a long day'.",
      },
    ],
  ],
};

// ─── STAR CALIBRATION ─────────────────────────────────────────────────────────
const STAR_CALIBRATION = {
  5: {
    sentiment: "absolutely loved the experience — everything was great",
    tone: "Pure positive. Strong enthusiasm. Genuine recommendation. Zero complaints or hedging.",
    closing: "Clear 'will be back' or strong recommendation. High conviction ending.",
    forbidden: "ZERO negatives. ZERO 'but'. ZERO 'however'. ZERO hedging. Nothing that sounds remotely like a complaint or reservation.",
  },
  4: {
    sentiment: "really enjoyed it — great experience overall with one small logistical note allowed",
    tone: "Strongly positive throughout. One very minor calm logistical observation is optional. Examples: 'gets busy on weekends so book in advance', 'parking nearby is limited'. NEVER mention food quality or service issues for 4-star.",
    closing: "Confident positive recommendation. Clear verdict.",
    forbidden: "ZERO food complaints. ZERO service complaints. ZERO 'disappointed'. Minor logistical notes only — and only if completely natural.",
  },
  3: {
    sentiment: "honest mixed experience — some things worked, some fell short",
    tone: "Fair and balanced. Calm — not angry, not fake-positive. Like a trusted friend telling you the honest truth about a place. Acknowledges both what worked and what didn't.",
    closing: "'Worth trying once', 'has potential', 'decent for the price but has room to improve'. NEVER a strong positive close.",
    forbidden: "ZERO fake enthusiasm. ZERO 'amazing', 'best', 'must visit', 'highly recommend'. Tone must genuinely match 3 stars.",
  },
};

// ─── NEGATIVE HANDLING ────────────────────────────────────────────────────────
const NEGATIVE_HANDLING = `
CRITICAL — HOW TO HANDLE NEGATIVE ASPECTS OR CUSTOMER NOTES:

5-STAR: Completely ignore any negative mentioned. Focus entirely on positives.

4-STAR: You may include ONE very minor calm logistical note in ONE review only.
NEVER: "service was slow", "food was cold", "staff was rude", "waited too long"
ALLOWED: "gets busy during peak hours", "parking can be tricky", "good idea to book on weekends"
Must sound like a helpful tip — NOT a complaint. If it cannot be reframed, ignore it.

3-STAR: Acknowledge honestly but with complete calm. Reviewer is fair — not angry.
NEVER: "terrible service", "worst experience", "disgusting", "will never return"
ALLOWED: "wait time was longer than expected", "service became less attentive once it got busy", "food was okay but not their best", "has room to improve on consistency"
One honest observation per review is enough — do not pile on.

UNIVERSAL RULE: Every review — even 3-star — must leave the reader feeling this is a place worth considering.
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
  const hasCustomerNote = customerNote.length > 0;

  // ── Time-aware archetype selection ──────────────────────────────────────────
  const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hourIST = nowIST.getHours();
  const isWeekend = nowIST.getDay() === 0 || nowIST.getDay() === 6;
  const timeSlot = getTimeSlot(hourIST);
  const archetypes = pick(TIME_ARCHETYPES[timeSlot]);

  // ── Food rules ───────────────────────────────────────────────────────────────
  const foodRule = hasCustomerNote
    ? `Customer shared their own note: "${customerNote}". Use ONLY what they mentioned for food/product references — ignore the business product list. Distribute specific details across the 3 reviews — different detail in each, never repeat.`
    : featuredProducts.length > 0
      ? `Products you may reference: [${featuredProducts.join(", ")}]. Rules: (1) Use maximum 1 product name across all 3 reviews combined. (2) Only if it fits naturally. (3) Never force it. (4) Never repeat.`
      : `Do not mention any specific dish or product names. Speak naturally about the food or experience in general terms.`;

  // ── SEO keyword rules ────────────────────────────────────────────────────────
  const keywordRule = keywords.length > 0
    ? `SEO keywords available: [${keywords.join(", ")}]. Use maximum 1 keyword across all 3 reviews. Only inside a natural flowing sentence — never as a label, title, or standalone phrase. WRONG: "Best Restaurant Sambhajinagar". RIGHT: "one of the better spots I've found in Sambhajinagar". Skip entirely if it does not fit naturally.`
    : `No SEO keywords provided. Use business name and city naturally where it fits.`;

  // ── Time context label for prompt ────────────────────────────────────────────
  const timeContextLabel = {
    morning: "morning (6am–11am) — could be breakfast, morning coffee, early outing",
    afternoon: "afternoon (11am–4pm) — could be lunch, afternoon break, or midday visit",
    evening: "evening (4pm–8pm) — could be early dinner, post-work visit, or evening outing",
    night: "night (8pm–12am) — could be late dinner, night out, celebration, or friends catch-up",
  }[timeSlot];

  const weekdayContext = isWeekend
    ? "It is a WEEKEND — family outings, leisure visits, group catch-ups, and celebrations are all natural."
    : "It is a WEEKDAY — work lunches, post-work dinners, and quick visits are natural. Avoid heavy celebration tones.";

  const systemPrompt = `You are a specialist in writing authentic Google Maps reviews that sound exactly like real LOCAL customers — people who LIVE in the city, not tourists.

THE MOST IMPORTANT RULE: Every reviewer is a LOCAL RESIDENT of ${cityName}. They live here. They know this city. They chose ${exactBusinessName}. Write accordingly — familiar, confident, unbothered.

TIME CONTEXT — CRITICAL:
The customer is visiting at: ${timeContextLabel}
${weekdayContext}
Every review MUST feel natural for this time of day and day type. A morning review sounds completely different from a night review. A weekday lunch review is different from a weekend dinner review. Match the time perfectly.

PERMANENTLY BANNED WORDS AND PHRASES:
hidden gem, gem, nestled, vibrant atmosphere, cozy ambiance, culinary journey, gastronomic, exquisite, impeccable, commendable, exceptional, delightful, testament to, truly amazing, wonderful experience, stumbled upon, discovered this place, I recently visited, we decided to visit, I had the pleasure, one must try, highly recommend (3-star), truly, exemplary, above and beyond, top notch, would bring people here, would book again

BANNED STRUCTURAL PATTERNS:
- Opening with "I recently visited [name]" or "We decided to visit"
- Using the business name more than ONCE per review
- Using the city name more than ONCE per review
- Mentioning InsightRep, QR codes, or apps
- Using SEO keywords as title-case labels
- Using emojis anywhere

ABSOLUTE RULES:
1. Business name: "${exactBusinessName}" — exact, never shorten
2. Output ONLY valid JSON: { "reviews": ["r1", "r2", "r3"] }
3. Each review starts with a DIFFERENT first word
4. Each review feels written by a completely different LOCAL person
5. Star calibration: ${calibration.forbidden}
6. ${foodRule}
7. ${keywordRule}
8. Never abbreviate city names
9. Never hallucinate facts
10. No emojis anywhere

${NEGATIVE_HANDLING}`;

  const userPrompt = `Write 3 Google Maps reviews for ${exactBusinessName} — a ${businessTypeLabel} in ${cityName}.

STAR RATING: ${stars}/5
EMOTIONAL TONE: ${calibration.sentiment}
TONE GUIDE: ${calibration.tone}
CLOSING STYLE: ${calibration.closing}
WHAT THE CUSTOMER HIGHLIGHTED: ${aspectLabel}
${hasCustomerNote ? `CUSTOMER'S OWN WORDS: "${customerNote}"` : ""}

TIME OF VISIT: ${timeContextLabel}
DAY TYPE: ${isWeekend ? "Weekend" : "Weekday"}

CONTEXT: The reviewer is a LOCAL resident of ${cityName} visiting at this specific time. Their review must feel natural for ${timeSlot} — not like a generic review that could have been written at any time.

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
Target length: ${archetypes[3] ? archetypes[2].length : archetypes[2].length}
How to open: ${archetypes[2].opener}

---

SELF-CHECK before outputting — every review must pass ALL:
✓ Does it sound natural for ${timeSlot} time? Not generic — time-specific.
✓ Sounds like a LOCAL — not a tourist?
✓ Matches ${stars}-star tone exactly?
✓ Completely different from the other two in vocabulary and structure?
✓ Would a real person type this on their phone at this time?
✓ All banned words and patterns absent?
✓ Business name used exactly once and spelled: "${exactBusinessName}"?
✓ Negatives handled constructively if present?
✓ Zero emojis?

If ANY check fails — rewrite that review before outputting.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.88,
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

    if (reviews.length < 3)
      return NextResponse.json({ ok: false, message: "Model returned fewer than 3 reviews." }, { status: 502 });

    return NextResponse.json({ ok: true, reviews: reviews.slice(0, 3) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "OpenAI request failed";
    return NextResponse.json({ ok: false, message }, { status: 502 });
  }
}
