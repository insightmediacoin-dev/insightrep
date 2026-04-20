import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request) {
  try {
    const { phone, otp } = await request.json();

    if (otp !== '123456') {
      return NextResponse.json({ ok: false, message: 'Invalid OTP' }, { status: 401 });
    }

    const admin = createAdminClient();

    // Check if business already exists
    const { data: existing } = await admin
      .from('businesses')
      .select('id')
      .eq('owner_phone', phone)
      .single();

    return NextResponse.json({
      ok: true,
      phone,
      hasProfile: !!existing,
      businessId: existing?.id || null
    });

  } catch (err) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}