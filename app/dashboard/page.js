import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ ok: false }, { status: 400 });

    const admin = createAdminClient();

    const [{ count: scans }, { count: reviews }] = await Promise.all([
      admin.from('qr_scans').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
      admin.from('review_copies').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
    ]);

    return NextResponse.json({ ok: true, scans: scans ?? 0, reviews: reviews ?? 0 });
  } catch (err) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}