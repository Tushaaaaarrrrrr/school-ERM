import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { requireSchoolAccess } from '@/lib/server/access';

export async function GET(request: Request) {
  try {
    const access = await requireSchoolAccess(null, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    const { searchParams } = new URL(request.url);
    let links = await serverDb.getParentLinks(access.schoolId);
    const parentId = searchParams.get('parentId');
    const studentId = searchParams.get('studentId');
    if (parentId) links = links.filter((link: any) => link.parent_id === parentId);
    if (studentId) links = links.filter((link: any) => link.student_id === studentId);
    return NextResponse.json({ success: true, data: links });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireSchoolAccess(null, ['school_admin']);
    if (!access.ok || !access.schoolId) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: access.status || 403 });
    const body = await request.json();
    body.school_id = access.schoolId;
    const created = await serverDb.createParentLink(body);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: error.status || 500 });
  }
}

export async function DELETE(request: Request) {
  new URL(request.url);
  return NextResponse.json({ success: false, error: 'Parent link deletion is not enabled.' }, { status: 405 });
}
