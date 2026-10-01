import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isoDate, parseJsonBody } from '@/lib/server/validation';
import type { SchoolHoliday } from '@/lib/types';

const holidayUpdate = z.object({
  school_id: z.string().optional(),
  academic_year_id: z.string().optional(),
  name: z.string().trim().min(1).max(120).optional(),
  start_date: isoDate.optional(),
  end_date: isoDate.optional(),
  reason: z.string().max(500).nullish(),
  description: z.string().max(500).nullish(),
});
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parsed = await parseJsonBody(request, holidayUpdate);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const access = await requireSchoolAccess(body.school_id, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const data = await serverDb.updateHoliday(id, access.schoolId, body as Partial<SchoolHoliday>);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    const status = err.message === 'Holiday not found' ? 404 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const access = await requireSchoolAccess(null, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    await serverDb.deleteHoliday(id, access.schoolId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
