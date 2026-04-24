import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

const SECRET = "577151032779";

export async function POST(request) {
  const { secret, businessId, plan } = await request.json();
  if (secret !== SECRET)
    return NextResponse.json({ ok: false }, { status: 401 });

  const admin = createAdminClient();
  await admin.from('businesses').update({ plan, plan_started_at: new Date().toISOString() }).eq('id', businessId);

  return NextResponse.json({ ok: true });
}