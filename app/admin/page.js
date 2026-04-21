"use client";

import { useEffect, useState } from "react";

const ADMIN_PASSWORD = "577151032779";
const MONTHLY_PRICE = 1499;
const ANNUAL_PRICE = 12990;

function PlanBadge({ plan }) {
  const styles = {
    free: "bg-white/10 text-text-muted",
    monthly: "bg-accent/20 text-accent",
    annual: "bg-green-500/20 text-green-400",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles[plan] ?? styles.free}`}>
      {plan ?? "free"}
    </span>
  );
}

function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);
  const [expanded, setExpanded] = useState(null);

  function login() {
    if (password === ADMIN_PASSWORD) { setAuthed(true); setPwError(""); }
    else setPwError("Wrong password.");
  }

  async function loadBusinesses() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/businesses?secret=${ADMIN_PASSWORD}`);
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Failed to load."); return; }
      setBusinesses(data.businesses);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function changePlan(businessId, plan) {
    setUpdating(businessId);
    try {
      await fetch("/api/admin/update-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: ADMIN_PASSWORD, businessId, plan }),
      });
      await loadBusinesses();
    } finally { setUpdating(null); }
  }

  async function deleteBusiness(businessId, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setUpdating(businessId);
    try {
      await fetch("/api/admin/delete-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: ADMIN_PASSWORD, businessId }),
      });
      await loadBusinesses();
    } finally { setUpdating(null); }
  }

  useEffect(() => { if (authed) loadBusinesses(); }, [authed]);

  const monthlyCount = businesses.filter(b => b.plan === "monthly").length;
  const annualCount = businesses.filter(b => b.plan === "annual").length;
  const mrr = (monthlyCount * MONTHLY_PRICE) + (annualCount * Math.round(ANNUAL_PRICE / 12));
  const arr = mrr * 12;
  const totalRevenue = (monthlyCount * MONTHLY_PRICE) + (annualCount * ANNUAL_PRICE);

  if (!authed) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-navy px-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-navy-muted/40 p-8 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">InsightRep</p>
          <h1 className="text-xl font-bold text-white">Admin access</h1>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            className="w-full rounded-xl border border-white/15 bg-navy/60 px-4 py-3 text-sm text-white outline-none focus:border-accent/50"
          />
          {pwError && <p className="text-xs text-accent">{pwError}</p>}
          <button onClick={login} className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-white hover:brightness-110">
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-navy px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">

        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">InsightRep</p>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          </div>
          <button onClick={loadBusinesses} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-text-muted hover:text-white">
            Refresh
          </button>
        </header>

        {/* Revenue */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Revenue</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 text-center">
              <p className="text-2xl font-extrabold text-accent">{formatINR(mrr)}</p>
              <p className="mt-1 text-xs text-text-muted uppercase tracking-wide">MRR</p>
              <p className="mt-1 text-[10px] text-text-muted">Monthly Recurring</p>
            </div>
            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5 text-center">
              <p className="text-2xl font-extrabold text-green-400">{formatINR(arr)}</p>
              <p className="mt-1 text-xs text-text-muted uppercase tracking-wide">ARR</p>
              <p className="mt-1 text-[10px] text-text-muted">Annual Run Rate</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-5 text-center">
              <p className="text-2xl font-extrabold text-white">{formatINR(totalRevenue)}</p>
              <p className="mt-1 text-xs text-text-muted uppercase tracking-wide">Total Billed</p>
              <p className="mt-1 text-[10px] text-text-muted">This cycle</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-5 text-center">
              <p className="text-2xl font-extrabold text-white">{monthlyCount + annualCount}</p>
              <p className="mt-1 text-xs text-text-muted uppercase tracking-wide">Paying Clients</p>
              <p className="mt-1 text-[10px] text-text-muted">{monthlyCount} monthly · {annualCount} annual</p>
            </div>
          </div>
        </section>

        {/* Business counts */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Businesses", value: businesses.length },
            { label: "Free Plan", value: businesses.filter(b => !b.plan || b.plan === "free").length },
            { label: "Monthly Plan", value: monthlyCount },
            { label: "Annual Plan", value: annualCount },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-navy-muted/40 p-5 text-center">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="mt-1 text-xs text-text-muted uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Table */}
        {loading ? (
          <p className="text-text-muted text-sm">Loading…</p>
        ) : error ? (
          <p className="text-accent text-sm">{error}</p>
        ) : (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted">All Businesses</h2>
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-navy-muted/60 text-left text-xs uppercase tracking-widest text-text-muted">
                    <th className="px-4 py-3">Business</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Scans</th>
                    <th className="px-4 py-3">Reviews</th>
                    <th className="px-4 py-3">Revenue</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((b, i) => {
                    const rev = b.plan === "monthly" ? MONTHLY_PRICE : b.plan === "annual" ? ANNUAL_PRICE : 0;
                    const isExpanded = expanded === b.id;
                    return (
                      <>
                        <tr key={b.id} className={`border-b border-white/5 ${i % 2 === 0 ? "bg-navy/40" : "bg-navy-muted/20"}`}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-white">{b.name}</p>
                            <button
                              type="button"
                              onClick={() => setExpanded(isExpanded ? null : b.id)}
                              className="text-[10px] text-accent hover:underline mt-0.5"
                            >
                              {isExpanded ? "Hide details" : "View details"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-text-muted text-xs">{b.owner_phone}</td>
                          <td className="px-4 py-3">
                            <p className="text-white text-xs font-medium">{b.owner_name ?? "—"}</p>
                            <p className="text-text-muted text-[10px]">{b.owner_designation ?? ""}</p>
                          </td>
                          <td className="px-4 py-3 text-text-muted text-xs">{b.owner_city ?? "—"}</td>
                          <td className="px-4 py-3"><PlanBadge plan={b.plan} /></td>
                          <td className="px-4 py-3 text-white font-semibold">{b.scans ?? 0}</td>
                          <td className="px-4 py-3 text-accent font-semibold">{b.reviews ?? 0}</td>
                          <td className="px-4 py-3 text-green-400 font-semibold text-xs">
                            {rev > 0 ? formatINR(rev) : "—"}
                          </td>
                          <td className="px-4 py-3 text-text-muted text-xs">
                            {b.created_at ? new Date(b.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <select
                                value={b.plan ?? "free"}
                                disabled={updating === b.id}
                                onChange={e => changePlan(b.id, e.target.value)}
                                className="rounded-lg border border-white/15 bg-navy/80 px-2 py-1 text-xs text-white outline-none focus:border-accent/50"
                              >
                                <option value="free">Free</option>
                                <option value="monthly">Monthly</option>
                                <option value="annual">Annual</option>
                              </select>
                              <button
                                onClick={() => deleteBusiness(b.id, b.name)}
                                disabled={updating === b.id}
                                className="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded details row */}
                        {isExpanded && (
                          <tr key={`${b.id}-details`} className="border-b border-white/5 bg-navy-muted/40">
                            <td colSpan={10} className="px-4 py-4">
                              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
                                <div>
                                  <p className="text-text-muted uppercase tracking-wide font-semibold mb-1">WhatsApp</p>
                                  {b.owner_whatsapp ? (
                                    <a href={`https://wa.me/91${b.owner_whatsapp}`} target="_blank" rel="noopener noreferrer"
                                      className="text-accent hover:underline">
                                      +91 {b.owner_whatsapp}
                                    </a>
                                  ) : <p className="text-text-muted">—</p>}
                                </div>
                                <div>
                                  <p className="text-text-muted uppercase tracking-wide font-semibold mb-1">Address</p>
                                  <p className="text-white">{b.address || "—"}</p>
                                </div>
                                <div>
                                  <p className="text-text-muted uppercase tracking-wide font-semibold mb-1">Google Review Link</p>
                                  {b.gmb_link ? (
                                    <a href={b.gmb_link} target="_blank" rel="noopener noreferrer"
                                      className="text-accent hover:underline break-all">
                                      Open link
                                    </a>
                                  ) : <p className="text-text-muted">—</p>}
                                </div>
                                <div>
                                  <p className="text-text-muted uppercase tracking-wide font-semibold mb-1">Keywords</p>
                                  <p className="text-white">{b.keywords || "—"}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
              {businesses.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-text-muted">No businesses yet.</p>
              )}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}