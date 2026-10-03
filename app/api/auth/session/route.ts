import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const user = body?.user;
    const response = NextResponse.json({ success: true });

    if (user && user.role) {
      const data = encodeURIComponent(
        JSON.stringify({
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
        })
      );

      response.cookies.set('school_erp_session', data, {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
      });
    } else {
      response.cookies.delete('school_erp_session');
    }

    return response;
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('school_erp_session');
  return response;
}
