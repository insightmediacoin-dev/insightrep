import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request) {
  try {
    const { businessId } = await request.json();
    if (!businessId) return NextResponse.json({ ok: false }, { status: 400 });

    const admin = createAdminClient();
    const userAgent = request.headers.get('user-agent') ?? '';
    const referrer = request.headers.get('referer') ?? '';

    await admin.from('qr_scans').insert({ business_id: businessId, user_agent: userAgent, referrer });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}