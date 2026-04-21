import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request) {
  try {
    const { businessId, owner_name, owner_designation, owner_city, owner_whatsapp } = await request.json();
    if (!businessId) return NextResponse.json({ ok: false, message: 'Business ID required.' }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin
      .from('businesses')
      .update({ owner_name, owner_designation, owner_city, owner_whatsapp })
      .eq('id', businessId);

    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}