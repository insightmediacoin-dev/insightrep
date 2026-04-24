import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

const SECRET = "577151032779";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('secret') !== SECRET)
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: businesses, error } = await admin
    .from('businesses')
    .select('id, name, owner_phone, plan, created_at, address, gmb_link, keywords, owner_name, owner_designation, owner_city, owner_whatsapp')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

  const withStats = await Promise.all(businesses.map(async (b) => {
    const [{ count: scans }, { count: reviews }] = await Promise.all([
      admin.from('qr_scans').select('*', { count: 'exact', head: true }).eq('business_id', b.id),
      admin.from('review_copies').select('*', { count: 'exact', head: true }).eq('business_id', b.id),
    ]);
    return { ...b, scans: scans ?? 0, reviews: reviews ?? 0 };
  }));

  return NextResponse.json({ ok: true, businesses: withStats });
}