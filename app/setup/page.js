"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BUSINESS_ID_STORAGE_KEY,
  OWNER_IDENTIFIER_STORAGE_KEY,
} from "@/lib/phone";

const BUSINESS_TYPES = [
  { value: "restaurant", label: "Restaurant", category: "food", chips: ["Food", "Service", "Ambiance", "Value for money"] },
  { value: "cafe", label: "Cafe / Coffee Shop", category: "food", chips: ["Coffee", "Food", "Ambiance", "Service"] },
  { value: "hotel", label: "Hotel / Resort", category: "hospitality", chips: ["Rooms", "Service", "Cleanliness", "Location"] },
  { value: "bar", label: "Bar / Lounge / Nightclub", category: "hospitality", chips: ["Drinks", "Ambiance", "Service", "Music"] },
  { value: "bakery", label: "Bakery / Sweet Shop", category: "food", chips: ["Products", "Taste", "Freshness", "Service"] },
  { value: "fastfood", label: "Fast Food / QSR", category: "food", chips: ["Food", "Speed", "Value", "Service"] },
  { value: "dhaba", label: "Dhaba / Street Food", category: "food", chips: ["Food", "Taste", "Value", "Vibe"] },
  { value: "salon", label: "Salon / Spa / Beauty", category: "beauty", chips: ["Service", "Staff", "Cleanliness", "Value"] },
  { value: "gym", label: "Gym / Fitness Center", category: "fitness", chips: ["Equipment", "Trainers", "Cleanliness", "Membership"] },
  { value: "retail", label: "Retail Shop / Showroom", category: "retail", chips: ["Products", "Service", "Pricing", "Experience"] },
  { value: "clinic", label: "Clinic / Hospital / Pharmacy", category: "healthcare", chips: ["Doctor", "Staff", "Cleanliness", "Service"] },
  { value: "agency", label: "Agency / Professional Services", category: "agency", chips: ["Service", "Professionalism", "Results", "Communication"] },
  { value: "education", label: "School / Coaching / Institute", category: "education", chips: ["Teaching", "Faculty", "Facilities", "Results"] },
  { value: "travel", label: "Travel / Tour Operator", category: "travel", chips: ["Service", "Experience", "Value", "Guide"] },
  { value: "other", label: "Other (specify below)", category: "other", chips: ["Service", "Quality", "Experience", "Value"] },
];

const CUSTOMER_PROFILES = [
  { id: "professionals", label: "Working professionals" },
  { id: "families", label: "Families with kids" },
  { id: "students", label: "College students" },
  { id: "couples", label: "Couples / Date nights" },
  { id: "seniors", label: "Senior citizens" },
  { id: "mixed", label: "Mixed crowd" },
];

const DINING_VIBES = [
  { value: "casual", label: "Casual / Quick bites" },
  { value: "fine_dining", label: "Fine dining" },
  { value: "family", label: "Family style" },
  { value: "takeaway", label: "Takeaway focused" },
  { value: "cafe_hangout", label: "Cafe / Hangout spot" },
  { value: "bar_nightlife", label: "Bar / Nightlife" },
];

const PRICE_RANGES = [
  { value: "budget", label: "Under Rs.200/person" },
  { value: "mid", label: "Rs.200–500/person" },
  { value: "premium", label: "Rs.500–1000/person" },
  { value: "luxury", label: "Rs.1000+/person" },
];

const SPECIAL_FEATURES = [
  { id: "rooftop", label: "Rooftop seating" },
  { id: "live_music", label: "Live music" },
  { id: "private_dining", label: "Private dining" },
  { id: "outdoor", label: "Outdoor seating" },
  { id: "parking", label: "Parking available" },
  { id: "delivery", label: "Home delivery" },
  { id: "pure_veg", label: "Pure veg" },
  { id: "late_night", label: "Late night open" },
  { id: "wifi", label: "Free Wi-Fi" },
  { id: "pet_friendly", label: "Pet friendly" },
];

