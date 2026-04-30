import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase-admin";

const CRON_SECRET = process.env.CRON_SECRET || "insightrep_cron_2026";
const FROM_EMAIL  = process.env.RESEND_FROM_EMAIL ?? "InsightRep <noreply@insightmedia.co.in>";

function formatNum(n) {
  return (n ?? 0).toString();
}

function weekRange() {
  const now  = new Date();
  const day  = now.getDay();
  const mon  = new Date(now);
  mon.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
  mon.setHours(0, 0, 0, 0);
  const prev = new Date(mon);
  prev.setDate(mon.getDate() - 7);
  const prevEnd = new Date(mon);
  prevEnd.setMilliseconds(-1);
  const fmt = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return {
    start: prev.toISOString(),
    end:   prevEnd.toISOString(),
    label: `${fmt(prev)} - ${fmt(prevEnd)}`,
  };
}

function buildHtml({ name, weekScans, weekReviews, totalScans, totalReviews, weekLabel }) {
  const monthEst = weekReviews * 4;
  const tip = weekReviews >= 5
    ? "Great week! Keep the QR visible and momentum will build."
    : weekScans === 0
    ? "No scans this week. Try placing the QR card at eye level near the payment counter."
    : "Tip: Ask staff to point customers to the QR card when they ask for the bill.";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
<tr><td>
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;margin:0 auto">

<tr><td style="background:#E5322D;border-radius:16px 16px 0 0;padding:28px 32px">
  <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.7);text-transform:uppercase">InsightRep</p>
  <h1 style="margin:6px 0 0;font-size:22px;font-weight:800;color:#fff">Weekly Report</h1>
  <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.7)">${weekLabel}</p>
</td></tr>

<tr><td style="background:#fff;padding:24px 32px 16px">
  <p style="margin:0;font-size:18px;font-weight:700;color:#111">${name}</p>
</td></tr>

<tr><td style="background:#fff;padding:0 32px 20px">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td width="50%" style="padding-right:6px">
        <div style="background:#f9f9f9;border-radius:12px;padding:18px;text-align:center">
          <div style="font-size:40px;font-weight:800;color:#111;line-height:1">${formatNum(weekScans)}</div>
          <div style="font-size:12px;color:#888;margin-top:4px">QR Scans this week</div>
        </div>
      </td>
      <td width="50%" style="padding-left:6px">
        <div style="background:#f9f9f9;border-radius:12px;padding:18px;text-align:center">
          <div style="font-size:40px;font-weight:800;color:#E5322D;line-height:1">${formatNum(weekReviews)}</div>
          <div style="font-size:12px;color:#888;margin-top:4px">Reviews generated</div>
        </div>
      </td>
    </tr>
  </table>
</td></tr>

<tr><td style="background:#fff;padding:0 32px 20px">
  <div style="height:1px;background:#f0f0f0;margin-bottom:20px"></div>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td width="50%" style="padding-right:6px">
        <div style="border:1px solid #eee;border-radius:12px;padding:14px;text-align:center">
          <div style="font-size:26px;font-weight:700;color:#111">${formatNum(totalScans)}</div>
          <div style="font-size:11px;color:#aaa;margin-top:2px">Total scans</div>
        </div>
      </td>
      <td width="50%" style="padding-left:6px">
        <div style="border:1px solid #eee;border-radius:12px;padding:14px;text-align:center">
          <div style="font-size:26px;font-weight:700;color:#111">${formatNum(totalReviews)}</div>
          <div style="font-size:11px;color:#aaa;margin-top:2px">Total reviews</div>
        </div>
      </td>
    </tr>
  </table>
</td></tr>

<tr><td style="background:#fff;padding:0 32px 20px">
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px">
    <p style="margin:0;font-size:13px;color:#166534;line-height:1.6">
      At this pace you are on track for approximately <strong>${formatNum(monthEst)} reviews this month</strong>.
      ${monthEst >= 20 ? " Keep it up — 4.5+ rating is within reach." : " Increasing QR visibility can double this number."}
    </p>
  </div>
</td></tr>

<tr><td style="background:#fff;padding:0 32px 20px">
  <div style="border-left:3px solid #E5322D;padding:12px 16px;background:#fff8f0;border-radius:0 8px 8px 0">
    <p style="margin:0;font-size:13px;color:#444;line-height:1.6">
      <strong style="color:#E5322D">Tip:</strong> ${tip}
    </p>
  </div>
</td></tr>

<tr><td style="background:#fff;padding:0 32px 28px;text-align:center">
  <a href="https://qr.insightmedia.co.in/dashboard"
    style="display:inline-block;background:#E5322D;color:#fff;text-decoration:none;border-radius:50px;padding:13px 32px;font-size:14px;font-weight:700">
    View Dashboard
  </a>
</td></tr>

<tr><td style="background:#f9f9f9;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center">
  <p style="margin:0;font-size:11px;color:#aaa;line-height:1.8">
    InsightRep by Insight Media, Chh. Sambhajinagar<br>
    <a href="https://qr.insightmedia.co.in" style="color:#E5322D;text-decoration:none">qr.insightmedia.co.in</a>
    &nbsp;|&nbsp;
    <a href="https://wa.me/917387609098" style="color:#E5322D;text-decoration:none">+91 73876 09098</a>
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ ok: false, message: "RESEND_API_KEY not set" }, { status: 500 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Supabase not configured" }, { status: 500 });
  }

  const resend = new Resend(resendKey);
  const { start, end, label } = weekRange();

  const { data: businesses, error } = await admin
    .from("businesses")
    .select("id, name, owner_phone, plan")
    .not("owner_phone", "is", null);

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  const emailOwners = (businesses ?? []).filter(
    (b) => b.owner_phone && b.owner_phone.includes("@")
  );

  const results = [];

  for (const biz of emailOwners) {
    try {
      const [ws, wr, ts, tr] = await Promise.all([
        admin.from("qr_scans").select("*", { count: "exact", head: true }).eq("business_id", biz.id).gte("scanned_at", start).lte("scanned_at", end),
        admin.from("review_copies").select("*", { count: "exact", head: true }).eq("business_id", biz.id).gte("copied_at", start).lte("copied_at", end),
        admin.from("qr_scans").select("*", { count: "exact", head: true }).eq("business_id", biz.id),
        admin.from("review_copies").select("*", { count: "exact", head: true }).eq("business_id", biz.id),
      ]);

      const html = buildHtml({
        name:         biz.name,
        weekScans:    ws.count  ?? 0,
        weekReviews:  wr.count  ?? 0,
        totalScans:   ts.count  ?? 0,
        totalReviews: tr.count  ?? 0,
        weekLabel:    label,
      });

      const { error: sendError } = await resend.emails.send({
        from:    FROM_EMAIL,
        to:      [biz.owner_phone],
        subject: `Your InsightRep weekly report - ${label}`,
        html,
      });

      results.push({
        business: biz.name,
        email:    biz.owner_phone,
        ok:       !sendError,
        error:    sendError?.message,
      });

      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      results.push({ business: biz.name, ok: false, error: err.message });
    }
  }

  return NextResponse.json({
    ok:     true,
    sent:   results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    total:  emailOwners.length,
    results,
  });
}
