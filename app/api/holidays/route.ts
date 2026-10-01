import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isoDate, parseJsonBody } from '@/lib/server/validation';
import type { SchoolHoliday } from '@/lib/types';

const holidayInput = z
  .object({
    school_id: z.string().optional(),
    academic_year_id: z.string().optional(),
    name: z.string().trim().min(1, 'Holiday name is required').max(120),
    start_date: isoDate,
    end_date: isoDate.optional(),
    reason: z.string().max(500).nullish(),
    description: z.string().max(500).nullish(),
  })
  .refine((h) => !h.end_date || h.end_date >= h.start_date, { message: 'end_date cannot be before start_date', path: ['end_date'] });
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = Object.fromEntries(url.searchParams.entries());
    const access = await requireSchoolAccess(null, ['school_admin', 'teacher', 'staff', 'driver', 'parent', 'student']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    
    const data = await serverDb.getHolidays(access.schoolId);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, holidayInput);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const access = await requireSchoolAccess(body.school_id, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const data = await serverDb.createHoliday({ ...body, end_date: body.end_date || body.start_date, school_id: access.schoolId } as SchoolHoliday);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
