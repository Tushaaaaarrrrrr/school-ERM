'use client';

// ============================================================================
// GI Campus - Dedicated Account Deletion Portal (/delect & /delete)
// ============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Trash2,
  ArrowLeft,
  Mail,
  Copy,
  Check,
  Clock,
  ShieldAlert,
  HelpCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AccountDeletionPortalPage() {
  const [copied, setCopied] = useState(false);
  const adminEmail = 'pay.laxmikant@gmail.com';

  const handleCopyEmail = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(adminEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const mailtoLink = `mailto:${adminEmail}?subject=GI%20School%20ERM%20-%20Account%20Deletion%20Request&body=Hello%20GI%20School%20ERM%20Support%20Team%2C%0A%0AI%20would%20like%20to%20request%20the%20permanent%20deletion%20of%20my%20GI%20School%20ERM%20account%20and%20associated%20data.%0A%0AAccount%20Details%3A%0A-%20Registered%20Mobile%20Number%3A%20%0A-%20Registered%20Email%20Address%3A%20%0A-%20User%20Short%20ID%20%2F%20Registration%20Number%20(if%20known)%3A%20%0A-%20Role%20(Student%20%2F%20Teacher%20%2F%20Parent%20%2F%20Staff%20%2F%20Admin)%3A%20%0A-%20School%20Code%20(if%20applicable)%3A%20%0A-%20Reason%20for%20Deletion%20(Optional)%3A%20%0A%0APlease%20confirm%20once%20the%20account%20deletion%20has%20been%20processed%20within%207%20days.%0A%0AThank%20you.`;

  return (
    <div className="min-h-screen h-[100dvh] overflow-y-auto bg-slate-50 text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
          <div className="flex items-center gap-2">
            <img
              src="/icons/icon-192.png"
              alt="GI Campus"
              className="w-7 h-7 rounded-lg object-contain shadow-2xs"
            />
            <span className="text-sm font-bold text-slate-900 tracking-tight">GI Campus</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6 text-left">
        {/* Portal Hero Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold">
            <Trash2 className="w-3.5 h-3.5" />
            <span>GI Campus &bull; Data &amp; Account Removal Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Account Deletion Request
          </h1>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>Sorry to hear you want to delete your account</span>
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Let us assure you that everything is okay and your personal data &amp; transactions are always treated with utmost privacy and security. If you are experiencing any issue, school difficulty, or billing question, our team is always ready to assist you.
            </p>
          </div>
        </div>

        {/* Email Submission Box */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            <span>If you still want to delete your account</span>
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed">
            Please send an account deletion request directly to our administrator email:
          </p>

          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                Administrator Email
              </span>
              <p className="text-sm font-mono font-bold text-slate-900">{adminEmail}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyEmail}
                className="text-xs font-semibold"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                    <span>Copied Email</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
                    <span>Copy Email</span>
                  </>
                )}
              </Button>

              <a
                href={mailtoLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Deletion Email</span>
              </a>
            </div>
          </div>

          {/* Processing Timeline & What to Include */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Processing Timeline</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                We take up to <strong>7 days</strong> to verify and permanently delete your account from our records.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Info className="w-4 h-4 text-indigo-600" />
                <span>What to Include in Email</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Include your <strong>Registered Phone Number</strong>, <strong>Email Address</strong>, or <strong>User/Student ID</strong> so we can locate your account.
              </p>
            </div>
          </div>
        </div>

        {/* What happens upon deletion? */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">What happens upon deletion?</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Important details regarding account termination &amp; data erasure
              </p>
            </div>
          </div>

          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600 leading-relaxed pt-1">
            <li>
              All personal profile information (name, phone number, address, and password) will be permanently erased.
            </li>
            <li>
              Active sessions and device push notification tokens will be invalidated immediately.
            </li>
            <li>
              If you are a school/institution user, teacher, student, parent, or staff, your profile credentials, portal access, and institutional connections will be permanently removed.
            </li>
            <li>
              Please settle all pending institutional fee dues or credit balances with respective schools prior to requesting deletion.
            </li>
          </ul>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-900 text-center">
            Thanks for being a part of GI Campus!
          </div>
        </div>

        {/* Footer Navigation */}
        <footer className="pt-4 pb-12 text-center space-y-4 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600">
            <Link href="/terms" className="hover:text-indigo-600 transition-colors">
              Terms and Conditions
            </Link>
            <span>&bull;</span>
            <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
              Privacy Policy
            </Link>
            <span>&bull;</span>
            <Link href="/login" className="hover:text-indigo-600 transition-colors">
              Sign In to GI Campus
            </Link>
          </div>
          <p className="text-[11px] text-slate-400">
            &copy; 2026 GI Campus. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
