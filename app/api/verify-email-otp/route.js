import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    const admin = createAdminClient();

    // Step 1: Find valid OTP record
    const { data: record } = await admin
      .from('otp_store')
      .select('*')
      .eq('identifier', normalizedEmail)
      .eq('otp', otp)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    // Step 2: If not found — return error WITHOUT deleting
    if (!record) {
      return NextResponse.json(
        { ok: false, message: 'Invalid or expired OTP' },
        { status: 401 }
      );
    }

    // Step 3: OTP is valid — NOW delete it
    await admin.from('otp_store').delete().eq('identifier', normalizedEmail);

    // Step 4: Check if business exists
    const { data: existing } = await admin
      .from('businesses')
      .select('id')
      .eq('owner_phone', normalizedEmail)
      .maybeSingle();

    return NextResponse.json({
      ok:         true,
      email:      normalizedEmail,
      hasProfile: !!existing,
      businessId: existing?.id || null,
    });

  } catch (err) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
