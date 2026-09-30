'use client';

// ============================================================================
// GI Campus - 2-Step Verified Progressive Universal Login Portal
// Step 1: Validate Email or Reg Number against School Database -> Step 2: Password
// Integrated with Native Browser WebAuthn Passkey Autofill / Conditional UI
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { authService, passkeyService } from '@/lib/services/api';
import { UserPersona } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import {
  Building,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  GraduationCap,
  IndianRupee,
  CalendarCheck,
  Users,
  UserCheck,
  Bus,
  BarChart3,
  Bell,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Mail,
  HelpCircle,
  Copy,
  Check,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const {
    currentUser,
    isLoading: authLoading,
    loginWithGoogle,
    loginWithPasskey,
    loginWithIdentifier,
  } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  // Multi-step State: 'identifier' -> 'password'
  const [step, setStep] = useState<'identifier' | 'password'>('identifier');

  // Credentials
  const [identifier, setIdentifier] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Verification & State
  const [verifiedUser, setVerifiedUser] = useState<UserPersona | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [notRegisteredNotice, setNotRegisteredNotice] = useState(false);

  // Modals & UI
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (typeof window === 'undefined') return;

    if (currentUser) {
      let targetPath = '/admin';
      switch (currentUser.role) {
        case 'super_admin':
          targetPath = '/super-admin';
          break;
        case 'teacher':
          targetPath = '/teacher';
          break;
        case 'student':
          targetPath = '/student';
          break;
        case 'parent':
          targetPath = '/parent';
          break;
        case 'driver':
          targetPath = '/driver';
          break;
        case 'staff':
        case 'accountant':
          targetPath = '/staff';
          break;
        case 'school_admin':
        default:
          targetPath = '/admin';
          break;
      }
      const searchParams = new URLSearchParams(window.location.search);
      const nextParam = searchParams.get('next');
      const destination = (nextParam && nextParam.startsWith(targetPath)) ? nextParam : targetPath;
      window.location.href = destination;
    }
  }, [currentUser, authLoading]);

  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get('error');
    if (authError === 'oauth_callback_failed') setError('Google Sign-In could not be completed. Please try again.');
    if (authError === 'access_context_failed') setError('Google verified your account, but we could not load your platform access. Please contact support if this continues.');
    if (authError === 'auth_not_configured') setError('Google Sign-In is not configured for this deployment.');
    if (authError === 'gmail_required') setError('Only Google accounts ending with @gmail.com are permitted for platform access.');
  }, []);

  // Native WebAuthn Conditional Mediation (Autofill Passkeys from Browser / Touch ID)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isCancelled = false;

    const startConditionalPasskey = async () => {
      try {
        if (
          window.PublicKeyCredential &&
          typeof PublicKeyCredential.isConditionalMediationAvailable === 'function' &&
          (await PublicKeyCredential.isConditionalMediationAvailable())
        ) {
          const res = await passkeyService.authenticateWithPasskey({
            mediation: 'conditional',
          });
          if (!isCancelled && res.success && res.redirectUrl) {
            toastSuccess('Passkey verified successfully!');
            window.location.href = res.redirectUrl;
          }
        }
      } catch {
        // Silently ignore aborted/unselected conditional passkey requests
      }
    };

    startConditionalPasskey();
    return () => {
      isCancelled = true;
    };
  }, [toastSuccess, router]);

  // Step 1: Check if user exists in the school database before proceeding to password
  const handleProceedToPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotRegisteredNotice(false);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please enter your email or registration number.');
      return;
    }

    setIsVerifying(true);
    try {
      const check = await authService.verifyIdentifierExists(cleanId, schoolCode);
      if (check.exists && check.user) {
        setVerifiedUser(check.user);
        setError(null);
        setNotRegisteredNotice(false);
        setStep('password');
      } else {
        const errorMsg = check.schoolNotFound
          ? (check.error || 'School code is wrong or does not exist.')
          : (check.error || 'This email or registration number is not found in the school database.');
        setError(errorMsg);
        toastError(errorMsg);
        if (!check.schoolNotFound && !(check as any).isDeactivated && !check.error?.includes('deactivated') && !check.error?.includes('disabled')) {
          setNotRegisteredNotice(true);
        }
      }
    } catch {
      const errorMsg = 'Unable to verify account. Please try again.';
      setError(errorMsg);
      toastError(errorMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 2: Submit Credentials with Password (Password IS Case-Sensitive)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError('Please enter your password.');
      toastError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      // Email/Reg ID is case-insensitive, Password is case-sensitive
      const res = await loginWithIdentifier(identifier, password, schoolCode);
      if (res.success && res.redirectUrl) {
        toastSuccess('Signed in successfully!');
        const searchParams = new URLSearchParams(window.location.search);
        const nextParam = searchParams.get('next');
        const destination = (nextParam && nextParam.startsWith(res.redirectUrl)) ? nextParam : res.redirectUrl;
        window.location.href = destination;
        return;
      } else {
        const errorMsg = res.error || 'Invalid password. Note that passwords are case-sensitive.';
        setError(errorMsg);
        toastError(errorMsg);
      }
    } catch {
      const errorMsg = 'An unexpected error occurred during sign-in.';
      setError(errorMsg);
      toastError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Direct Google OAuth Sign-In (Available in Step 1)
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await loginWithGoogle();
      if (res.success && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else if (!res.success) {
        setError(res.error || 'Google Sign-In failed. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred during Google Sign-In.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAdminEmail = async () => {
    try {
      await navigator.clipboard.writeText('pay.laxmikant@gmail.com');
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
      toastSuccess('School administrator email copied to clipboard!');
    } catch {
      toastError('Could not copy email');
    }
  };

  // Feature cards replicating showcase structure
  const featureList = [
    { label: 'Student Management', icon: GraduationCap },
    { label: 'Fee & Billing Management', icon: IndianRupee },
    { label: 'Classes & Attendance', icon: CalendarCheck },
    { label: 'Parent Dashboard', icon: Users },
    { label: 'Teacher Management', icon: UserCheck },
    { label: 'Transport Management', icon: Bus },
    { label: 'Reports & Analytics', icon: BarChart3 },
    { label: 'Notices & Communication', icon: Bell },
  ];

  return (
    <div className="min-h-screen h-[100dvh] w-full flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-slate-50 text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* ==================================================================== */}
      {/* LEFT SIDE: Hero Showcase Built with Photo 1 Background + Photo 2 UI */}
      {/* ==================================================================== */}
      <div className="relative hidden lg:flex lg:w-[58%] xl:w-[60%] h-full bg-slate-50 overflow-hidden flex-col justify-between p-8 xl:p-12 border-r border-slate-200 select-none">
        {/* Background Artwork Layer with Subtle Soft Blur */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img
            src="/images/login-illustration.jpg"
            alt="School Campus Illustration"
            className="w-full h-full object-cover object-right scale-105 blur-[3px] brightness-[1.01]"
          />
          {/* Smooth horizontal gradient to guarantee 100% crisp typography on left */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent w-[58%]" />
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 flex flex-col h-full justify-between max-w-xl">
          {/* 1. Top Brand Header */}
          <div className="flex items-center gap-3.5">
            <img
              src="/icons/icon-512.png"
              alt="GI Campus Logo"
              className="w-14 h-14 rounded-2xl object-contain shadow-md shrink-0"
              style={{ width: 54, height: 54 }}
            />
            <div className="flex flex-col">
              <span className="text-2xl xl:text-3xl font-black text-slate-900 tracking-tight leading-none">
                GI <span className="text-indigo-600">Campus</span>
              </span>
              <span className="text-xs xl:text-sm font-semibold text-slate-500 mt-1">
                All in One <strong className="text-indigo-600">Education Management</strong>
              </span>
            </div>
          </div>

          {/* 2. Headline & Copy */}
          <div className="my-auto space-y-4 py-4">
            <div className="space-y-2">
              <h2 className="text-4xl xl:text-5xl font-black text-slate-900 tracking-tight leading-[1.12]">
                Ek Platform.<br />
                Har Zaroorat.<br />
                <span className="text-indigo-600 drop-shadow-xs">Pura Prabandh.</span>
              </h2>
              <p className="text-sm xl:text-base text-slate-600 leading-relaxed font-medium max-w-md pt-1">
                Students, Teachers, Parents, Classes, Fees, Transport aur har kaam &ndash; ab ek jagah.
              </p>
            </div>

            {/* 3. 8 Feature Cards (2 Rows x 4 Columns) */}
            <div className="grid grid-cols-4 gap-2.5 xl:gap-3.5 pt-3 max-w-lg xl:max-w-xl">
              {featureList.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={index}
                    className="p-3 xl:p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center text-center group cursor-default"
                  >
                    <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform mb-1.5 shrink-0">
                      <IconComponent className="w-4.5 h-4.5 xl:w-5 xl:h-5" />
                    </div>
                    <span className="text-[11px] xl:text-xs font-bold text-slate-700 leading-tight">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Bottom Trust Badge */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-3.5 px-4.5 py-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs xl:text-sm font-bold text-slate-900 leading-none">
                  Aapka School. Aapka Data.
                </p>
                <p className="text-[11px] xl:text-xs font-semibold text-indigo-600 mt-1">
                  Secure &bull; Reliable &bull; Smart
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* RIGHT SIDE: Progressive 2-Step Authentication Materials             */}
      {/* ==================================================================== */}
      <div className="w-full lg:w-[42%] xl:w-[40%] flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12 overflow-y-auto h-full">
        {/* Mobile Header (Shown on small screens only) */}
        <div className="lg:hidden text-center mb-6 space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 justify-center">
            <img
              src="/icons/icon-512.png"
              alt="GI Campus Logo"
              className="w-10 h-10 rounded-xl object-contain shadow-md shrink-0"
              style={{ width: 40, height: 40 }}
            />
            <span className="text-xl font-black text-slate-900 tracking-tight">
              GI <span className="text-indigo-600">Campus</span>
            </span>
          </Link>
          <p className="text-xs text-slate-500 font-medium">
            All in One Education Management
          </p>
        </div>

        {/* Center Auth Card Container */}
        <div className="my-auto w-full max-w-md mx-auto space-y-4">
          {/* Header */}
          <div className="text-center sm:text-left space-y-1">
            <p className="text-xs font-bold text-indigo-600 tracking-wide uppercase flex items-center gap-1.5 justify-center sm:justify-start">
              <span>Welcome back !</span>
            </p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {step === 'identifier' ? 'Sign In to Your Account' : 'Enter Password'}
            </h1>
          </div>

          <div className="bg-white py-6 px-6 sm:px-8 shadow-xs border border-slate-200 rounded-2xl space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* ============================================================== */}
            {/* Google OAuth Fast Sign-In Button                                */}
            {/* ============================================================== */}
            {step === 'identifier' && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-2xs disabled:opacity-60 cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Clean Divider */}
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">
                      OR SIGN IN WITH CREDENTIALS
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* STEP 1: Enter Email or Registration Number                     */}
            {/* Supports WebAuthn Conditional UI / Native Passkey Autofill     */}
            {/* ============================================================== */}
            {step === 'identifier' ? (
              <form onSubmit={handleProceedToPassword} className="space-y-4 text-left">
                <div>
                  <label htmlFor="username" className="block text-xs font-semibold text-slate-700 mb-1">
                    Email or Registration Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      autoFocus
                      autoComplete="username webauthn"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (error) setError(null);
                        if (notRegisteredNotice) setNotRegisteredNotice(false);
                      }}
                      placeholder="e.g. admin@school.com or JDPS-103"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Not case-sensitive (e.g., jdps-103 or JDPS-103)
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      School Code <span className="text-slate-400 font-normal">(Optional for Email)</span>
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={schoolCode}
                      onChange={(e) => {
                        setSchoolCode(e.target.value.toUpperCase());
                        if (error) setError(null);
                      }}
                      placeholder="e.g. JDPS0123Q"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Helpful Onboarding Card when user is not found in database */}
                {notRegisteredNotice && (
                  <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-left space-y-2.5 animate-fadeIn">
                    <div className="flex items-start gap-2.5">
                      <UserPlus className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-bold text-amber-950">New to GI Campus?</p>
                        <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                          Your account was not found in the database. Please <strong>continue with Google</strong> to create your account.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="w-full py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Sign In with Google to Join</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-[10px] text-slate-500 text-center leading-normal">
                      After logging in with Google, enter your School Code and wait for your school admin to accept your access request.
                    </p>
                  </div>
                )}

                {/* Fixed Single-Line Next Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isVerifying || !identifier.trim()}
                    className="w-full h-11 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isVerifying ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying Account...</span>
                      </span>
                    ) : (
                      <>
                        <span>Next</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* ============================================================== */
              /* STEP 2: Enter Password with Show/Hide Toggle & Forgot Password  */
              /* ============================================================== */
              <form onSubmit={handleSignIn} className="space-y-4 text-left">
                {/* Verified Identifier Review Badge */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
                      {verifiedUser?.role === 'student' ? '🎒' : verifiedUser?.role === 'teacher' ? '👨‍🏫' : verifiedUser?.role === 'parent' ? '👨‍👩‍👧' : '🏢'}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-900 truncate">
                        {verifiedUser?.name || identifier}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate font-mono">
                        {identifier} {schoolCode ? `• ${schoolCode}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('identifier');
                      setPassword('');
                      setError(null);
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-bold text-xs ml-2 shrink-0 cursor-pointer px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="text-xs font-semibold text-slate-700">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      autoComplete="current-password webauthn"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="••••••••••••"
                      className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 ${
                        error
                          ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                          : 'border-slate-300 focus:ring-indigo-500'
                      }`}
                    />
                    <Lock className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${error ? 'text-rose-400' : 'text-slate-400'}`} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {error && (
                    <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{error}</span>
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    Password is case-sensitive
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('identifier');
                      setPassword('');
                      setError(null);
                    }}
                    className="h-11 py-2.5 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                    title="Back to email/registration entry"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !password}
                    className="flex-1 h-11 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing In...</span>
                      </span>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Agreement Notice */}
            <div className="pt-2 text-center">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                By continuing, you agree to GI Campus&apos;s{' '}
                <Link href="/terms" className="text-indigo-600 font-semibold hover:underline">
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-indigo-600 font-semibold hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Footer Links */}
        <footer className="mt-8 text-center text-xs text-slate-500 space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Link href="/terms" className="hover:text-indigo-600 transition-colors">
              Terms &amp; Conditions
            </Link>
            <span>&bull;</span>
            <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
              Privacy Policy
            </Link>
            <span>&bull;</span>
            <Link href="/delete" className="hover:text-indigo-600 transition-colors">
              Account Deletion
            </Link>
          </div>
          <p className="text-[11px] text-slate-400">
            &copy; 2026 GI Campus. All rights reserved.
          </p>
        </footer>
      </div>

      {/* ==================================================================== */}
      {/* FORGOT PASSWORD MODAL: Contact School Administration                */}
      {/* ==================================================================== */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Forgot Password?"
        description="Password resets are managed securely by your school administration"
      >
        <div className="space-y-4 text-left">
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm text-indigo-950">
                Contact Your School Administration
              </p>
              <p className="text-indigo-800/90 mt-1 leading-relaxed">
                For student and staff security, password resets are processed directly by the school administrative office. Please reach out to your school administrator or IT department.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="text-xs">
              <span className="text-slate-500 block font-medium">Administrator Support Email</span>
              <span className="font-mono font-bold text-slate-900 text-sm">pay.laxmikant@gmail.com</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyAdminEmail}
                leftIcon={copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-indigo-600" />}
                className="text-xs"
              >
                {copiedEmail ? 'Copied to Clipboard' : 'Copy Admin Email'}
              </Button>

              <a
                href="mailto:pay.laxmikant@gmail.com?subject=GI%20Campus%20-%20Password%20Reset%20Request"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-2xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Email</span>
              </a>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsForgotModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
