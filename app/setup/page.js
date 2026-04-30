"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BUSINESS_ID_STORAGE_KEY,
  OWNER_IDENTIFIER_STORAGE_KEY,
} from "@/lib/phone";

const BUSINESS_TYPES = [
  { value: "restaurant", label: "Restaurant",                    category: "food",        chips: ["Food", "Service", "Ambiance", "Value for money"] },
  { value: "cafe",       label: "Cafe / Coffee Shop",            category: "food",        chips: ["Coffee", "Food", "Ambiance", "Service"] },
  { value: "hotel",      label: "Hotel / Resort",                category: "hospitality", chips: ["Rooms", "Service", "Cleanliness", "Location"] },
  { value: "bar",        label: "Bar / Lounge / Nightclub",      category: "hospitality", chips: ["Drinks", "Ambiance", "Service", "Music"] },
  { value: "bakery",     label: "Bakery / Sweet Shop",           category: "food",        chips: ["Products", "Taste", "Freshness", "Service"] },
  { value: "fastfood",   label: "Fast Food / QSR",               category: "food",        chips: ["Food", "Speed", "Value", "Service"] },
  { value: "dhaba",      label: "Dhaba / Street Food",           category: "food",        chips: ["Food", "Taste", "Value", "Vibe"] },
  { value: "salon",      label: "Salon / Spa / Beauty",          category: "beauty",      chips: ["Service", "Staff", "Cleanliness", "Value"] },
  { value: "gym",        label: "Gym / Fitness Center",          category: "fitness",     chips: ["Equipment", "Trainers", "Cleanliness", "Membership"] },
  { value: "retail",     label: "Retail Shop / Showroom",        category: "retail",      chips: ["Products", "Service", "Pricing", "Experience"] },
  { value: "clinic",     label: "Clinic / Hospital / Pharmacy",  category: "healthcare",  chips: ["Doctor", "Staff", "Cleanliness", "Service"] },
  { value: "agency",     label: "Agency / Professional Services",category: "agency",      chips: ["Service", "Professionalism", "Results", "Communication"] },
  { value: "education",  label: "School / Coaching / Institute", category: "education",   chips: ["Teaching", "Faculty", "Facilities", "Results"] },
  { value: "travel",     label: "Travel / Tour Operator",        category: "travel",      chips: ["Service", "Experience", "Value", "Guide"] },
  { value: "other",      label: "Other (specify below)",         category: "other",       chips: ["Service", "Quality", "Experience", "Value"] },
];

