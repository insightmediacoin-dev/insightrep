"use client";

import { useState } from "react";
import Link from "next/link";

export default function ROICalculator() {
  const [footfall, setFootfall] = useState(300);
  const [avgSpend, setAvgSpend] = useState(400);
  const [currentReviews, setCurrentReviews] = useState(10);

  // Calculations
  const newReviewsPerMonth = Math.round(footfall * 0.06);
  const extraCustomersMonth1 = Math.round(footfall * 0.08);
  const extraRevenueMonth1 = extraCustomersMonth1 * avgSpend;
  const netProfit = extraRevenueMonth1 - 1499;
  const roi = Math.round((netProfit / 1499) * 100);
  const reviewsAfter6Months = currentReviews + (newReviewsPerMonth * 6);
  const breakEvenDays = Math.ceil(1499 / (extraRevenueMonth1 / 30));

  function formatINR(n) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  }

  return (
    <section className="border-t border-white/5 px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">ROI Calculator</p>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Does InsightRep pay for itself?</h2>
          <p className="mt-3 text-text-muted text-sm sm:text-base">Enter your numbers and see your estimated return.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">

          {/* Inputs */}
          <div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-6 space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-text-muted">Your restaurant</h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Monthly customers</label>
                <span className="text-sm font-bold text-accent">{footfall.toLocaleString("en-IN")}</span>
              </div>
              <input type="range" min={50} max={2000} step={50} value={footfall}
                onChange={e => setFootfall(Number(e.target.value))}
                className="w-full accent-accent" />
              <div className="flex justify-between text-xs text-text-muted">
                <span>50</span><span>2,000</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Avg spend per customer</label>
                <span className="text-sm font-bold text-accent">{formatINR(avgSpend)}</span>
              </div>
              <input type="range" min={100} max={2000} step={50} value={avgSpend}
                onChange={e => setAvgSpend(Number(e.target.value))}
                className="w-full accent-accent" />
              <div className="flex justify-between text-xs text-text-muted">
                <span>₹100</span><span>₹2,000</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Current Google reviews</label>
                <span className="text-sm font-bold text-accent">{currentReviews}</span>
              </div>
              <input type="range" min={0} max={500} step={5} value={currentReviews}
                onChange={e => setCurrentReviews(Number(e.target.value))}
                className="w-full accent-accent" />
              <div className="flex justify-between text-xs text-text-muted">
                <span>0</span><span>500</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 text-center">
                <p className="text-3xl font-extrabold text-accent">{newReviewsPerMonth}</p>
                <p className="mt-1 text-xs text-text-muted uppercase tracking-wide">New reviews/month</p>
              </div>
              <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5 text-center">
                <p className="text-3xl font-extrabold text-green-400">{extraCustomersMonth1}</p>
                <p className="mt-1 text-xs text-text-muted uppercase tracking-wide">Extra customers/month</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-5 text-center">
                <p className="text-3xl font-extrabold text-white">{formatINR(extraRevenueMonth1)}</p>
                <p className="mt-1 text-xs text-text-muted uppercase tracking-wide">Extra revenue/month</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-5 text-center">
                <p className="text-3xl font-extrabold text-white">{reviewsAfter6Months}</p>
                <p className="mt-1 text-xs text-text-muted uppercase tracking-wide">Reviews in 6 months</p>
              </div>
            </div>

            {/* ROI highlight */}
            <div className="rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/15 to-accent/5 p-6 text-center space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">Your ROI</p>
              <p className="text-5xl font-extrabold text-white">{roi}%</p>
              <p className="text-sm text-text-muted">Net profit: <span className="text-green-400 font-semibold">{formatINR(netProfit)}/month</span></p>
              <p className="text-xs text-text-muted">InsightRep pays for itself in <span className="text-white font-semibold">{breakEvenDays} days</span></p>
            </div>

            <Link href="/login"
              className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white shadow-[0_8px_24px_rgba(255,59,92,0.3)] hover:brightness-110">
              Start getting more reviews — ₹1,499/month
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}