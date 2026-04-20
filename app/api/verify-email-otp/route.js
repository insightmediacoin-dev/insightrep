import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();
    const admin = createAdminClient();

    // Verify OTP from otp_store
    const { data: record } = await admin
      .from('otp_store')
      .select('*')
      .eq('identifier', email)
      .eq('otp', otp)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!record) {
      return NextResponse.json({ ok: false, message: 'Invalid or expired OTP' }, { status: 401 });
    }

    // Delete used OTP
    await admin.from('otp_store').delete().eq('identifier', email);

    // Check if business already exists
    const { data: existing } = await admin
      .from('businesses')
      .select('id')
      .eq('owner_phone', email)
      .single();

    return NextResponse.json({
      ok: true,
      email,
      hasProfile: !!existing,
      businessId: existing?.id || null
    });

  } catch (err) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}