// ─── CUSTOMER PROFILES BY TYPE ────────────────────────────────────────────────
const CUSTOMER_PROFILES_BY_TYPE = {
  restaurant: [
    { id: "professionals", label: "Working professionals" },
    { id: "families",      label: "Families with kids" },
    { id: "students",      label: "College students" },
    { id: "couples",       label: "Couples / Date nights" },
    { id: "seniors",       label: "Senior citizens" },
    { id: "mixed",         label: "Mixed crowd" },
  ],
  cafe: [
    { id: "professionals", label: "Working professionals" },
    { id: "students",      label: "College students" },
    { id: "couples",       label: "Couples" },
    { id: "freelancers",   label: "Freelancers / Remote workers" },
    { id: "mixed",         label: "Mixed crowd" },
  ],
  hotel: [
    { id: "business",      label: "Business travellers" },
    { id: "families",      label: "Families" },
    { id: "couples",       label: "Couples / Honeymoon" },
    { id: "groups",        label: "Tour groups" },
    { id: "mixed",         label: "Mixed guests" },
  ],
  bar: [
    { id: "professionals", label: "Working professionals" },
    { id: "students",      label: "College students" },
    { id: "couples",       label: "Couples" },
    { id: "groups",        label: "Friend groups" },
    { id: "mixed",         label: "Mixed crowd" },
  ],
  bakery: [
    { id: "families",      label: "Families" },
    { id: "students",      label: "Students" },
    { id: "professionals", label: "Office goers" },
    { id: "mixed",         label: "Mixed crowd" },
  ],
  fastfood: [
    { id: "students",      label: "College students" },
    { id: "families",      label: "Families with kids" },
    { id: "professionals", label: "Working professionals" },
    { id: "mixed",         label: "Mixed crowd" },
  ],
  dhaba: [
    { id: "travellers",    label: "Road travellers" },
    { id: "professionals", label: "Working class" },
    { id: "families",      label: "Families" },
    { id: "mixed",         label: "Mixed crowd" },
  ],
  salon: [
    { id: "professionals", label: "Working professionals" },
    { id: "students",      label: "Students" },
    { id: "couples",       label: "Brides / Grooms" },
    { id: "seniors",       label: "Senior citizens" },
    { id: "mixed",         label: "Mixed clientele" },
  ],
  gym: [
    { id: "professionals", label: "Working professionals" },
    { id: "students",      label: "Students" },
    { id: "seniors",       label: "Senior citizens" },
    { id: "mixed",         label: "Mixed members" },
  ],
  retail: [
    { id: "families",      label: "Families" },
    { id: "professionals", label: "Working professionals" },
    { id: "students",      label: "Students" },
    { id: "mixed",         label: "Mixed shoppers" },
  ],
  clinic: [
    { id: "families",      label: "Families" },
    { id: "seniors",       label: "Senior citizens" },
    { id: "professionals", label: "Working professionals" },
    { id: "mixed",         label: "All age groups" },
  ],
  agency: [
    { id: "business",      label: "Business owners" },
    { id: "professionals", label: "Corporate clients" },
    { id: "startups",      label: "Startups" },
    { id: "mixed",         label: "Mixed clients" },
  ],
  education: [
    { id: "students",      label: "School students" },
    { id: "college",       label: "College students" },
    { id: "professionals", label: "Working professionals" },
    { id: "mixed",         label: "Mixed age groups" },
  ],
  travel: [
    { id: "families",      label: "Families" },
    { id: "couples",       label: "Couples / Honeymoon" },
    { id: "groups",        label: "Group tours" },
    { id: "business",      label: "Business travellers" },
    { id: "mixed",         label: "Mixed travellers" },
  ],
  other: [
    { id: "professionals", label: "Working professionals" },
    { id: "families",      label: "Families" },
    { id: "students",      label: "Students" },
    { id: "mixed",         label: "Mixed crowd" },
  ],
};

