'use client';

// ============================================================================
// GI Campus - Join School & Request Access Portal
// ============================================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Clock, LogOut, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { validateSchoolCodeFormat } from '@/lib/utils/school-code';

export default function JoinSchoolPage() {
  const router = useRouter();
  const { currentUser, accessState, pendingAccessRequest, isLoading, refreshAccess, logout } = useAuth();
  const [schoolCode, setSchoolCode] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccessSubmitted, setIsSuccessSubmitted] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!currentUser) router.replace('/login');
    else if (accessState === 'SUPER_ADMIN') router.replace('/super-admin');
    else if (accessState === 'ACTIVE_SCHOOL_USER') {
      const role = currentUser.role;
      router.replace(
        role === 'school_admin'
          ? '/admin'
          : role === 'teacher'
          ? '/teacher'
          : role === 'driver'
          ? '/driver'
          : role === 'parent'
          ? '/parent'
          : role === 'student'
          ? '/student'
          : '/staff'
      );
    } else if (accessState === 'DISABLED' || accessState === 'REVOKED' || accessState === 'ERROR') {
      router.replace('/access-unavailable');
    }
  }, [accessState, currentUser, isLoading, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const cleanCode = schoolCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a valid school code.');
      setSubmitting(false);
      return;
    }

    const formatValidation = validateSchoolCodeFormat(cleanCode);
    if (!formatValidation.isValid) {
      setError(formatValidation.error || 'Please enter a valid school code format.');
      setSubmitting(false);
      return;
    }

    try {
      // Submit access request directly to server
      const response = await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ schoolCode: cleanCode, phone, name: currentUser?.name }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Unable to submit access request.');
      }

      setIsSuccessSubmitted(true);
      await refreshAccess();
    } catch (err: any) {
      setError(err?.message || 'Unable to submit request.');
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen grid place-items-center text-xs text-slate-600 bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Checking your GI Campus access...</span>
        </div>
      </main>
    );
  }

  const school = pendingAccessRequest?.schools;

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-left">
      <section className="max-w-md w-full bg-white border border-slate-200 shadow-xs rounded-2xl p-7 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5">
          <img
            src="/icons/icon-192.png"
            alt="GI Campus"
            className="w-9 h-9 rounded-xl object-contain shadow-xs"
          />
          <div className="text-left">
            <span className="text-base font-bold text-slate-900 tracking-tight">GI Campus</span>
            <p className="text-[10px] text-slate-400 font-medium">All in One Education Management</p>
          </div>
        </div>

        {accessState === 'PENDING_ACCESS_REQUEST' || isSuccessSubmitted ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
              <Clock className="w-6 h-6" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Access Request Pending</h1>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Your request has been submitted. Please wait until your school administrator reviews and accepts your profile.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-left space-y-2">
              <p>
                <span className="text-slate-500">Account:</span>{' '}
                <strong className="text-slate-900">{currentUser?.email}</strong>
              </p>
              <p>
                <span className="text-slate-500">School:</span>{' '}
                <strong className="text-slate-900">{school?.name || schoolCode || 'Requested School'}</strong>
              </p>
              <p>
                <span className="text-slate-500">Status:</span>{' '}
                <strong className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block font-mono text-[11px]">
                  Pending Admin Approval
                </strong>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <Button onClick={refreshAccess} variant="primary" size="sm" className="w-full sm:w-auto">
                Refresh Status
              </Button>
              <Button variant="outline" size="sm" onClick={logout} className="w-full sm:w-auto" leftIcon={<LogOut className="w-3.5 h-3.5" />}>
                Logout
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs mb-2">
                <Building2 className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Join Your School</h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                You are signed in as <strong className="text-slate-900">{currentUser?.email}</strong>. Enter your School Code below to request institutional access.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={submit} className="space-y-3.5 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  School Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={schoolCode}
                  onChange={(e) => {
                    setSchoolCode(e.target.value.toUpperCase());
                    if (error) setError('');
                  }}
                  placeholder="e.g. JDPS0123Q"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Obtain this code from your school office or teacher.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-2.5 rounded-xl text-xs font-bold"
                  isLoading={submitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Submit Access Request
                </Button>
              </div>
            </form>

            <div className="pt-2 flex justify-center">
              <Button variant="ghost" size="sm" onClick={logout} leftIcon={<LogOut className="w-3.5 h-3.5 text-slate-400" />}>
                Sign out
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
