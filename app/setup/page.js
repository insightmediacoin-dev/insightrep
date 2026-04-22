"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BUSINESS_ID_STORAGE_KEY,
  OWNER_IDENTIFIER_STORAGE_KEY,
} from "@/lib/phone";

const BUSINESS_TYPES = [
  { value: "restaurant", label: "Restaurant", chips: ["Food", "Service", "Ambiance", "Value for money"] },
  { value: "cafe", label: "Cafe / Coffee Shop", chips: ["Coffee", "Food", "Ambiance", "Service"] },
  { value: "hotel", label: "Hotel / Resort", chips: ["Rooms", "Service", "Cleanliness", "Location"] },
  { value: "bar", label: "Bar / Lounge / Nightclub", chips: ["Drinks", "Ambiance", "Service", "Music"] },
  { value: "bakery", label: "Bakery / Sweet Shop", chips: ["Products", "Taste", "Freshness", "Service"] },
  { value: "fastfood", label: "Fast Food / QSR", chips: ["Food", "Speed", "Value", "Service"] },
  { value: "dhaba", label: "Dhaba / Street Food", chips: ["Food", "Taste", "Value", "Vibe"] },
  { value: "salon", label: "Salon / Spa / Beauty", chips: ["Service", "Staff", "Cleanliness", "Value"] },
  { value: "gym", label: "Gym / Fitness Center", chips: ["Equipment", "Trainers", "Cleanliness", "Membership"] },
  { value: "retail", label: "Retail Shop / Showroom", chips: ["Products", "Service", "Pricing", "Experience"] },
  { value: "clinic", label: "Clinic / Hospital / Pharmacy", chips: ["Doctor", "Staff", "Cleanliness", "Service"] },
  { value: "agency", label: "Agency / Professional Services", chips: ["Service", "Professionalism", "Results", "Communication"] },
  { value: "education", label: "School / Coaching / Institute", chips: ["Teaching", "Faculty", "Facilities", "Results"] },
  { value: "travel", label: "Travel / Tour Operator", chips: ["Service", "Experience", "Value", "Guide"] },
  { value: "other", label: "Other (specify below)", chips: ["Service", "Quality", "Experience", "Value"] },
];

export default function SetupPage() {
  const router = useRouter();
  const [ownerIdentifier, setOwnerIdentifier] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [googleReviewLink, setGoogleReviewLink] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState("");
  const [businessType, setBusinessType] = useState("restaurant");
  const [businessCategory, setBusinessCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(true);
  const [error, setError] = useState("");
  const [isEdit, setIsEdit] = useState(false);

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

        const res = await fetch(fetchUrl);
        const data = await res.json();
        const biz = data.business;
        if (res.ok && biz) {
          setBusinessName(biz.name ?? "");
          setAddress(biz.address ?? "");
          setGoogleReviewLink(biz.gmb_link ?? "");
          setSeoKeywords(biz.keywords ?? "");
          setFeaturedProducts(biz.products ?? "");
          setBusinessType(biz.business_type ?? "restaurant");
          setBusinessCategory(biz.business_category ?? "");
          setIsEdit(true);
          if (!id) localStorage.setItem(BUSINESS_ID_STORAGE_KEY, biz.id);
        }
      } catch {}
      finally { setPrefilling(false); }
    }
    prefill();
  }, [router]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!ownerIdentifier) return router.replace("/login");
    setLoading(true);
    try {
      const res = await fetch("/api/business/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_phone: ownerIdentifier,
          name: businessName,
          address,
          gmb_link: googleReviewLink,
          keywords: seoKeywords,
          products: featuredProducts,
          business_type: businessType,
          business_category: businessCategory,
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

  if (!ownerIdentifier || prefilling) return (
    <div className="flex min-h-[40vh] items-center justify-center text-text-muted">
      {prefilling ? "Loading your profile…" : "Checking session…"}
    </div>
  );

  const productsLabel =
    businessType === "restaurant" || businessType === "cafe" || businessType === "bakery" || businessType === "fastfood" || businessType === "dhaba"
      ? "Featured dishes / products"
      : businessType === "hotel"
      ? "Featured amenities / room types"
      : businessType === "salon" || businessType === "gym"
      ? "Featured services"
      : businessType === "clinic"
      ? "Specializations / doctors"
      : businessType === "education"
      ? "Courses / subjects"
      : "Featured products / services";

  const productsPlaceholder =
    businessType === "restaurant" || businessType === "cafe"
      ? "e.g. Cold Coffee, Croissant, Pasta, Biryani"
      : businessType === "hotel"
      ? "e.g. Deluxe Rooms, Rooftop Pool, Restaurant"
      : businessType === "salon"
      ? "e.g. Hair Color, Facial, Bridal Makeup"
      : businessType === "gym"
      ? "e.g. Personal Training, Zumba, CrossFit"
      : "e.g. your top offerings";

  return (
    <div className="min-h-[100dvh] bg-navy px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-xl">
        <Link href="/dashboard" className="text-sm font-medium text-text-muted transition hover:text-white">← Dashboard</Link>
        <div className="mt-6 rounded-2xl border border-white/10 bg-navy-muted/40 p-6 sm:p-8">
          <p className="text-sm font-medium text-accent">{isEdit ? "Edit profile" : "Business setup"}</p>
          <h1 className="mt-2 text-2xl font-bold text-white">{isEdit ? "Update your details" : "Tell us about your place"}</h1>
          <p className="mt-2 text-sm text-text-muted">Logged in as <span className="text-white">{ownerIdentifier}</span></p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Business name *</label>
              <input required
                className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent"
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
                  Customer will see: <span className="text-accent">{selectedType.chips.join(" · ")}</span>
                </p>
              )}
            </div>

            {businessType === "other" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Specify your business type *</label>
                <input
                  className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent"
                  value={businessCategory} onChange={e => setBusinessCategory(e.target.value)}
                  placeholder="e.g. Photography Studio, Law Firm, Gym" />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Address</label>
              <textarea
                className="min-h-[88px] w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent"
                value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Full address" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Google review link *</label>
              <input required type="url"
                className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent"
                value={googleReviewLink} onChange={e => setGoogleReviewLink(e.target.value)}
                placeholder="https://g.page/r/..." />
              <p className="text-xs text-text-muted mt-1">Search your business on Google Maps → click Write a review → copy the URL</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">SEO keywords</label>
              <input
                className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent"
                value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)}
                placeholder="e.g. best cafe Sambhajinagar, cold coffee Cidco" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">{productsLabel}</label>
              <textarea
                className="min-h-[88px] w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent"
                value={featuredProducts} onChange={e => setFeaturedProducts(e.target.value)}
                placeholder={productsPlaceholder} />
            </div>

            {error ? <p className="text-sm text-accent">{error}</p> : null}

            <button type="submit" disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white disabled:opacity-50">
              {loading ? "Saving…" : isEdit ? "Save changes" : "Save & go to dashboard"}
            </button>

            {isEdit && (
              <button type="button" onClick={() => router.push("/dashboard")}
                className="flex h-12 w-full items-center justify-center rounded-full border border-white/15 text-sm font-medium text-text-muted hover:text-white">
                Cancel
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}