// ─── VIBES BY TYPE ────────────────────────────────────────────────────────────
const VIBES_BY_TYPE = {
  restaurant: [
    { value: "casual",       label: "Casual / Quick bites" },
    { value: "fine_dining",  label: "Fine dining" },
    { value: "family",       label: "Family style" },
    { value: "takeaway",     label: "Takeaway focused" },
    { value: "cafe_hangout", label: "Cafe / Hangout" },
    { value: "bar_nightlife",label: "Bar / Nightlife" },
  ],
  cafe: [
    { value: "casual",       label: "Casual / Chill" },
    { value: "work_study",   label: "Work / Study spot" },
    { value: "social",       label: "Social hangout" },
    { value: "takeaway",     label: "Takeaway focused" },
  ],
  hotel: [
    { value: "budget",       label: "Budget / Economy" },
    { value: "mid_range",    label: "Mid-range comfort" },
    { value: "luxury",       label: "Luxury / Premium" },
    { value: "boutique",     label: "Boutique / Unique" },
    { value: "business",     label: "Business hotel" },
  ],
  bar: [
    { value: "casual",       label: "Casual bar" },
    { value: "lounge",       label: "Lounge / Upscale" },
    { value: "nightclub",    label: "Nightclub / Party" },
    { value: "sports_bar",   label: "Sports bar" },
    { value: "rooftop_bar",  label: "Rooftop bar" },
  ],
  bakery: [
    { value: "artisan",      label: "Artisan / Premium" },
    { value: "casual",       label: "Casual / Everyday" },
    { value: "cafe_bakery",  label: "Cafe + Bakery" },
    { value: "bulk",         label: "Bulk / Orders" },
  ],
  salon: [
    { value: "budget",       label: "Budget friendly" },
    { value: "mid_range",    label: "Mid-range" },
    { value: "premium",      label: "Premium / Luxury" },
    { value: "bridal",       label: "Bridal specialist" },
    { value: "unisex",       label: "Unisex salon" },
  ],
  gym: [
    { value: "budget",       label: "Budget gym" },
    { value: "mid_range",    label: "Well-equipped" },
    { value: "premium",      label: "Premium fitness" },
    { value: "crossfit",     label: "CrossFit / Functional" },
    { value: "yoga",         label: "Yoga / Wellness" },
  ],
  clinic: [
    { value: "general",      label: "General practice" },
    { value: "specialist",   label: "Specialist clinic" },
    { value: "multi",        label: "Multi-specialty" },
    { value: "diagnostic",   label: "Diagnostic center" },
  ],
  agency: [
    { value: "creative",     label: "Creative agency" },
    { value: "digital",      label: "Digital marketing" },
    { value: "consulting",   label: "Consulting" },
    { value: "legal",        label: "Legal / Finance" },
    { value: "tech",         label: "Tech / IT services" },
  ],
  education: [
    { value: "school",       label: "School / K-12" },
    { value: "coaching",     label: "Coaching / Tuition" },
    { value: "skill",        label: "Skill development" },
    { value: "language",     label: "Language classes" },
    { value: "professional", label: "Professional training" },
  ],
  travel: [
    { value: "budget",       label: "Budget tours" },
    { value: "mid_range",    label: "Mid-range packages" },
    { value: "luxury",       label: "Luxury travel" },
    { value: "adventure",    label: "Adventure / Trekking" },
    { value: "pilgrimage",   label: "Religious / Pilgrimage" },
  ],
  retail: [
    { value: "budget",       label: "Budget / Value" },
    { value: "mid_range",    label: "Mid-range" },
    { value: "premium",      label: "Premium / Designer" },
    { value: "multi_brand",  label: "Multi-brand store" },
  ],
  fastfood: [
    { value: "quick",        label: "Quick service" },
    { value: "delivery",     label: "Delivery focused" },
    { value: "dine_in",      label: "Dine-in + Takeaway" },
  ],
  dhaba: [
    { value: "roadside",     label: "Roadside dhaba" },
    { value: "punjabi",      label: "Punjabi style" },
    { value: "local",        label: "Local cuisine" },
    { value: "highway",      label: "Highway dhaba" },
  ],
  other: [
    { value: "casual",       label: "Casual / Everyday" },
    { value: "premium",      label: "Premium / Upscale" },
    { value: "professional", label: "Professional" },
    { value: "community",    label: "Community focused" },
  ],
};

// ─── PRICE RANGES BY TYPE ─────────────────────────────────────────────────────
const PRICE_BY_TYPE = {
  restaurant: [
    { value: "budget",   label: "Under Rs.200/person" },
    { value: "mid",      label: "Rs.200–500/person" },
    { value: "premium",  label: "Rs.500–1000/person" },
    { value: "luxury",   label: "Rs.1000+/person" },
  ],
  cafe: [
    { value: "budget",   label: "Under Rs.150/person" },
    { value: "mid",      label: "Rs.150–350/person" },
    { value: "premium",  label: "Rs.350–600/person" },
    { value: "luxury",   label: "Rs.600+/person" },
  ],
  hotel: [
    { value: "budget",   label: "Under Rs.1500/night" },
    { value: "mid",      label: "Rs.1500–4000/night" },
    { value: "premium",  label: "Rs.4000–10000/night" },
    { value: "luxury",   label: "Rs.10000+/night" },
  ],
  salon: [
    { value: "budget",   label: "Under Rs.300/visit" },
    { value: "mid",      label: "Rs.300–800/visit" },
    { value: "premium",  label: "Rs.800–2000/visit" },
    { value: "luxury",   label: "Rs.2000+/visit" },
  ],
  gym: [
    { value: "budget",   label: "Under Rs.800/month" },
    { value: "mid",      label: "Rs.800–2000/month" },
    { value: "premium",  label: "Rs.2000–5000/month" },
    { value: "luxury",   label: "Rs.5000+/month" },
  ],
  clinic: [
    { value: "budget",   label: "Under Rs.300/visit" },
    { value: "mid",      label: "Rs.300–800/visit" },
    { value: "premium",  label: "Rs.800–2000/visit" },
    { value: "luxury",   label: "Rs.2000+/visit" },
  ],
  agency: [
    { value: "budget",   label: "Under Rs.10k/month" },
    { value: "mid",      label: "Rs.10k–50k/month" },
    { value: "premium",  label: "Rs.50k–2L/month" },
    { value: "luxury",   label: "Rs.2L+/month" },
  ],
  education: [
    { value: "budget",   label: "Under Rs.1000/month" },
    { value: "mid",      label: "Rs.1000–5000/month" },
    { value: "premium",  label: "Rs.5000–15000/month" },
    { value: "luxury",   label: "Rs.15000+/month" },
  ],
  default: [
    { value: "budget",   label: "Budget / Affordable" },
    { value: "mid",      label: "Mid-range" },
    { value: "premium",  label: "Premium" },
    { value: "luxury",   label: "Luxury" },
  ],
};

