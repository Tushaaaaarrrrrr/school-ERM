'use client';

// ============================================================================
// Institutional Role Invitation Acceptance Portal
// Zero SMS OTP - Instant verification via Google OAuth
// ============================================================================

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { Button } from '@/components/ui/button';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Truck,
  Briefcase,
  Users,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  LogOut,
} from 'lucide-react';

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCode = searchParams.get('code') || '';
  const rawRole = searchParams.get('role') || 'teacher';

  const { currentUser, isLoading: authLoading, loginWithGoogle, refreshAccess, logout } = useAuth();

  const [inviteData, setInviteData] = useState<{
    school?: { id: string; name: string; code: string; logo_url?: string; address?: string };
    role?: string;
    roleDisplay?: string;
  } | null>(null);

  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [acceptSuccess, setAcceptSuccess] = useState(false);

  // 1. Verify invitation validity
  useEffect(() => {
    if (!rawCode) {
      setInviteError('Invalid invite link. Missing school invitation code.');
      setLoadingInvite(false);
      return;
    }

    const fetchInvite = async () => {
      setLoadingInvite(true);
      setInviteError('');
      try {
        const res = await fetch(`/api/invite?code=${encodeURIComponent(rawCode)}&role=${encodeURIComponent(rawRole)}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Invitation is invalid or has expired.');
        }
        setInviteData(data);
      } catch (err: any) {
        setInviteError(err?.message || 'Unable to verify invitation link.');
      } finally {
        setLoadingInvite(false);
      }
    };

    fetchInvite();
  }, [rawCode, rawRole]);

  // Handle Accepting Invite
  const handleAcceptInvite = async () => {
    if (!inviteData?.school) return;
    setAccepting(true);
    setInviteError('');

    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          code: inviteData.school.code,
          role: inviteData.role || 'teacher',
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to accept invitation.');
      }

      setAcceptSuccess(true);
      await refreshAccess();

      // Redirect directly to destination
      setTimeout(() => {
        router.replace(result.redirectUrl || '/admin');
      }, 1200);
    } catch (err: any) {
      setInviteError(err?.message || 'Failed to accept invitation. Please try again.');
      setAccepting(false);
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'teacher':
        return <GraduationCap className="w-6 h-6 text-indigo-600" />;
      case 'driver':
        return <Truck className="w-6 h-6 text-amber-600" />;
      case 'staff':
      case 'accountant':
        return <Briefcase className="w-6 h-6 text-teal-600" />;
      case 'parent':
      case 'student':
        return <Users className="w-6 h-6 text-emerald-600" />;
      default:
        return <Building2 className="w-6 h-6 text-indigo-600" />;
    }
  };

  if (loadingInvite || authLoading) {
    return (
      <main className="min-h-screen bg-slate-50 grid place-items-center p-6 text-left">
        <div className="flex flex-col items-center gap-2.5 text-xs text-slate-500">
          <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin" />
          <span>Verifying institutional invitation...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-left">
      <section className="max-w-md w-full bg-white border border-slate-200 shadow-sm rounded-2xl p-7 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5">
          <img
            src="/icons/icon-192.png"
            alt="GI Campus"
            className="w-9 h-9 rounded-xl object-contain shadow-xs"
          />
          <div className="text-left">
            <span className="text-base font-bold text-slate-900 tracking-tight">GI Campus</span>
            <p className="text-[10px] text-slate-400 font-medium">Verified Institutional Onboarding</p>
          </div>
        </div>

        {inviteError ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Invitation Notice</h1>
              <p className="text-xs text-rose-600 mt-1 leading-relaxed">{inviteError}</p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => router.replace('/login')}>
                Go to Sign In
              </Button>
            </div>
          </div>
        ) : acceptSuccess ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs animate-bounce">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Invitation Accepted!</h1>
              <p className="text-xs text-slate-600 mt-1">
                Connecting you to <strong>{inviteData?.school?.name}</strong>...
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
            </div>
          </div>
        ) : (
          <div className="space-y-5 text-left">
            {/* School & Role Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto shadow-2xs">
                {getRoleIcon(inviteData?.role)}
              </div>

              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {inviteData?.roleDisplay || 'Institutional'} Invite
                </span>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                  {inviteData?.school?.name}
                </h1>
                <p className="text-xs text-slate-500 font-mono">
                  School Code: <strong>{inviteData?.school?.code}</strong>
                </p>
              </div>
            </div>

            {/* Explanatory Banner */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Instant Google Identity Verification</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                You will be granted immediate access as <strong>{inviteData?.roleDisplay}</strong>.
                No passwords, school codes, or SMS OTP verification needed.
              </p>
            </div>

            {/* User State & Actions */}
            {currentUser ? (
              <div className="space-y-3">
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs space-y-1">
                  <span className="text-slate-500 block text-[11px]">Currently Signed In:</span>
                  <div className="font-semibold text-slate-900">{currentUser.name || currentUser.email}</div>
                  <div className="text-[11px] font-mono text-indigo-700">{currentUser.email}</div>
                </div>

                <Button
                  variant="primary"
                  className="w-full py-2.5 rounded-xl text-xs font-bold"
                  isLoading={accepting}
                  onClick={handleAcceptInvite}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Accept Invitation & Enter School
                </Button>

                <div className="pt-1 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    leftIcon={<LogOut className="w-3.5 h-3.5 text-slate-400" />}
                  >
                    Use Different Google Account
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full py-2.5 rounded-xl text-xs font-bold"
                  onClick={async () => {
                    // Remember invite url before OAuth redirect
                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem('pending_invite_url', window.location.href);
                    }
                    await loginWithGoogle();
                  }}
                  leftIcon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  }
                >
                  Sign in with Google to Accept
                </Button>
                <p className="text-[11px] text-center text-slate-400">
                  Only your Google account is verified. No SMS OTP needed.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 grid place-items-center p-6">
          <div className="flex flex-col items-center gap-2 text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
            <span>Loading invitation...</span>
          </div>
        </main>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
