"use client";

import { useEffect, useState } from "react";

const ADMIN_PASSWORD = "577151032779";

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

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);

  function login() {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError("");
    } else {
      setPwError("Wrong password.");
    }
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
    } finally {
      setUpdating(null);
    }
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
    } finally {
      setUpdating(null);
    }
  }

  useEffect(() => { if (authed) loadBusinesses(); }, [authed]);

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
            ↻ Refresh
          </button>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Businesses", value: businesses.length },
            { label: "Free Plan", value: businesses.filter(b => !b.plan || b.plan === "free").length },
            { label: "Monthly Plan", value: businesses.filter(b => b.plan === "monthly").length },
            { label: "Annual Plan", value: businesses.filter(b => b.plan === "annual").length },
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
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Scans</th>
                    <th className="px-4 py-3">Reviews</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((b, i) => (
                    <tr key={b.id} className={`border-b border-white/5 ${i % 2 === 0 ? "bg-navy/40" : "bg-navy-muted/20"}`}>
                      <td className="px-4 py-3 font-medium text-white">{b.name}</td>
                      <td className="px-4 py-3 text-text-muted text-xs">{b.owner_phone}</td>
                      <td className="px-4 py-3"><PlanBadge plan={b.plan} /></td>
                      <td className="px-4 py-3 text-white font-semibold">{b.scans ?? 0}</td>
                      <td className="px-4 py-3 text-accent font-semibold">{b.reviews ?? 0}</td>
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
                  ))}
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