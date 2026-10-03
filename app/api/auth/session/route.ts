import { NextResponse } from 'next/server';
import { signSessionCookie } from '@/lib/server/session-cookie';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const user = body?.user;

    if (user && user.role) {
      const payload = {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        school_id: user.school_id,
        login_id: user.login_id,
        student_id: user.student_id,
        teacher_id: user.teacher_id,
        staff_id: user.staff_id,
        parent_id: user.parent_id,
      };

      const signed = await signSessionCookie(payload);
      const response = NextResponse.json({ success: true, session: signed, user });

      response.cookies.set('school_erp_session', signed, {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
      });

      return response;
    }

    const response = NextResponse.json({ success: true, session: null });
    response.cookies.delete('school_erp_session');
    return response;
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, session: null });
  response.cookies.delete('school_erp_session');
  return response;
}