// ─── SPECIAL FEATURES BY TYPE ─────────────────────────────────────────────────
const FEATURES_BY_TYPE = {
  restaurant: [
    { id: "rooftop",        label: "Rooftop seating" },
    { id: "live_music",     label: "Live music" },
    { id: "private_dining", label: "Private dining" },
    { id: "outdoor",        label: "Outdoor seating" },
    { id: "parking",        label: "Parking available" },
    { id: "delivery",       label: "Home delivery" },
    { id: "pure_veg",       label: "Pure veg" },
    { id: "late_night",     label: "Late night open" },
    { id: "wifi",           label: "Free Wi-Fi" },
    { id: "pet_friendly",   label: "Pet friendly" },
  ],
  cafe: [
    { id: "wifi",           label: "Free Wi-Fi" },
    { id: "outdoor",        label: "Outdoor seating" },
    { id: "work_friendly",  label: "Work friendly" },
    { id: "live_music",     label: "Live music" },
    { id: "board_games",    label: "Board games" },
    { id: "pet_friendly",   label: "Pet friendly" },
    { id: "delivery",       label: "Delivery" },
    { id: "late_night",     label: "Late night open" },
  ],
  hotel: [
    { id: "pool",           label: "Swimming pool" },
    { id: "gym",            label: "In-house gym" },
    { id: "spa",            label: "Spa / Wellness" },
    { id: "restaurant",     label: "In-house restaurant" },
    { id: "conference",     label: "Conference rooms" },
    { id: "parking",        label: "Parking" },
    { id: "airport",        label: "Airport pickup" },
    { id: "wifi",           label: "Free Wi-Fi" },
    { id: "pet_friendly",   label: "Pet friendly" },
  ],
  bar: [
    { id: "rooftop",        label: "Rooftop bar" },
    { id: "live_music",     label: "Live music / DJ" },
    { id: "outdoor",        label: "Outdoor seating" },
    { id: "private_events", label: "Private events" },
    { id: "happy_hours",    label: "Happy hours" },
    { id: "sports_screen",  label: "Sports screening" },
    { id: "parking",        label: "Parking available" },
    { id: "late_night",     label: "Late night open" },
  ],
  salon: [
    { id: "unisex",         label: "Unisex" },
    { id: "bridal",         label: "Bridal services" },
    { id: "home_service",   label: "Home service" },
    { id: "ac",             label: "AC facility" },
    { id: "appointments",   label: "Appointments only" },
    { id: "walk_in",        label: "Walk-ins welcome" },
    { id: "parking",        label: "Parking" },
  ],
  gym: [
    { id: "ac",             label: "AC facility" },
    { id: "personal",       label: "Personal trainers" },
    { id: "diet",           label: "Diet counselling" },
    { id: "locker",         label: "Locker rooms" },
    { id: "cardio",         label: "Cardio zone" },
    { id: "weights",        label: "Free weights" },
    { id: "classes",        label: "Group classes" },
    { id: "parking",        label: "Parking" },
    { id: "wifi",           label: "Free Wi-Fi" },
  ],
  clinic: [
    { id: "appointment",    label: "Appointment system" },
    { id: "emergency",      label: "Emergency services" },
    { id: "lab",            label: "In-house lab" },
    { id: "pharmacy",       label: "In-house pharmacy" },
    { id: "parking",        label: "Parking" },
    { id: "ac",             label: "AC facility" },
    { id: "cashless",       label: "Cashless / Insurance" },
  ],
  agency: [
    { id: "remote",         label: "Remote / Online" },
    { id: "dedicated",      label: "Dedicated account manager" },
    { id: "reports",        label: "Monthly reports" },
    { id: "fast_delivery",  label: "Quick turnaround" },
    { id: "nda",            label: "NDA / Confidentiality" },
    { id: "flexible",       label: "Flexible contracts" },
  ],
  education: [
    { id: "online",         label: "Online classes" },
    { id: "offline",        label: "Offline / In-person" },
    { id: "demo",           label: "Free demo class" },
    { id: "doubt",          label: "Doubt sessions" },
    { id: "materials",      label: "Study materials provided" },
    { id: "small_batch",    label: "Small batch size" },
    { id: "recordings",     label: "Class recordings" },
    { id: "placement",      label: "Placement support" },
  ],
  travel: [
    { id: "custom",         label: "Custom packages" },
    { id: "group",          label: "Group tours" },
    { id: "honeymoon",      label: "Honeymoon packages" },
    { id: "visa",           label: "Visa assistance" },
    { id: "accommodation",  label: "Hotel booking" },
    { id: "pickup",         label: "Pickup / Drop service" },
    { id: "guide",          label: "Local guide" },
    { id: "24x7",           label: "24/7 support" },
  ],
  default: [
    { id: "parking",        label: "Parking available" },
    { id: "wifi",           label: "Free Wi-Fi" },
    { id: "ac",             label: "AC facility" },
    { id: "delivery",       label: "Home delivery" },
    { id: "online",         label: "Online services" },
    { id: "late_night",     label: "Late night open" },
  ],
};

