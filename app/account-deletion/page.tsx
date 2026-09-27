'use client';

// ============================================================================
// GI Campus - Public Account Deletion & Privacy Policy Overview Page
// ============================================================================

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Trash2, Mail, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicAccountDeletionPage() {
  return (
    <div className="min-h-screen h-[100dvh] overflow-y-auto bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <Link href="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to GI Campus Login</span>
          </Link>
          <div className="flex items-center gap-2 pt-1">
            <img
              src="/icons/icon-192.png"
              alt="GI Campus"
              className="w-8 h-8 rounded-lg object-contain shadow-xs"
            />
            <span className="text-xl font-bold text-slate-900 tracking-tight">GI Campus</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Account &amp; Data Deletion Policy
          </h1>
          <p className="text-xs text-slate-500">
            Information regarding how students, parents, teachers, and staff can request deletion of their account and associated data.
          </p>
        </div>

        {/* Overview Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span>Your Right to Account &amp; Data Deletion</span>
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            In compliance with Google Play Store, Apple App Store, and educational privacy standards, GI Campus provides registered users with a direct mechanism to request account deletion and the purging of non-statutory personal data.
          </p>
        </div>

        {/* Dedicated Portal Banner */}
        <div className="p-6 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Direct Account Deletion Portal</h3>
            <p className="text-xs text-slate-600">
              Submit an email deletion request directly to our administration team (processed within 7 days).
            </p>
          </div>
          <Link href="/delect">
            <Button variant="primary" size="sm" className="whitespace-nowrap">
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              <span>Go to /delect Portal</span>
            </Button>
          </Link>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">How to Initiate Account Deletion</h2>
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <strong className="block text-slate-900">Method 1: Direct Deletion Portal (/delect)</strong>
              <p className="text-slate-600">
                Visit the <Link href="/delect" className="text-indigo-600 font-semibold hover:underline">/delect portal</Link> to send a verified deletion request to our administrator at <a href="mailto:pay.laxmikant@gmail.com" className="text-indigo-600 font-medium hover:underline">pay.laxmikant@gmail.com</a>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <strong className="block text-slate-900">Method 2: Inside the In-App Settings (Signed In)</strong>
              <p className="text-slate-600">
                Log into your account &rarr; navigate to <strong>Settings</strong> &rarr; select <strong>Account Deletion Request</strong> (/account/delete) &rarr; confirm and submit.
              </p>
            </div>
          </div>
        </div>

        {/* Retention Disclosure */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs text-slate-600 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900">What Data is Deleted vs Retained?</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Deleted:</strong> Account authentication credentials, session tokens, profile photos, personal phone numbers, and direct login access.
            </li>
            <li>
              <strong>Retained for Legal / Auditing Compliance:</strong> Official academic transcripts, board examination marks, fee payment receipts, and institutional attendance archives as mandated by educational board bylaws.
            </li>
          </ul>
        </div>

        {/* Footer Navigation */}
        <footer className="pt-4 pb-8 text-center space-y-3 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600">
            <Link href="/terms" className="hover:text-indigo-600 transition-colors">
              Terms and Conditions
            </Link>
            <span>&bull;</span>
            <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
              Privacy Policy
            </Link>
            <span>&bull;</span>
            <Link href="/delect" className="hover:text-indigo-600 transition-colors">
              Account Deletion Portal
            </Link>
          </div>
          <p className="text-[11px] text-slate-400">
            &copy; 2026 GI Campus. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
