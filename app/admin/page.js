"use client";

import { useEffect, useState } from "react";

const ADMIN_PASSWORD = "577151032779";
const MONTHLY_PRICE  = 1499;
const ANNUAL_PRICE   = 12990;

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function PlanBadge({ plan }) {
  const s = {
    free:    "bg-white/10 text-white/50",
    monthly: "bg-accent/20 text-accent",
    annual:  "bg-green-500/20 text-green-400",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s[plan] ?? s.free}`}>
      {plan ?? "free"}
    </span>
  );
}

function ChurnBadge({ scans, createdAt }) {
  if (!createdAt) return null;
  const daysSinceCreated = (Date.now() - new Date(createdAt)) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated < 3) return null; // too new
  if (scans === 0) return <span className="rounded-full bg-red-500/15 text-red-400 text-[10px] px-2 py-0.5 font-semibold">No scans</span>;
  return null;
}

export default function AdminPage() {
  const [authed,    setAuthed]    = useState(false);
  const [password,  setPassword]  = useState("");
  const [pwError,   setPwError]   = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [updating,  setUpdating]  = useState(null);
  const [expanded,  setExpanded]  = useState(null);
  const [search,    setSearch]    = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [sending,   setSending]   = useState(null);
  const [sendMsg,   setSendMsg]   = useState({});

  function login() {
    if (password === ADMIN_PASSWORD) { setAuthed(true); setPwError(""); }
    else setPwError("Wrong password.");
  }

  async function loadBusinesses() {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`/api/admin/businesses?secret=${ADMIN_PASSWORD}`);
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Failed to load."); return; }
      setBusinesses(data.businesses);
    } catch { setError("Network error."); }
    finally { setLoading(false); }
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

  async function sendReport(biz) {
    if (!biz.owner_phone?.includes("@")) {
      setSendMsg(prev => ({ ...prev, [biz.id]: "No email — phone only owner" }));
      return;
    }
    setSending(biz.id);
    setSendMsg(prev => ({ ...prev, [biz.id]: "" }));
    try {
      const res  = await fetch(`/api/cron/weekly-report`, {
        headers: { "Authorization": "Bearer insightrep_cron_2026" },
      });
      const data = await res.json();
      setSendMsg(prev => ({ ...prev, [biz.id]: data.ok ? "Sent ✓" : "Failed" }));
    } catch {
      setSendMsg(prev => ({ ...prev, [biz.id]: "Error" }));
    } finally { setSending(null); }
  }

  function copyReviewLink(id) {
    const url = `${window.location.origin}/review/${id}`;
    navigator.clipboard.writeText(url).catch(() => {});
  }

  useEffect(() => { if (authed) loadBusinesses(); }, [authed]);

  // Metrics
  const monthlyCount  = businesses.filter(b => b.plan === "monthly").length;
  const annualCount   = businesses.filter(b => b.plan === "annual").length;
  const mrr           = (monthlyCount * MONTHLY_PRICE) + (annualCount * Math.round(ANNUAL_PRICE / 12));
  const arr           = mrr * 12;
  const totalRevenue  = (monthlyCount * MONTHLY_PRICE) + (annualCount * ANNUAL_PRICE);
  const totalScans    = businesses.reduce((a, b) => a + (b.scans ?? 0), 0);
  const totalReviews  = businesses.reduce((a, b) => a + (b.reviews ?? 0), 0);
  const atRisk        = businesses.filter(b => (b.plan === "monthly" || b.plan === "annual") && (b.scans ?? 0) === 0).length;

  // Filter
  const filtered = businesses.filter(b => {
    const matchSearch = !search ||
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.owner_phone?.toLowerCase().includes(search.toLowerCase()) ||
      b.owner_name?.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === "all" || (b.plan ?? "free") === planFilter;
    return matchSearch && matchPlan;
  });

  if (!authed) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-navy px-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-navy-muted/40 p-8 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">InsightRep</p>
          <h1 className="text-xl font-bold text-white">Admin access</h1>
          <input type="password" placeholder="Enter admin password" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && login()}
            className="w-full rounded-xl border border-white/15 bg-navy/60 px-4 py-3 text-sm text-white outline-none focus:border-accent/50" />
          {pwError && <p className="text-xs text-accent">{pwError}</p>}
          <button onClick={login} className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-white hover:brightness-110">Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-navy px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">InsightRep</p>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          </div>
          <button onClick={loadBusinesses}
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-text-muted hover:text-white">
            Refresh
          </button>
        </header>

        {/* Revenue metrics */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Revenue</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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

        {/* Usage + health metrics */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Total Businesses", value: businesses.length, color: "text-white" },
            { label: "Free Plan",        value: businesses.filter(b => !b.plan || b.plan === "free").length, color: "text-white" },
            { label: "Monthly Plan",     value: monthlyCount, color: "text-accent" },
            { label: "Annual Plan",      value: annualCount,  color: "text-green-400" },
            { label: "At Risk",          value: atRisk, color: atRisk > 0 ? "text-red-400" : "text-white",
              hint: "Paying clients with 0 scans" },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.label === "At Risk" && atRisk > 0 ? "border-red-500/30 bg-red-500/5" : "border-white/10 bg-navy-muted/40"}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-xs text-text-muted uppercase tracking-wide">{s.label}</p>
              {s.hint && <p className="mt-0.5 text-[9px] text-text-muted">{s.hint}</p>}
            </div>
          ))}
        </section>

        {/* Engagement totals */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-4 text-center">
            <p className="text-3xl font-bold text-white">{totalScans.toLocaleString("en-IN")}</p>
            <p className="mt-1 text-xs text-text-muted uppercase tracking-wide">Total QR Scans (all clients)</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-4 text-center">
            <p className="text-3xl font-bold text-accent">{totalReviews.toLocaleString("en-IN")}</p>
            <p className="mt-1 text-xs text-text-muted uppercase tracking-wide">Total Reviews Generated (all clients)</p>
          </div>
        </section>

        {/* Search + filter */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text" placeholder="Search by name, email, or owner..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-xl border border-white/15 bg-navy/60 px-4 py-2.5 text-sm text-white outline-none focus:border-accent/50 placeholder:text-white/25"
          />
          <div className="flex gap-2">
            {["all","free","monthly","annual"].map(p => (
              <button key={p} onClick={() => setPlanFilter(p)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${planFilter === p ? "bg-accent text-white" : "border border-white/15 text-text-muted hover:text-white"}`}>
                {p}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-muted whitespace-nowrap">{filtered.length} of {businesses.length}</p>
        </section>

        {/* Table */}
        {loading ? (
          <p className="text-text-muted text-sm">Loading…</p>
        ) : error ? (
          <p className="text-accent text-sm">{error}</p>
        ) : (
          <section className="space-y-2">
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-navy-muted/60 text-left text-[11px] uppercase tracking-widest text-text-muted">
                    <th className="px-4 py-3">Business</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Scans</th>
                    <th className="px-4 py-3">Reviews</th>
                    <th className="px-4 py-3">Revenue</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b, i) => {
                    const rev        = b.plan === "monthly" ? MONTHLY_PRICE : b.plan === "annual" ? ANNUAL_PRICE : 0;
                    const isExpanded = expanded === b.id;
                    return (
                      <>
                        <tr key={b.id} className={`border-b border-white/5 transition-colors ${i % 2 === 0 ? "bg-navy/40" : "bg-navy-muted/20"}`}>

                          {/* Business name */}
                          <td className="px-4 py-3 min-w-[160px]">
                            <div className="flex items-start gap-2">
                              <div>
                                <p className="font-medium text-white leading-tight">{b.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <button type="button" onClick={() => setExpanded(isExpanded ? null : b.id)}
                                    className="text-[10px] text-accent hover:underline">
                                    {isExpanded ? "Hide" : "Details"}
                                  </button>
                                  <button type="button" onClick={() => copyReviewLink(b.id)}
                                    className="text-[10px] text-text-muted hover:text-white">
                                    Copy QR link
                                  </button>
                                </div>
                              </div>
                              <ChurnBadge scans={b.scans} createdAt={b.created_at} />
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-4 py-3 text-text-muted text-xs max-w-[180px]">
                            <p className="truncate">{b.owner_phone}</p>
                            {b.owner_whatsapp && (
                              <a href={`https://wa.me/91${b.owner_whatsapp}`} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] text-green-400 hover:underline">
                                WhatsApp
                              </a>
                            )}
                          </td>

                          {/* Owner */}
                          <td className="px-4 py-3">
                            <p className="text-white text-xs font-medium">{b.owner_name ?? "—"}</p>
                            <p className="text-text-muted text-[10px]">{b.owner_designation ?? ""}</p>
                            <p className="text-text-muted text-[10px]">{b.owner_city ?? ""}</p>
                          </td>

                          {/* Plan */}
                          <td className="px-4 py-3">
                            <PlanBadge plan={b.plan} />
                            {b.plan_started_at && (
                              <p className="text-[10px] text-text-muted mt-0.5">{formatDate(b.plan_started_at)}</p>
                            )}
                          </td>

                          {/* Scans */}
                          <td className="px-4 py-3">
                            <p className={`font-semibold ${b.scans > 0 ? "text-white" : "text-text-muted"}`}>{b.scans ?? 0}</p>
                          </td>

                          {/* Reviews */}
                          <td className="px-4 py-3">
                            <p className={`font-semibold ${b.reviews > 0 ? "text-accent" : "text-text-muted"}`}>{b.reviews ?? 0}</p>
                          </td>

                          {/* Revenue */}
                          <td className="px-4 py-3 text-xs">
                            <p className={rev > 0 ? "text-green-400 font-semibold" : "text-text-muted"}>
                              {rev > 0 ? formatINR(rev) : "—"}
                            </p>
                          </td>

                          {/* Joined */}
                          <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                            {formatDate(b.created_at)}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <select value={b.plan ?? "free"} disabled={updating === b.id}
                                  onChange={e => changePlan(b.id, e.target.value)}
                                  className="rounded-lg border border-white/15 bg-navy/80 px-2 py-1 text-xs text-white outline-none focus:border-accent/50">
                                  <option value="free">Free</option>
                                  <option value="monthly">Monthly</option>
                                  <option value="annual">Annual</option>
                                </select>
                                <button onClick={() => deleteBusiness(b.id, b.name)} disabled={updating === b.id}
                                  className="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-40">
                                  Delete
                                </button>
                              </div>
                              {b.owner_phone?.includes("@") && (
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => sendReport(b)} disabled={sending === b.id}
                                    className="rounded-lg border border-white/15 px-2 py-1 text-xs text-text-muted hover:text-white disabled:opacity-40">
                                    {sending === b.id ? "Sending…" : "Send report"}
                                  </button>
                                  {sendMsg[b.id] && (
                                    <span className={`text-[10px] ${sendMsg[b.id].includes("✓") ? "text-green-400" : "text-red-400"}`}>
                                      {sendMsg[b.id]}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded details */}
                        {isExpanded && (
                          <tr key={`${b.id}-exp`} className="border-b border-white/5 bg-navy-muted/40">
                            <td colSpan={9} className="px-4 py-4">
                              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
                                <div>
                                  <p className="text-text-muted uppercase tracking-wide font-semibold mb-1">Address</p>
                                  <p className="text-white">{b.address || "—"}</p>
                                  {b.locality && <p className="text-text-muted text-[10px] mt-0.5">{b.locality}</p>}
                                </div>
                                <div>
                                  <p className="text-text-muted uppercase tracking-wide font-semibold mb-1">Google Review Link</p>
                                  {b.gmb_link
                                    ? <a href={b.gmb_link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Open link</a>
                                    : <p className="text-text-muted">—</p>}
                                </div>
                                <div>
                                  <p className="text-text-muted uppercase tracking-wide font-semibold mb-1">Keywords</p>
                                  <p className="text-white">{b.keywords || "—"}</p>
                                </div>
                                <div>
                                  <p className="text-text-muted uppercase tracking-wide font-semibold mb-1">Products</p>
                                  <p className="text-white">{b.products || "—"}</p>
                                </div>
                                {b.description && (
                                  <div className="col-span-2">
                                    <p className="text-text-muted uppercase tracking-wide font-semibold mb-1">Description</p>
                                    <p className="text-white">{b.description}</p>
                                  </div>
                                )}
                                {(b.dining_vibe || b.price_range) && (
                                  <div>
                                    <p className="text-text-muted uppercase tracking-wide font-semibold mb-1">Vibe / Price</p>
                                    <p className="text-white">{[b.dining_vibe, b.price_range].filter(Boolean).join(" · ")}</p>
                                  </div>
                                )}
                                {b.customer_profiles && (
                                  <div>
                                    <p className="text-text-muted uppercase tracking-wide font-semibold mb-1">Customer profiles</p>
                                    <p className="text-white">
                                      {(() => { try { return JSON.parse(b.customer_profiles).join(", "); } catch { return b.customer_profiles; } })()}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-text-muted uppercase tracking-wide font-semibold mb-1">Review link</p>
                                  <button onClick={() => copyReviewLink(b.id)}
                                    className="text-accent hover:underline text-[11px]">
                                    Copy to clipboard
                                  </button>
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
              {filtered.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-text-muted">
                  {search || planFilter !== "all" ? "No results match your filter." : "No businesses yet."}
                </p>
              )}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
