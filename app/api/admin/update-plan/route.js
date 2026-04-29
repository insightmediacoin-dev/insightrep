import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

const SECRET = "577151032779";

export async function POST(request) {
  const { secret, businessId, plan } = await request.json();
  if (secret !== SECRET)
    return NextResponse.json({ ok: false }, { status: 401 });

  const admin = createAdminClient();

  const { error } = await admin
    .from('businesses')
    .update({ 
      plan,
      plan_started_at: new Date().toISOString()
    })
    .eq('id', businessId);

  if (error) {
    // Try without plan_started_at if column doesn't exist
    const { error: error2 } = await admin
      .from('businesses')
      .update({ plan })
      .eq('id', businessId);
    
    if (error2) return NextResponse.json({ ok: false, message: error2.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
