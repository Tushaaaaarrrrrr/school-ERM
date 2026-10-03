import { NextResponse } from 'next/server';
import { requireSchoolAccess } from '@/lib/server/access';
import { serverDb } from '@/lib/server/db';
import { calculateSchoolStatus } from '@/lib/utils/school-timing';

export async function GET() {
  try {
    const access = await requireSchoolAccess();
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'No school access' }, { status: access.status || 403 });
    const [school, holidays] = await Promise.all([serverDb.getSchoolById(access.schoolId), serverDb.getHolidays(access.schoolId)]);
    if (!school) return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 });
    if (!school.school_hours && !school.weekly_timings) return NextResponse.json({ success: false, error: 'School hours have not been configured' }, { status: 409 });
    return NextResponse.json({ success: true, data: calculateSchoolStatus(school, holidays) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Could not load school status' }, { status: 500 });
  }
}
