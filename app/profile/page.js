"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BUSINESS_ID_STORAGE_KEY, OWNER_IDENTIFIER_STORAGE_KEY } from "@/lib/phone";

const DESIGNATIONS = [
  "Owner / Partner",
  "Manager",
  "Marketing Head",
  "Staff",
  "Other",
];

export default function ProfilePage() {
  const router = useRouter();
  const [businessId, setBusinessId] = useState(null);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [city, setCity] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const identifier = localStorage.getItem(OWNER_IDENTIFIER_STORAGE_KEY);
    if (!identifier) { router.replace("/login"); return; }

    const id = localStorage.getItem(BUSINESS_ID_STORAGE_KEY);
    if (!id) { router.replace("/setup"); return; }
    setBusinessId(id);

    async function prefill() {
      try {
        const res = await fetch(`/api/business/${id}`);
        const data = await res.json();
        if (res.ok && data.business) {
          setName(data.business.owner_name ?? "");
          setDesignation(data.business.owner_designation ?? "");
          setCity(data.business.owner_city ?? "");
          setWhatsapp(data.business.owner_whatsapp ?? "");
        }
      } catch {}
      finally { setPrefilling(false); }
    }
    prefill();
  }, [router]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!designation) { setError("Please select your designation."); return; }
    if (!city.trim()) { setError("Please enter your city."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/business/update-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          owner_name: name.trim(),
          owner_designation: designation,
          owner_city: city.trim(),
          owner_whatsapp: whatsapp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Could not save."); return; }
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  if (prefilling) return <div className="flex min-h-[40vh] items-center justify-center text-text-muted">Loading…</div>;

  return (
    <div className="min-h-[100dvh] bg-navy px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-xl">
        <Link href="/dashboard" className="text-sm font-medium text-text-muted hover:text-white">← Dashboard</Link>
        <div className="mt-6 rounded-2xl border border-white/10 bg-navy-muted/40 p-6 sm:p-8">
          <p className="text-sm font-medium text-accent">Complete your profile</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Tell us about yourself</h1>
          <p className="mt-2 text-sm text-text-muted">This helps us personalise your experience and support.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Full name *</label>
              <input
                required
                className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Your role *</label>
              <select
                required
                className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent"
                value={designation}
                onChange={e => setDesignation(e.target.value)}
              >
                <option value="">Select your role</option>
                {DESIGNATIONS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">City *</label>
              <input
                required
                className="w-full rounded-xl border border-white/15 bg-navy/60 px-3 py-3 text-white outline-none focus:border-accent"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Chh. Sambhajinagar"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">WhatsApp number</label>
              <div className="flex rounded-xl border border-white/15 bg-navy/60 focus-within:border-accent/50">
                <span className="flex shrink-0 items-center border-r border-white/10 px-3 text-sm font-medium text-text-muted">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-white outline-none"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                />
              </div>
            </div>

            {error ? <p className="text-sm text-accent">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save & go to dashboard"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex h-12 w-full items-center justify-center rounded-full border border-white/15 text-sm font-medium text-text-muted hover:text-white"
            >
              Skip for now
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}