// Steps config
const STEPS = [
  { id: "basic",   label: "Basics",   icon: "🏪" },
  { id: "story",   label: "Your story", icon: "✍️" },
  { id: "vibe",    label: "Vibe",     icon: "✨" },
];

export default function SetupPage() {
  const router = useRouter();

  // Session
  const [ownerIdentifier, setOwnerIdentifier] = useState("");
  const [prefilling, setPrefilling]           = useState(true);
  const [isEdit, setIsEdit]                   = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");
  const [currentStep, setCurrentStep]         = useState(0);

  // Step 1 — Basics
  const [businessName,     setBusinessName]     = useState("");
  const [businessType,     setBusinessType]     = useState("restaurant");
  const [customCategory,   setCustomCategory]   = useState("");
  const [address,          setAddress]          = useState("");
  const [locality,         setLocality]         = useState("");
  const [googleReviewLink, setGoogleReviewLink] = useState("");

  // Step 2 — Your Story
  const [description,       setDescription]       = useState("");
  const [featuredProducts,  setFeaturedProducts]  = useState("");
  const [seoKeywords,       setSeoKeywords]       = useState("");
  const [customerProfiles,  setCustomerProfiles]  = useState([]);

  // Step 3 — Vibe
  const [diningVibe,      setDiningVibe]      = useState("");
  const [priceRange,      setPriceRange]      = useState("");
  const [specialFeatures, setSpecialFeatures] = useState([]);

  // Prefill on load
  useEffect(() => {
    const identifier = localStorage.getItem(OWNER_IDENTIFIER_STORAGE_KEY);
    if (!identifier) { router.replace("/login"); return; }
    setOwnerIdentifier(identifier);

    async function prefill() {
      try {
        const id = localStorage.getItem(BUSINESS_ID_STORAGE_KEY);
        const fetchUrl = id
          ? `/api/business/${id}`
          : `/api/business/lookup?identifier=${encodeURIComponent(identifier)}`;

        const res  = await fetch(fetchUrl);
        const data = await res.json();
        const biz  = data.business;

        if (res.ok && biz) {
          setBusinessName(biz.name ?? "");
          setAddress(biz.address ?? "");
          setLocality(biz.locality ?? "");
          setGoogleReviewLink(biz.gmb_link ?? "");
          setSeoKeywords(biz.keywords ?? "");
          setFeaturedProducts(biz.products ?? "");
          setBusinessType(biz.business_type ?? "restaurant");
          setDescription(biz.description ?? "");
          setDiningVibe(biz.dining_vibe ?? "");
          setPriceRange(biz.price_range ?? "");
          if (biz.business_type === "other") setCustomCategory(biz.business_category ?? "");
          if (biz.customer_profiles) {
            try { setCustomerProfiles(JSON.parse(biz.customer_profiles)); } catch {}
          }
          if (biz.special_features) {
            try { setSpecialFeatures(JSON.parse(biz.special_features)); } catch {}
          }
          setIsEdit(true);
          if (!id) localStorage.setItem(BUSINESS_ID_STORAGE_KEY, biz.id);
        }
      } catch {}
      finally { setPrefilling(false); }
    }
    prefill();
  }, [router]);

  function toggleChip(arr, setArr, id) {
    setArr(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  // Validate step before proceeding
  function canProceed(step) {
    if (step === 0) {
      return businessName.trim().length > 0 &&
             googleReviewLink.trim().length > 0 &&
             (businessType !== "other" || customCategory.trim().length > 0);
    }
    return true;
  }

  async function onSubmit(e) {
    if (e?.preventDefault) e.preventDefault();
    if (!canProceed(0)) return;
    setError("");
    if (!ownerIdentifier) return router.replace("/login");
    setLoading(true);

    const selectedType    = BUSINESS_TYPES.find(t => t.value === businessType);
    const business_category = businessType === "other"
      ? customCategory.trim()
      : selectedType?.category ?? businessType;

    try {
      const res = await fetch("/api/business/setup", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_phone:      ownerIdentifier,
          name:             businessName.trim(),
          address:          address.trim(),
          locality:         locality.trim(),
          gmb_link:         googleReviewLink.trim(),
          keywords:         seoKeywords.trim(),
          products:         featuredProducts.trim(),
          business_type:    businessType,
          business_category,
          description:      description.trim(),
          dining_vibe:      diningVibe,
          price_range:      priceRange,
          customer_profiles: JSON.stringify(customerProfiles),
          special_features:  JSON.stringify(specialFeatures),
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message ?? "Could not save.");
      localStorage.setItem(BUSINESS_ID_STORAGE_KEY, data.businessId);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  const selectedType = BUSINESS_TYPES.find(t => t.value === businessType);

  const productsLabel =
    ["restaurant","cafe","bakery","fastfood","dhaba"].includes(businessType) ? "Signature dishes / best sellers" :
    businessType === "hotel"   ? "Featured amenities / room types" :
    businessType === "salon" || businessType === "gym" ? "Featured services" :
    businessType === "clinic"  ? "Specializations / treatments" :
    businessType === "education" ? "Courses / subjects offered" :
    "Featured products / services";

  const productsPlaceholder =
    ["restaurant","cafe","dhaba"].includes(businessType) ? "e.g. Butter Chicken, Mutton Biryani, Special Thali, Cold Coffee" :
    businessType === "bakery"  ? "e.g. Plum Cake, Croissant, Red Velvet, Cookies" :
    businessType === "hotel"   ? "e.g. Deluxe Room, Rooftop Pool, Spa, Restaurant" :
    businessType === "salon"   ? "e.g. Hair Color, Facial, Bridal Makeup, Keratin" :
    businessType === "gym"     ? "e.g. Personal Training, Zumba, CrossFit, Yoga" :
    "e.g. your top 3-5 offerings";

  const descriptionPlaceholder =
    ["restaurant","cafe","dhaba","fastfood","bakery"].includes(businessType)
      ? "e.g. Family restaurant serving authentic Mughlai cuisine since 1998. Known for our dum biryani and kebab platter. Cozy indoor seating, mostly local crowd."
      : businessType === "hotel"
      ? "e.g. Boutique hotel near the city centre. Known for personalised service and rooftop restaurant. Popular with business travellers and weekend getaways."
      : businessType === "salon"
      ? "e.g. Premium unisex salon offering latest hair and skin treatments. Trained staff, hygienic setup, walk-ins welcome."
      : "Describe your business in 2-3 lines — what makes it special, who comes here, what you're known for.";

  if (!ownerIdentifier || prefilling) return (
    <div className="flex min-h-[40vh] items-center justify-center text-text-muted">
      {prefilling ? "Loading your profile…" : "Checking session…"}
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-navy px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-xl">
        <Link href="/dashboard" className="text-sm font-medium text-text-muted transition hover:text-white">← Dashboard</Link>

        {/* Step indicator */}
        <div className="mt-6 flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => i < currentStep && setCurrentStep(i)}
                className={"flex items-center gap-2 " + (i < currentStep ? "cursor-pointer" : "cursor-default")}
              >
                <div className={"flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all " +
                  (i === currentStep
                    ? "bg-accent text-white"
                    : i < currentStep
                    ? "bg-accent/30 text-accent"
                    : "bg-white/10 text-text-muted")}>
                  {i < currentStep ? "✓" : i + 1}
                </div>
                <span className={"text-xs font-medium hidden sm:block " +
                  (i === currentStep ? "text-white" : "text-text-muted")}>
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={"flex-1 h-px mx-3 " + (i < currentStep ? "bg-accent/40" : "bg-white/10")} />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-navy-muted/40 p-6 sm:p-8">
          <p className="text-sm font-medium text-accent">{isEdit ? "Edit profile" : "Business setup"}</p>
          <h1 className="mt-1 text-2xl font-bold text-white">
            {currentStep === 0 ? "Basics" : currentStep === 1 ? "Your story" : "Vibe & features"}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {currentStep === 0
              ? "Required info to get your QR working"
              : currentStep === 1
              ? "Helps AI write more genuine reviews — the more you add, the better"
              : "Optional details that make reviews more specific"}
          </p>

          <div className="mt-6 space-y-5">

            {/* ── STEP 1: BASICS ── */}
            {currentStep === 0 && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Business name *</label>
                  <input required
                    className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent placeholder:text-white/20"
                    value={businessName} onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Sharma's Cafe" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Business type *</label>
                  <select
                    className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent"
                    value={businessType} onChange={e => setBusinessType(e.target.value)}
                  >
                    {BUSINESS_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  {selectedType && (
                    <p className="text-xs text-text-muted mt-1">
                      Customer sees: <span className="text-accent">{selectedType.chips.join(" · ")}</span>
                    </p>
                  )}
                </div>

                {businessType === "other" && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Specify your business type *</label>
                    <input
                      className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent placeholder:text-white/20"
                      value={customCategory} onChange={e => setCustomCategory(e.target.value)}
                      placeholder="e.g. Photography Studio, Law Firm" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wide">City / Area</label>
                    <input
                      className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent placeholder:text-white/20"
                      value={locality} onChange={e => setLocality(e.target.value)}
                      placeholder="e.g. Cidco, Beed Bypass" />
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Full address</label>
                    <input
                      className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent placeholder:text-white/20"
                      value={address} onChange={e => setAddress(e.target.value)}
                      placeholder="Street, Area, City" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Google review link *</label>
                  <input required type="url"
                    className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent placeholder:text-white/20"
                    value={googleReviewLink} onChange={e => setGoogleReviewLink(e.target.value)}
                    placeholder="https://g.page/r/..." />
                  <p className="text-xs text-text-muted mt-1">
                    Google Maps → your business → Write a review → copy URL
                  </p>
                </div>
              </>
            )}

            {/* ── STEP 2: YOUR STORY ── */}
            {currentStep === 1 && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
                    About your business
                    <span className="ml-1 normal-case text-white/30">(Recommended)</span>
                  </label>
                  <textarea
                    rows={4}
                    maxLength={400}
                    className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent placeholder:text-white/20 resize-none"
                    value={description} onChange={e => setDescription(e.target.value)}
                    placeholder={descriptionPlaceholder} />
                  <div className="flex justify-between">
                    <p className="text-xs text-text-muted">This is the single biggest factor in review quality</p>
                    <p className="text-xs text-white/20">{description.length}/400</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">{productsLabel}</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent placeholder:text-white/20 resize-none"
                    value={featuredProducts} onChange={e => setFeaturedProducts(e.target.value)}
                    placeholder={productsPlaceholder} />
                  <p className="text-xs text-text-muted">Comma separated — AI will mention these naturally in reviews</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">SEO keywords</label>
                  <input
                    className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent placeholder:text-white/20"
                    value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)}
                    placeholder="e.g. best cafe Sambhajinagar, cold coffee Cidco" />
                  <p className="text-xs text-text-muted">What people search on Google to find you</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
                    Who visits you most?
                    <span className="ml-1 normal-case text-white/30">(Pick all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CUSTOMER_PROFILES.map(p => {
                      const on = customerProfiles.includes(p.id);
                      return (
                        <button key={p.id} type="button"
                          onClick={() => toggleChip(customerProfiles, setCustomerProfiles, p.id)}
                          className={"rounded-full border px-3 py-1.5 text-xs font-medium transition " +
                            (on ? "border-accent bg-accent/15 text-accent" : "border-white/15 text-text-muted hover:border-white/30 hover:text-white")}>
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-text-muted">AI picks matching archetypes for each customer type</p>
                </div>
              </>
            )}

            {/* ── STEP 3: VIBE ── */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Dining style / vibe</label>
                  <div className="grid grid-cols-2 gap-2">
                    {DINING_VIBES.map(v => (
                      <button key={v.value} type="button"
                        onClick={() => setDiningVibe(v.value === diningVibe ? "" : v.value)}
                        className={"rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition " +
                          (diningVibe === v.value
                            ? "border-accent bg-accent/15 text-accent"
                            : "border-white/15 text-text-muted hover:border-white/30 hover:text-white")}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Average spend per person</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRICE_RANGES.map(p => (
                      <button key={p.value} type="button"
                        onClick={() => setPriceRange(p.value === priceRange ? "" : p.value)}
                        className={"rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition " +
                          (priceRange === p.value
                            ? "border-accent bg-accent/15 text-accent"
                            : "border-white/15 text-text-muted hover:border-white/30 hover:text-white")}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-text-muted">Calibrates the tone — a budget dhaba review sounds different from a fine dining review</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
                    Special features
                    <span className="ml-1 normal-case text-white/30">(Pick all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIAL_FEATURES.map(f => {
                      const on = specialFeatures.includes(f.id);
                      return (
                        <button key={f.id} type="button"
                          onClick={() => toggleChip(specialFeatures, setSpecialFeatures, f.id)}
                          className={"rounded-full border px-3 py-1.5 text-xs font-medium transition " +
                            (on ? "border-accent bg-accent/15 text-accent" : "border-white/15 text-text-muted hover:border-white/30 hover:text-white")}>
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preview of what AI will use */}
                {(description || featuredProducts || customerProfiles.length > 0 || diningVibe || priceRange) && (
                  <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-1.5">
                    <p className="text-xs font-semibold text-accent uppercase tracking-wide">AI will use this context</p>
                    {businessName && <p className="text-xs text-white/70">📍 {businessName}{locality ? ` · ${locality}` : ""}</p>}
                    {description && <p className="text-xs text-white/70">📝 {description.slice(0, 80)}{description.length > 80 ? "…" : ""}</p>}
                    {featuredProducts && <p className="text-xs text-white/70">🍽️ {featuredProducts.slice(0, 60)}{featuredProducts.length > 60 ? "…" : ""}</p>}
                    {customerProfiles.length > 0 && <p className="text-xs text-white/70">👥 {customerProfiles.map(id => CUSTOMER_PROFILES.find(p => p.id === id)?.label).filter(Boolean).join(", ")}</p>}
                    {diningVibe && <p className="text-xs text-white/70">✨ {DINING_VIBES.find(v => v.value === diningVibe)?.label}</p>}
                    {priceRange && <p className="text-xs text-white/70">💰 {PRICE_RANGES.find(p => p.value === priceRange)?.label}</p>}
                    {specialFeatures.length > 0 && <p className="text-xs text-white/70">⭐ {specialFeatures.map(id => SPECIAL_FEATURES.find(f => f.id === id)?.label).filter(Boolean).join(", ")}</p>}
                  </div>
                )}
              </>
            )}

            {error && <p className="text-sm text-accent">{error}</p>}

            {/* Navigation */}
            <div className="flex gap-3 pt-2">
              {currentStep > 0 && (
                <button type="button" onClick={() => setCurrentStep(s => s - 1)}
                  className="flex h-12 flex-1 items-center justify-center rounded-full border border-white/15 text-sm font-medium text-text-muted hover:text-white transition">
                  ← Back
                </button>
              )}

              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  disabled={!canProceed(currentStep)}
                  onClick={() => setCurrentStep(s => s + 1)}
                  className="flex h-12 flex-1 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition enabled:hover:brightness-110">
                  Next →
                </button>
              ) : (
                <button type="button" disabled={loading} onClick={onSubmit}
                  className="flex h-12 flex-1 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white disabled:opacity-50 transition enabled:hover:brightness-110">
                  {loading ? "Saving…" : isEdit ? "Save changes" : "Save & go to dashboard"}
                </button>
              )}
            </div>

            {currentStep < STEPS.length - 1 && (
              <button type="button"
                onClick={() => setCurrentStep(s => s + 1)}
                className="w-full text-center text-xs text-text-muted hover:text-white transition py-1">
                Skip this step →
              </button>
            )}


          </div>
        </div>

        <p className="mt-4 text-center text-xs text-text-muted">
          Logged in as <span className="text-white">{ownerIdentifier}</span>
        </p>
      </div>
    </div>
  );
}