function getVibes(type)    { return VIBES_BY_TYPE[type]    ?? VIBES_BY_TYPE.other; }
function getPrices(type)   { return PRICE_BY_TYPE[type]    ?? PRICE_BY_TYPE.default; }
function getFeatures(type) { return FEATURES_BY_TYPE[type] ?? FEATURES_BY_TYPE.default; }
function getProfiles(type) { return CUSTOMER_PROFILES_BY_TYPE[type] ?? CUSTOMER_PROFILES_BY_TYPE.other; }

function getVibeLabel(type) {
  const labels = {
    restaurant: "Dining style / Vibe",
    cafe:       "Cafe style",
    hotel:      "Hotel category",
    bar:        "Bar type",
    salon:      "Salon type",
    gym:        "Gym type",
    clinic:     "Clinic type",
    agency:     "Agency type",
    education:  "Institute type",
    travel:     "Tour style",
    retail:     "Store type",
    fastfood:   "Service style",
    dhaba:      "Dhaba style",
    other:      "Business style",
  };
  return labels[type] ?? "Business style / Vibe";
}

function getPriceLabel(type) {
  const labels = {
    restaurant: "Average spend per person",
    cafe:       "Average spend per visit",
    hotel:      "Room rate per night",
    salon:      "Average spend per visit",
    gym:        "Membership fee",
    clinic:     "Consultation fee",
    agency:     "Monthly retainer",
    education:  "Monthly fee",
    travel:     "Package price range",
    retail:     "Price range",
    other:      "Price range",
  };
  return labels[type] ?? "Price range";
}

const STEPS = [
  { id: "basic", label: "Basics",     icon: "🏪" },
  { id: "story", label: "Your story", icon: "✍️" },
  { id: "vibe",  label: "Vibe",       icon: "✨" },
];

