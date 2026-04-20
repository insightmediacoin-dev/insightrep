import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request) {
  try {
    const { businessId, rating } = await request.json();
    if (!businessId) return NextResponse.json({ ok: false }, { status: 400 });

    const admin = createAdminClient();
    await admin.from('review_copies').insert({ business_id: businessId, rating });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}