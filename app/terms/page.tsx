'use client';

// ============================================================================
// GI Campus - Terms and Conditions Page
// ============================================================================

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  ExternalLink,
  ChevronRight,
  Mail,
  Building,
} from 'lucide-react';

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen h-[100dvh] overflow-y-auto bg-slate-50 text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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

      {/* Main Document Body */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Document Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service Agreement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            TERMS AND CONDITIONS
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Last updated: <span className="font-semibold text-slate-700">September 01, 2026</span>
          </p>

          {/* Important Disclaimer Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>IMPORTANT: PLATFORM NATURE &amp; DATA RESPONSIBILITY DISCLAIMER</span>
            </div>
            <p className="leading-relaxed text-amber-900/90 text-xs">
              We are a software platform only. We provide you with digital tools to record and store your institutional academic, fee, attendance, and administrative records, but you are solely responsible for your data. In the event of any data loss, service interruption, or device failure, <strong>GI Campus</strong> and its operators are not responsible or liable for any lost data, records, or financial impacts.
            </p>
          </div>
        </div>

        {/* Detailed Terms Sections */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section id="section-1" className="space-y-3 pt-2">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              1. AGREEMENT TO TERMS
            </h3>
            <p>
              These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity (&ldquo;you&rdquo;) and <strong>GI Campus</strong> (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), concerning your access to and use of the{' '}
              <a href="https://school-erm.onrender.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">
                https://school-erm.onrender.com
              </a>{' '}
              website as well as the <strong>GI Campus</strong> mobile and web application (collectively, the &ldquo;Platform&rdquo; or &ldquo;Services&rdquo;).
            </p>
            <p>
              By accessing or using the Services, you agree that you have read, understood, and agree to be bound by all of these Terms and Conditions. If you do not agree with all of these terms, you are expressly prohibited from using the Services and must discontinue use immediately.
            </p>
          </section>

          {/* Section 2 */}
          <section id="section-2" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              2. NATURE OF SERVICES (PLATFORM ONLY)
            </h3>
            <p>
              <strong>GI Campus</strong> is a technological software utility designed to help schools, educational institutions, teachers, students, parents, and administrative staff manage school operations, attendance, academic records, fee invoicing, and communication.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600">
              <li>
                <strong>No Financial Intermediary:</strong> <strong>GI Campus</strong> is strictly a management and record-keeping calculator tool. We do not act as a bank, payment wallet, escrow service, or financial institution.
              </li>
              <li>
                <strong>Offline / Direct Settlements:</strong> All physical exchanges of cash, UPI transfers, fee agreements, and payment settlements take place directly between schools and parents/students. <strong>GI Campus</strong> is not involved in resolving private debt or fee disputes.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="section-3" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              3. USER DATA RESPONSIBILITY &amp; NO LIABILITY FOR DATA LOSS
            </h3>
            <p>
              You are solely responsible for all data, student records, fee transactions, and staff details that you enter into the Platform.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <p>
                <strong>No Liability for Data Losses:</strong> Although we implement standard cloud synchronization and database safeguards, <strong>GI Campus IS NOT RESPONSIBLE FOR ANY DATA LOSSES WHATSOEVER</strong>. This includes data loss caused by server crashes, network outages, unintended overwrites, cyber incidents, device damage, browser cache clearance, or third-party cloud failures.
              </p>
              <p>
                <strong>Independent Record Keeping:</strong> School administrators and users are strongly advised to keep periodic physical or exported backups for critical documentation.
              </p>
              <p>
                <strong>No Consequential Damages:</strong> In no event shall <strong>GI Campus</strong>, its founders, developers, or affiliates be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, or loss of data arising from your use of the service.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section id="section-4" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              4. USER REGISTRATION &amp; SECURITY PIN
            </h3>
            <p>
              To access the Platform features, you may be required to register with an email, phone number, password, and a Security PIN. You agree to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>Provide accurate, current, and complete registration information.</li>
              <li>Maintain the confidentiality of your password and Security PIN.</li>
              <li>Accept full responsibility for all activities and transactions recorded under your account.</li>
              <li>Notify us immediately if you suspect any unauthorized access to your account.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="section-5" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              5. ACCEPTABLE USE POLICY
            </h3>
            <p>
              You agree not to access or use the Platform for any purpose other than that for which we make it available. Prohibited activities include:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>Entering fake, fraudulent, abusive, or unlawful transaction or academic records.</li>
              <li>Attempting to bypass security mechanisms, reverse-engineer, or tamper with the application source code.</li>
              <li>Using automated scripts, bots, or scrapers to extract platform data or catalog information.</li>
              <li>Using the Platform to harass, defraud, or impersonate another institution, student, or individual.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="section-6" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              6. ACCOUNT DELETION &amp; TERMINATION
            </h3>
            <p>
              You may terminate your account at any time. To submit an account and personal data deletion request, you can visit our dedicated account deletion portal at{' '}
              <Link href="/delete" className="text-indigo-600 font-semibold hover:underline">
                https://school-erm.onrender.com/delete
              </Link>{' '}
              or email us directly at{' '}
              <a href="mailto:pay.laxmikant@gmail.com" className="text-indigo-600 font-semibold hover:underline">
                pay.laxmikant@gmail.com
              </a>
              . Account deletions are processed within up to 7 days.
            </p>
            <p>
              We reserve the right to suspend, terminate, or restrict access to any account without notice if we believe you have violated these Terms or engaged in unauthorized activity.
            </p>
          </section>

          {/* Section 7 */}
          <section id="section-7" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              7. DISCLAIMER OF WARRANTIES
            </h3>
            <p className="text-xs uppercase text-slate-600 font-mono leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              THE PLATFORM AND SERVICES ARE PROVIDED ON AN &ldquo;AS-IS&rdquo; AND &ldquo;AS-AVAILABLE&rdquo; BASIS. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE PLATFORM&apos;S CONTENT OR DATA CALCULATIONS.
            </p>
          </section>

          {/* Section 8 */}
          <section id="section-8" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              8. MODIFICATIONS TO TERMS
            </h3>
            <p>
              We reserve the right to modify, amend, or update these Terms and Conditions at any time. Changes become effective immediately upon posting to this page. Continued use of the Services following any updates constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Section 9 */}
          <section id="section-9" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              9. CONTACT INFORMATION
            </h3>
            <p>If you have questions or comments regarding these Terms and Conditions, please contact us at:</p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-700">
              <p className="font-bold text-slate-900">GI Campus</p>
              <p>PATNA, BIHAR 800001, India</p>
              <p className="pt-1">
                Email:{' '}
                <a href="mailto:pay.laxmikant@gmail.com" className="text-indigo-600 font-medium hover:underline">
                  pay.laxmikant@gmail.com
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <footer className="pt-4 pb-12 text-center space-y-4 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600">
            <Link href="/terms" className="text-indigo-600 font-bold">
              Terms and Conditions
            </Link>
            <span>&bull;</span>
            <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
              Privacy Policy
            </Link>
            <span>&bull;</span>
            <Link href="/delete" className="hover:text-indigo-600 transition-colors">
              Account Deletion Portal
            </Link>
            <span>&bull;</span>
            <Link href="/login" className="hover:text-indigo-600 transition-colors">
              Sign In
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