export default function SetupPage() {
  const router = useRouter();

  const [ownerIdentifier, setOwnerIdentifier] = useState("");
  const [prefilling,      setPrefilling]      = useState(true);
  const [isEdit,          setIsEdit]          = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [currentStep,     setCurrentStep]     = useState(0);

  const [businessName,     setBusinessName]     = useState("");
  const [businessType,     setBusinessType]     = useState("restaurant");
  const [customCategory,   setCustomCategory]   = useState("");
  const [address,          setAddress]          = useState("");
  const [locality,         setLocality]         = useState("");
  const [googleReviewLink, setGoogleReviewLink] = useState("");

  const [description,      setDescription]      = useState("");
  const [featuredProducts, setFeaturedProducts] = useState("");
  const [seoKeywords,      setSeoKeywords]      = useState("");
  const [customerProfiles, setCustomerProfiles] = useState([]);

  const [diningVibe,      setDiningVibe]      = useState("");
  const [priceRange,      setPriceRange]      = useState("");
  const [specialFeatures, setSpecialFeatures] = useState([]);

  // Reset vibe/features when business type changes
  useEffect(() => {
    setDiningVibe("");
    setPriceRange("");
    setSpecialFeatures([]);
    setCustomerProfiles([]);
  }, [businessType]);

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

  // Don't reset on prefill — only on user-initiated type change
  const [hasPreFilled, setHasPreFilled] = useState(false);
  useEffect(() => {
    if (prefilling) return;
    setHasPreFilled(true);
  }, [prefilling]);

  function toggleChip(arr, setArr, id) {
    setArr(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

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

    const selectedType      = BUSINESS_TYPES.find(t => t.value === businessType);
    const business_category = businessType === "other"
      ? customCategory.trim()
      : selectedType?.category ?? businessType;

    try {
      const res = await fetch("/api/business/setup", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_phone:       ownerIdentifier,
          name:              businessName.trim(),
          address:           address.trim(),
          locality:          locality.trim(),
          gmb_link:          googleReviewLink.trim(),
          keywords:          seoKeywords.trim(),
          products:          featuredProducts.trim(),
          business_type:     businessType,
          business_category,
          description:       description.trim(),
          dining_vibe:       diningVibe,
          price_range:       priceRange,
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
    businessType === "hotel"     ? "Featured amenities / room types" :
    businessType === "salon" || businessType === "gym" ? "Featured services" :
    businessType === "clinic"    ? "Specializations / treatments" :
    businessType === "education" ? "Courses / subjects offered" :
    businessType === "travel"    ? "Popular tour packages" :
    businessType === "agency"    ? "Key services offered" :
    "Featured products / services";

  const productsPlaceholder =
    ["restaurant","cafe","dhaba"].includes(businessType) ? "e.g. Butter Chicken, Mutton Biryani, Special Thali" :
    businessType === "bakery"    ? "e.g. Plum Cake, Croissant, Red Velvet, Cookies" :
    businessType === "hotel"     ? "e.g. Deluxe Room, Rooftop Pool, Spa, Restaurant" :
    businessType === "salon"     ? "e.g. Hair Color, Facial, Bridal Makeup, Keratin" :
    businessType === "gym"       ? "e.g. Personal Training, Zumba, CrossFit, Yoga" :
    businessType === "agency"    ? "e.g. Social media marketing, Google Ads, SEO, Content creation" :
    businessType === "education" ? "e.g. JEE coaching, NEET preparation, English speaking" :
    businessType === "travel"    ? "e.g. Goa package, Ladakh trip, Europe tour" :
    "e.g. your top 3-5 offerings";

  const descriptionPlaceholder =
    ["restaurant","cafe","dhaba","fastfood","bakery"].includes(businessType)
      ? "e.g. Family restaurant serving authentic Mughlai cuisine since 1998. Known for our dum biryani and kebab platter."
      : businessType === "hotel"
      ? "e.g. Boutique hotel near city centre. Known for personalised service and rooftop restaurant."
      : businessType === "salon"
      ? "e.g. Premium unisex salon offering latest hair and skin treatments. Trained staff, hygienic setup."
      : businessType === "gym"
      ? "e.g. Fully equipped gym with certified personal trainers. AC facility, flexible timings, all fitness levels welcome."
      : businessType === "clinic"
      ? "e.g. Multi-specialty clinic with experienced doctors. Known for accurate diagnosis and patient-friendly approach."
      : businessType === "agency"
      ? "e.g. Digital marketing agency helping restaurants and cafes grow online. Specialise in Meta ads and Google reviews."
      : businessType === "education"
      ? "e.g. Coaching institute with 10+ years experience. Small batches, experienced faculty, strong results record."
      : businessType === "travel"
      ? "e.g. Travel agency specialising in customised holiday packages. Served 500+ happy families across India and abroad."
      : "Describe your business in 2-3 lines — what makes it special, who comes here, what you're known for.";

  const currentVibes    = getVibes(businessType);
  const currentPrices   = getPrices(businessType);
  const currentFeatures = getFeatures(businessType);
  const currentProfiles = getProfiles(businessType);
  const vibeLabel       = getVibeLabel(businessType);
  const priceLabel      = getPriceLabel(businessType);

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
              <button type="button" onClick={() => i < currentStep && setCurrentStep(i)}
                className={"flex items-center gap-2 " + (i < currentStep ? "cursor-pointer" : "cursor-default")}>
                <div className={"flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all " +
                  (i === currentStep ? "bg-accent text-white" : i < currentStep ? "bg-accent/30 text-accent" : "bg-white/10 text-text-muted")}>
                  {i < currentStep ? "✓" : i + 1}
                </div>
                <span className={"text-xs font-medium hidden sm:block " + (i === currentStep ? "text-white" : "text-text-muted")}>
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
            {currentStep === 0 ? "Required info to get your QR working"
              : currentStep === 1 ? "Helps AI write more genuine reviews — the more you add, the better"
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
                    value={businessType} onChange={e => setBusinessType(e.target.value)}>
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
                  <p className="text-xs text-text-muted mt-1">Google Maps → your business → Write a review → copy URL</p>
                </div>
              </>
            )}

            {/* ── STEP 2: YOUR STORY ── */}
            {currentStep === 1 && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
                    About your business <span className="normal-case text-white/30">(Recommended)</span>
                  </label>
                  <textarea rows={4} maxLength={400}
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
                  <textarea rows={3}
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
                    Who visits you most? <span className="normal-case text-white/30">(Pick all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {currentProfiles.map(p => {
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
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">{vibeLabel}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {currentVibes.map(v => (
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
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">{priceLabel}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {currentPrices.map(p => (
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
                  <p className="text-xs text-text-muted">Calibrates the tone — AI writes differently for each price range</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
                    Key features <span className="normal-case text-white/30">(Pick all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {currentFeatures.map(f => {
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

                {/* AI context preview */}
                {(description || featuredProducts || customerProfiles.length > 0 || diningVibe || priceRange) && (
                  <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-1.5">
                    <p className="text-xs font-semibold text-accent uppercase tracking-wide">AI will use this context</p>
                    {businessName && <p className="text-xs text-white/70">📍 {businessName}{locality ? ` · ${locality}` : ""}</p>}
                    {description  && <p className="text-xs text-white/70">📝 {description.slice(0, 80)}{description.length > 80 ? "…" : ""}</p>}
                    {featuredProducts && <p className="text-xs text-white/70">⭐ {featuredProducts.slice(0, 60)}{featuredProducts.length > 60 ? "…" : ""}</p>}
                    {customerProfiles.length > 0 && <p className="text-xs text-white/70">👥 {customerProfiles.map(id => currentProfiles.find(p => p.id === id)?.label).filter(Boolean).join(", ")}</p>}
                    {diningVibe && <p className="text-xs text-white/70">✨ {currentVibes.find(v => v.value === diningVibe)?.label}</p>}
                    {priceRange  && <p className="text-xs text-white/70">💰 {currentPrices.find(p => p.value === priceRange)?.label}</p>}
                    {specialFeatures.length > 0 && <p className="text-xs text-white/70">🔧 {specialFeatures.map(id => currentFeatures.find(f => f.id === id)?.label).filter(Boolean).join(", ")}</p>}
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
                <button type="button" disabled={!canProceed(currentStep)}
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
              <button type="button" onClick={() => setCurrentStep(s => s + 1)}
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
