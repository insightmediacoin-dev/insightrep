import Link from "next/link";
import ROICalculator from "./components/ROICalculator";
import FAQSection from "./components/FAQSection";
import QRCardsSection from "./components/QRCardsSection";

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">

      {/* NAV */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-navy/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white shadow-[0_0_24px_rgba(229,50,45,0.35)]">IR</span>
            <span className="text-base font-semibold tracking-tight text-white">InsightRep</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/pitch" className="rounded-full border border-white/10 px-3 py-2 text-sm font-medium text-text-muted transition hover:border-white/20 hover:text-white sm:px-4">
              See pitch
            </Link>
            <Link href="/login" className="rounded-full border border-white/10 px-3 py-2 text-sm font-medium text-text-muted transition hover:border-white/20 hover:text-white sm:px-4">
              Owner login
            </Link>
            <Link href="/login" className="rounded-full bg-accent px-3 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(229,50,45,0.25)] transition hover:brightness-110 sm:px-4">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">

        {/* HERO */}
        <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16">
          <div aria-hidden className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl sm:-right-10 sm:h-96 sm:w-96" />
          <div aria-hidden className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
            <div className="flex-1 space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Built for India · Restaurants · Cafes · Hotels · Any business
              </p>
              <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl sm:leading-tight lg:text-5xl lg:leading-[1.1]">
                Customer scans QR.<br />
                AI writes the review.<br />
                <span className="text-accent">Posted on Google in 60 seconds.</span>
              </h1>
              <p className="max-w-xl text-pretty text-base leading-relaxed text-text-muted sm:text-lg">
                No awkward asking. No staff training. Customer picks their mood, AI writes 3 review options that sound real — they paste and post. Your Google rating climbs every week.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(229,50,45,0.3)] transition hover:brightness-110">
                  Start free — no card needed
                </Link>
                <Link href="/pitch" className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-semibold text-text-muted transition hover:text-white">
                  See how it works →
                </Link>
              </div>

              <dl className="grid grid-cols-3 gap-3 pt-2 sm:max-w-md sm:gap-4">
                {[
                  { k: "Time to post", v: "60 sec" },
                  { k: "Review options", v: "3 AI drafts" },
                  { k: "Setup time", v: "5 minutes" },
                ].map((item) => (
                  <div key={item.k} className="rounded-xl border border-white/10 bg-navy-muted/60 px-3 py-3 text-center sm:px-4">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-text-muted sm:text-xs">{item.k}</dt>
                    <dd className="mt-1 text-sm font-semibold text-white sm:text-base">{item.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Phone mockup */}
            <div className="relative flex-1 lg:max-w-sm">
              <div className="relative rounded-[2rem] border border-white/10 bg-gradient-to-br from-navy-muted to-navy p-4 shadow-2xl shadow-black/40">
                <div className="space-y-3 rounded-2xl bg-navy/90 p-4">
                  {/* Brand */}
                  <p className="text-center text-[10px] font-bold uppercase tracking-widest text-accent">InsightRep</p>
                  <p className="text-center text-base font-bold text-white">Sharma's Cafe</p>
                  <p className="text-center text-xs text-text-muted">Cidco, Chh. Sambhajinagar</p>

                  {/* Stars */}
                  <div className="flex justify-center gap-1 py-1">
                    {[1,2,3,4,5].map(n => (
                      <span key={n} className="text-2xl text-[#F4B400]">★</span>
                    ))}
                  </div>
                  <p className="text-center text-xs font-semibold text-[#F4B400]">Excellent!</p>

                  {/* Mood selector */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">What brings you here?</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { icon: "😊", label: "Relaxed" },
                        { icon: "🎉", label: "Celebrating" },
                        { icon: "💑", label: "Date night", active: true },
                        { icon: "👨‍👩‍👧", label: "Family time" },
                      ].map(m => (
                        <div key={m.label} className={`flex items-center gap-1.5 rounded-xl border px-2 py-1.5 ${m.active ? "border-accent bg-accent/15" : "border-white/10 bg-white/5"}`}>
                          <span className="text-sm">{m.icon}</span>
                          <span className={`text-[10px] font-medium ${m.active ? "text-accent" : "text-text-muted"}`}>{m.label}</span>
                          {m.active && <span className="ml-auto text-accent text-[8px]">✓</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI draft */}
                  <div className="rounded-xl border border-accent/30 bg-accent/5 p-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-accent mb-1">AI wrote this for you</p>
                    <p className="text-[10px] leading-relaxed text-white/70">"Came here for a date night and the atmosphere was perfect. Food was excellent and staff very attentive."</p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg bg-white/10 py-2 text-center text-[10px] font-medium text-white">Copy review</div>
                    <div className="rounded-lg bg-accent py-2 text-center text-[10px] font-semibold text-white">Open Google</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="border-t border-white/5 bg-navy-muted/20 px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-text-muted mb-6">Trusted by businesses in Chh. Sambhajinagar</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { name: "Cliff — All Day Dining & Bar", stat: "32 scans · 10 reviews", type: "Bar / Restaurant" },
                { name: "Mrignayani Restaurant", stat: "Monthly plan", type: "Restaurant" },
                { name: "Abhijeets Brew House", stat: "Active", type: "Bar" },
                { name: "Kake di Hatti", stat: "Pure Veg Restaurant", type: "Restaurant" },
              ].map(c => (
                <div key={c.name} className="rounded-xl border border-white/8 bg-white/3 p-4">
                  <p className="text-xs font-semibold text-white leading-snug">{c.name}</p>
                  <p className="text-[10px] text-text-muted mt-1">{c.type}</p>
                  <p className="text-[10px] text-accent mt-1">{c.stat}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">How it works</p>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">4 steps. 60 seconds. Done.</h2>
              <p className="mt-3 text-text-muted text-sm">No app download. Works on any phone.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { n: "1", icon: "📱", title: "Customer scans QR", body: "Table card scan — opens instantly in browser. No app needed." },
                { n: "2", icon: "⭐", title: "Picks mood + stars", body: "Rates 3-5 stars and tells us what brought them — date night, family, work visit." },
                { n: "3", icon: "🤖", title: "AI writes 3 options", body: "Time-aware, mood-aware reviews that sound like real locals — not AI." },
                { n: "4", icon: "✅", title: "Copies and posts", body: "Taps copy, paste on Google, hits post. Done in under 60 seconds." },
              ].map(s => (
                <div key={s.n} className="rounded-2xl border border-white/10 bg-navy-muted/40 p-5 relative">
                  <div className="absolute -top-3 -left-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">{s.n}</div>
                  <div className="text-3xl mb-3 mt-2">{s.icon}</div>
                  <h3 className="font-semibold text-white text-sm mb-1">{s.title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES — Updated with today's features */}
        <section className="border-t border-white/5 bg-navy-muted/20 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">Features</p>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Built different from generic review tools</h2>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: "🕐", title: "Time-aware reviews", body: "9pm scan never writes a lunch review. Morning, afternoon, evening, night — AI knows the difference." },
                { icon: "😊", title: "Mood selector", body: "Customer picks: date night, family visit, work lunch, friends hangout. Reviews match the actual occasion." },
                { icon: "⚡", title: "Pre-fetched — instant", body: "Review generation starts the moment mood is selected. Zero wait time when they tap generate." },
                { icon: "🏪", title: "Works for any business", body: "Restaurant, cafe, hotel, gym, salon, clinic, agency — moods and reviews adapt per business type." },
                { icon: "📈", title: "SEO-optimized naturally", body: "Keywords embedded into reviews the way a real customer would say them. Never stuffed." },
                { icon: "📊", title: "Weekly email reports", body: "Every Monday — scans, reviews, and tips sent to your email. Stay updated without logging in." },
              ].map(f => (
                <li key={f.title} className="rounded-2xl border border-white/10 bg-navy-muted/40 p-5 transition hover:border-accent/30">
                  <span className="text-2xl block mb-3">{f.icon}</span>
                  <h3 className="font-semibold text-white text-sm mb-1">{f.title}</h3>
                  <p className="text-xs leading-relaxed text-text-muted">{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ROI Calculator */}
        <ROICalculator />

        {/* PRICING */}
        <section className="border-t border-white/5 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">Pricing</p>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Less than a cup of chai per day</h2>
              <p className="mt-3 text-text-muted text-sm sm:text-base">Results that pay for themselves in the first week.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
              <div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-6 space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Monthly</p>
                  <p className="mt-2 text-4xl font-extrabold text-white">Rs.1,499<span className="text-base font-medium text-text-muted">/mo</span></p>
                  <p className="text-xs text-text-muted mt-1">Rs.49 per day · Cancel anytime</p>
                </div>
                <ul className="space-y-2 text-sm text-text-muted">
                  {["Unlimited QR scans","AI review generation","Mood-aware reviews","Time-aware reviews","Dashboard analytics","Weekly email report","PNG QR download"].map(f => (
                    <li key={f} className="flex items-center gap-2"><span className="text-accent font-bold">✓</span>{f}</li>
                  ))}
                </ul>
                <Link href="/login" className="flex h-11 w-full items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-white transition hover:border-accent hover:text-accent">
                  Get started →
                </Link>
              </div>
              <div className="relative rounded-2xl border border-accent/50 bg-accent/5 p-6 space-y-5">
                <div className="absolute top-4 right-4 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-full tracking-wide">BEST VALUE</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent">Annual</p>
                  <p className="mt-2 text-4xl font-extrabold text-white">Rs.12,990<span className="text-base font-medium text-text-muted">/yr</span></p>
                  <p className="text-xs text-accent font-semibold mt-1">3 months FREE · Save Rs.4,998</p>
                  <p className="text-xs text-text-muted">Rs.35 per day</p>
                </div>
                <ul className="space-y-2 text-sm text-text-muted">
                  {["Everything in Monthly","3 extra months free","Priority WhatsApp support","Founding member rate locked forever"].map(f => (
                    <li key={f} className="flex items-center gap-2"><span className="text-accent font-bold">✓</span>{f}</li>
                  ))}
                </ul>
                <Link href="/login" className="flex h-11 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white shadow-[0_8px_24px_rgba(229,50,45,0.3)] transition hover:brightness-110">
                  Get started →
                </Link>
              </div>
            </div>
            <p className="text-center text-xs text-text-muted mt-6">Payments via Razorpay coming soon · WhatsApp us to activate: <a href="https://wa.me/917387609098" className="text-accent hover:underline">+91 73876 09098</a></p>
          </div>
        </section>

        {/* QR CARDS */}
        <section className="border-t border-white/5 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">Add-ons</p>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Printed QR Cards</h2>
              <p className="mt-3 text-text-muted text-sm sm:text-base">Premium PVC cards with your QR — place at tables, counters and billing desks.</p>
            </div>
            <QRCardsSection />
          </div>
        </section>

        {/* FAQ */}
        <FAQSection />

        {/* CTA */}
        <section className="border-t border-white/5 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/10 via-navy-muted/50 to-navy p-8 text-center sm:p-12">
            <h2 className="max-w-xl text-2xl font-bold text-white sm:text-3xl">Your competitors are already getting more reviews.</h2>
            <p className="max-w-lg text-sm text-text-muted sm:text-base">Set up in 5 minutes. QR on your counter today. Reviews coming in from tomorrow.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-8 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(229,50,45,0.35)] transition hover:brightness-110">
                Start free trial
              </Link>
              <a href="https://wa.me/917387609098?text=Hi, I want to know more about InsightRep" target="_blank" rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-8 text-sm font-semibold text-text-muted transition hover:text-white">
                WhatsApp us
              </a>
            </div>
            <p className="text-xs text-text-muted">No credit card · 5 min setup · Cancel anytime</p>
          </div>
        </section>

      </main>

      <footer className="mt-auto border-t border-white/5 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-center text-xs text-text-muted sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} InsightRep · By Insight Media · Chh. Sambhajinagar</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-white">Owner login</Link>
            <span className="text-white/20">|</span>
            <Link href="/pitch" className="hover:text-white">Pitch deck</Link>
            <span className="text-white/20">|</span>
            <Link href="/legal" className="hover:text-white">Terms & Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
