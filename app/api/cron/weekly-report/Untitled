import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { Resend } from 'resend';

export async function GET(request) {
  // Protect cron endpoint
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const admin = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'InsightRep <noreply@insightmedia.co.in>';

  // Get all email-based businesses
  const { data: businesses } = await admin
    .from('businesses')
    .select('id, name, owner_phone')
    .like('owner_phone', '%@%');

  if (!businesses?.length) return NextResponse.json({ ok: true, sent: 0 });

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  let sent = 0;

  for (const biz of businesses) {
    const [{ count: scans }, { count: reviews }] = await Promise.all([
      admin.from('qr_scans').select('*', { count: 'exact', head: true })
        .eq('business_id', biz.id).gte('scanned_at', oneWeekAgo),
      admin.from('review_copies').select('*', { count: 'exact', head: true })
        .eq('business_id', biz.id).gte('copied_at', oneWeekAgo),
    ]);

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [biz.owner_phone],
      subject: `📊 Your weekly InsightRep report — ${biz.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0f1729;color:#fff;border-radius:16px;overflow:hidden">
          <div style="background:#E5322D;padding:24px 32px">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;color:#fff;opacity:0.8">INSIGHTREP</p>
            <h1 style="margin:8px 0 0;font-size:22px;font-weight:800;color:#fff">Weekly Report</h1>
          </div>
          <div style="padding:32px">
            <p style="margin:0 0 8px;color:#aaa;font-size:14px">Hi there,</p>
            <p style="margin:0 0 24px;color:#fff;font-size:15px">Here's how <strong>${biz.name}</strong> performed this week:</p>
            <div style="display:flex;gap:16px;margin-bottom:24px">
              <div style="flex:1;background:#1a2540;border-radius:12px;padding:20px;text-align:center">
                <p style="margin:0;font-size:36px;font-weight:800;color:#fff">${scans ?? 0}</p>
                <p style="margin:6px 0 0;font-size:12px;color:#aaa;text-transform:uppercase;letter-spacing:1px">QR Scans</p>
              </div>
              <div style="flex:1;background:#1a2540;border-radius:12px;padding:20px;text-align:center">
                <p style="margin:0;font-size:36px;font-weight:800;color:#E5322D">${reviews ?? 0}</p>
                <p style="margin:6px 0 0;font-size:12px;color:#aaa;text-transform:uppercase;letter-spacing:1px">Reviews Posted</p>
              </div>
            </div>
            <a href="https://qr.insightmedia.co.in/dashboard" style="display:block;background:#E5322D;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:50px;font-weight:700;font-size:14px">View Dashboard →</a>
            <p style="margin:24px 0 0;font-size:11px;color:#555;text-align:center">InsightRep · By Insight Media</p>
          </div>
        </div>
      `,
    });

    if (!error) sent++;
  }

  return NextResponse.json({ ok: true, sent });
}