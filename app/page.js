import Link from "next/link";

const stepsOwner = [
  {
    title: "Verify with OTP",
    body: "Business owners sign in with a phone OTP — quick and familiar for Indian teams.",
  },
  {
    title: "Profile & keywords",
    body: "Add your name, address, Google review link, SEO keywords, and hero dishes or rooms.",
  },
  {
    title: "Print your QR",
    body: "We generate a QR that sends happy guests straight into your guided review flow.",
  },
];

const stepsCustomer = [
  {
    title: "Scan & rate",
    body: "Guests scan the QR, pick 3–5 stars, and answer a few taps about food, service, or products.",
  },
  {
    title: "Pick a review",
    body: "InsightRep drafts three options that sound human and match what they actually said.",
  },
  {
    title: "Copy & Google",
    body: "They copy one line, then land on your Google review page ready to paste and post.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-navy/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white shadow-[0_0_24px_rgba(255,59,92,0.35)]">
              IR
            </span>
            <span className="text-base font-semibold tracking-tight text-white">InsightRep</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="rounded-full border border-white/10 px-3 py-2 text-sm font-medium text-text-muted transition hover:border-white/20 hover:text-white sm:px-4">
              Owner login
            </Link>
            <Link href="/login" className="rounded-full bg-accent px-3 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(255,59,92,0.25)] transition hover:brightness-110 sm:px-4">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">

        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16">
          <div aria-hidden className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl sm:-right-10 sm:h-96 sm:w-96" />
          <div aria-hidden className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
            <div className="flex-1 space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Built for India · Restaurants · Cafés · Hotels
              </p>
              <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl sm:leading-tight lg:text-5xl lg:leading-[1.1]">
                Turn great visits into{" "}
                <span className="text-accent">Google reviews</span> — without the awkward ask.
              </h1>
              <p className="max-w-xl text-pretty text-base leading-relaxed text-text-muted sm:text-lg">
                InsightRep is an AI-assisted QR journey: your team gets a branded flow, guests get three ready-to-post lines, and your listing gets consistent, keyword-aware reviews that still feel real.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(255,59,92,0.3)] transition hover:brightness-110">
                  Start as a business owner
                </Link>
                <p className="text-center text-xs text-text-muted sm:text-left sm:text-sm">
                  No card to explore the owner dashboard. Customer flow opens from your QR.
                </p>
              </div>
              <dl className="grid grid-cols-3 gap-3 pt-2 sm:max-w-md sm:gap-4">
                {[
                  { k: "Stars", v: "3–5 only" },
                  { k: "Drafts", v: "3 AI options" },
                  { k: "End", v: "Google link" },
                ].map((item) => (
                  <div key={item.k} className="rounded-xl border border-white/10 bg-navy-muted/60 px-3 py-3 text-center sm:px-4">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-text-muted sm:text-xs">{item.k}</dt>
                    <dd className="mt-1 text-sm font-semibold text-white sm:text-base">{item.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative flex-1 lg:max-w-md">
              <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-navy-muted to-navy p-5 shadow-2xl shadow-black/40 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-text-muted">Live preview</span>
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">Customer path</span>
                </div>
                <div className="space-y-3 rounded-xl bg-navy/80 p-4 ring-1 ring-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Rate your visit</span>
                    <span className="text-xs text-text-muted">Step 1 / 3</span>
                  </div>
                  <div className="flex justify-center gap-2 py-2">
                    {[3, 4, 5].map((n) => (
                      <span key={n} className={`flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold tabular-nums ${n === 5 ? "bg-accent text-white shadow-lg shadow-accent/30" : "border border-white/15 bg-white/5 text-text-muted"}`}>
                        {n}★
                      </span>
                    ))}
                  </div>
                  <p className="text-center text-[11px] text-text-muted">Only 3–5★ flows — we keep the experience positive.</p>
                  <div className="space-y-2 border-t border-white/10 pt-3">
                    <p className="text-xs font-medium text-text-muted">Quick questions</p>
                    {["Food quality", "Service", "Would recommend"].map((q) => (
                      <div key={q} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs text-white/90">
                        <span>{q}</span>
                        <span className="text-accent">···</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-dashed border-accent/40 bg-accent/5 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-accent">AI drafts</p>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">"Warm service, standout butter chicken, will book the terrace again…"</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <span className="flex-1 rounded-lg bg-white/10 py-2 text-center text-xs font-medium text-white/80">Copy review</span>
                    <span className="flex-1 rounded-lg bg-accent py-2 text-center text-xs font-semibold text-white">Open Google</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Two sides */}
        <section className="border-t border-white/5 bg-navy-muted/30 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Two sides, one loop</h2>
              <p className="mt-3 text-base text-text-muted sm:text-lg">Owners control the story; customers do the typing in seconds — tuned for busy Indian outlets and front-of-house teams.</p>
            </div>
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-navy p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-2">
                  <span className="rounded-lg bg-accent/15 px-2 py-1 text-xs font-semibold text-accent">Owner</span>
                  <h3 className="text-lg font-semibold text-white">Dashboard & QR</h3>
                </div>
                <ol className="space-y-4">
                  {stepsOwner.map((s, i) => (
                    <li key={s.title} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-accent">{i + 1}</span>
                      <div>
                        <p className="font-medium text-white">{s.title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-text-muted">{s.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <Link href="/setup" className="mt-6 inline-flex text-sm font-semibold text-accent hover:underline">Business setup form →</Link>
              </div>
              <div className="rounded-2xl border border-white/10 bg-navy p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-2">
                  <span className="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-white">Customer</span>
                  <h3 className="text-lg font-semibold text-white">Scan → post</h3>
                </div>
                <ol className="space-y-4">
                  {stepsCustomer.map((s, i) => (
                    <li key={s.title} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">{i + 1}</span>
                      <div>
                        <p className="font-medium text-white">{s.title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-text-muted">{s.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="mt-6 text-sm text-text-muted">Each business gets a unique path: <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-accent">/review/[id]</code></p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">Why teams pick InsightRep</h2>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "India-first OTP", body: "MSG91-backed login — the same pattern staff already trust on Zomato and bank apps." },
                { title: "SEO-aware drafts", body: "Keywords and featured products steer the model without stuffing or sounding robotic." },
                { title: "Mobile-first QR", body: "Large tap targets, short steps, and copy-paste into Google in one motion." },
              ].map((f) => (
                <li key={f.title} className="rounded-2xl border border-white/10 bg-navy-muted/40 p-5 transition hover:border-accent/30">
                  <span className="mb-3 block h-1 w-10 rounded-full bg-accent" />
                  <h3 className="font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t border-white/5 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-2">Pricing</p>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Simple, transparent pricing</h2>
              <p className="mt-3 text-text-muted text-sm sm:text-base">Less than a cup of chai per day — results that pay for themselves in Week 1.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">

              <div className="rounded-2xl border border-white/10 bg-navy-muted/40 p-6 space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Starter</p>
                  <p className="mt-2 text-4xl font-extrabold text-white">₹1,499<span className="text-base font-medium text-text-muted">/mo</span></p>
                  <p className="text-xs text-text-muted mt-1">₹49 per day · Cancel anytime</p>
                </div>
                <ul className="space-y-2 text-sm text-text-muted">
                  {["Unlimited QR scans", "AI review generation", "3–5 star filter only", "SEO keyword embedding", "Dashboard analytics", "Weekly email report", "PNG QR download"].map(f => (
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
                  <p className="mt-2 text-4xl font-extrabold text-white">₹12,990<span className="text-base font-medium text-text-muted">/yr</span></p>
                  <p className="text-xs text-accent font-semibold mt-1">3 months FREE · Save ₹4,998</p>
                  <p className="text-xs text-text-muted">₹35 per day</p>
                </div>
                <ul className="space-y-2 text-sm text-text-muted">
                  {["Everything in Starter", "3 extra months free", "Priority WhatsApp support", "Founding member rate locked forever"].map(f => (
                    <li key={f} className="flex items-center gap-2"><span className="text-accent font-bold">✓</span>{f}</li>
                  ))}
                </ul>
                <Link href="/login" className="flex h-11 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-white shadow-[0_8px_24px_rgba(255,59,92,0.3)] transition hover:brightness-110">
                  Get started →
                </Link>
              </div>

            </div>
            <p className="text-center text-xs text-text-muted mt-6">Payments via Razorpay coming soon · WhatsApp us to activate manually</p>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/5 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/10 via-navy-muted/50 to-navy p-8 text-center sm:p-12">
            <h2 className="max-w-xl text-2xl font-bold text-white sm:text-3xl">Ready to fill your Google listing with real guest voices?</h2>
            <p className="max-w-lg text-sm text-text-muted sm:text-base">Create your profile, drop a QR on tables or the reception desk, and let InsightRep handle the wording.</p>
            <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-8 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(255,59,92,0.35)] transition hover:brightness-110">
              Log in with phone OTP
            </Link>
          </div>
        </section>

      </main>

      <footer className="mt-auto border-t border-white/5 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-center text-xs text-text-muted sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} InsightRep. Made for Indian hospitality.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-white">Owners</Link>
            <span className="text-white/20">|</span>
            <span>Customers use your QR — no app install.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}