'use client';

// ============================================================================
// GI Campus - Privacy Policy Page
// ============================================================================

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  ArrowLeft,
  FileText,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
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
            <Shield className="w-3.5 h-3.5" />
            <span>Official Privacy Notice</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            PRIVACY POLICY
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Last updated: <span className="font-semibold text-slate-700">September 01, 2026</span>
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
            This Privacy Notice for <strong>GI Campus</strong> (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), describes how and why we might access, collect, store, use, and/or share (&ldquo;process&rdquo;) your personal information when you use our services (&ldquo;Services&rdquo;), including when you:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600">
            <li>
              Visit our website at{' '}
              <a href="https://school-erm.onrender.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">
                https://school-erm.onrender.com/
              </a>{' '}
              or any website of ours that links to this Privacy Notice
            </li>
            <li>
              Download and use our web or mobile application (<strong>GI Campus</strong>: School Management &amp; Student ERP), or any other application of ours that links to this Privacy Notice
            </li>
            <li>
              Use fast school management, student &amp; faculty administration, digital attendance, examination results, class timetable, and institutional fee records designed for schools, colleges, and educational institutes.
            </li>
          </ul>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3 text-xs">
            <h3 className="font-bold text-slate-900">Key Features for Institutions &amp; Educators</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Academic &amp; Student Operations:</strong> Complete student profiles, class rosters, subjects, classroom allocations, attendance roll call, and examination marks management.</li>
              <li><strong>Staff &amp; Faculty Management:</strong> Teacher rosters, subject assignments, payroll statements, leave tracking, and institutional broadcast notices.</li>
              <li><strong>Fee Invoicing &amp; Receipts:</strong> Itemized fee structures, dues tracking, receipt generation, online/cash collections, and financial records.</li>
              <li><strong>Printable Digital Records:</strong> Academic report cards, fee invoices with school logo, timestamps, and authorized breakdown.</li>
            </ul>

            <h3 className="font-bold text-slate-900 pt-1">Features for Students &amp; Parents</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Academic Progress &amp; Results:</strong> Instant access to exam marks, report cards, and class timetable.</li>
              <li><strong>Fee Transparency:</strong> Real-time overview of paid invoices, outstanding fee balances, and payment receipts.</li>
              <li><strong>Attendance Tracking:</strong> Transparent view of daily attendance logs and institutional notices.</li>
            </ul>

            <h3 className="font-bold text-slate-900 pt-1">Security &amp; Data Privacy</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Secure cloud synchronization with encrypted data transmission.</li>
              <li>5-digit PIN lock protection and role-based access control to safeguard institutional records and privacy.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-slate-700 leading-relaxed">
            <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at{' '}
            <a href="mailto:pay.laxmikant@gmail.com" className="text-indigo-600 font-semibold hover:underline">
              pay.laxmikant@gmail.com
            </a>.
          </div>
        </div>

        {/* SUMMARY OF KEY POINTS */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>SUMMARY OF KEY POINTS</span>
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by clicking the link following each key point or by using our table of contents below to find the section you are looking for.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <strong className="block text-slate-900 font-semibold">What personal information do we process?</strong>
              <p className="text-slate-600">When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the features you use.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <strong className="block text-slate-900 font-semibold">Do we process sensitive information?</strong>
              <p className="text-slate-600">Some information may be considered &ldquo;special&rdquo; or &ldquo;sensitive&rdquo; in certain jurisdictions. We do not process sensitive personal information.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <strong className="block text-slate-900 font-semibold">Do we collect information from third parties?</strong>
              <p className="text-slate-600">We do not collect any information from third parties.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <strong className="block text-slate-900 font-semibold">How do we process your information?</strong>
              <p className="text-slate-600">We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <strong className="block text-slate-900 font-semibold">When and with whom do we share information?</strong>
              <p className="text-slate-600">We may share information in specific situations and with authorized service infrastructure partners.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <strong className="block text-slate-900 font-semibold">How do you exercise your rights?</strong>
              <p className="text-slate-600">
                The easiest way to exercise your rights is by visiting{' '}
                <Link href="/delete" className="text-indigo-600 font-medium hover:underline">
                  our Account Deletion Portal (/delete)
                </Link>
                , or by contacting us at{' '}
                <a href="mailto:pay.laxmikant@gmail.com" className="text-indigo-600 font-medium hover:underline">
                  pay.laxmikant@gmail.com
                </a>.
              </p>
            </div>
          </div>
        </div>

        {/* TABLE OF CONTENTS */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900">TABLE OF CONTENTS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {[
              { id: 'section-1', title: '1. WHAT INFORMATION DO WE COLLECT?' },
              { id: 'section-2', title: '2. HOW DO WE PROCESS YOUR INFORMATION?' },
              { id: 'section-3', title: '3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?' },
              { id: 'section-4', title: '4. HOW DO WE HANDLE YOUR SOCIAL LOGINS?' },
              { id: 'section-5', title: '5. HOW LONG DO WE KEEP YOUR INFORMATION?' },
              { id: 'section-6', title: '6. HOW DO WE KEEP YOUR INFORMATION SAFE?' },
              { id: 'section-7', title: '7. DO WE COLLECT INFORMATION FROM MINORS?' },
              { id: 'section-8', title: '8. WHAT ARE YOUR PRIVACY RIGHTS?' },
              { id: 'section-9', title: '9. CONTROLS FOR DO-NOT-TRACK FEATURES' },
              { id: 'section-10', title: '10. WE ARE NOT RESPONSIBLE FOR ANY DATA LOSSES' },
              { id: 'section-11', title: '11. DO WE MAKE UPDATES TO THIS NOTICE?' },
              { id: 'section-12', title: '12. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?' },
              { id: 'section-13', title: '13. HOW CAN YOU REVIEW, UPDATE, OR DELETE DATA?' },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-indigo-50/50 hover:border-indigo-100 hover:text-indigo-600 transition-colors"
              >
                <span className="font-medium text-slate-700 truncate">{item.title}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
              </a>
            ))}
          </div>
        </div>

        {/* DETAILED SECTIONS */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section id="section-1" className="space-y-3 pt-2">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              1. WHAT INFORMATION DO WE COLLECT?
            </h3>
            <p className="font-semibold text-slate-800">Personal information you disclose to us</p>
            <p className="italic text-slate-500 text-xs">In Short: We collect personal information that you provide to us.</p>
            <p>
              We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
            </p>
            <p>
              <strong>Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 grid grid-cols-2 gap-1 sm:grid-cols-3">
              <li>Full names</li>
              <li>Phone numbers</li>
              <li>Mailing addresses</li>
              <li>Email addresses</li>
              <li>Usernames / Student IDs</li>
              <li>Passwords &amp; Security PINs</li>
              <li>Authentication data</li>
              <li>Contact preferences</li>
              <li>School fee records</li>
            </ul>
            <p><strong>Sensitive Information.</strong> We do not process sensitive information.</p>
            <p>
              <strong>Social Media Login Data.</strong> We may provide you with the option to register with us using your existing social media account details, like your Google account. If you choose to register in this way, we will collect profile information about you from the provider, as described in Section 4.
            </p>
            <p>
              <strong>Application Data.</strong> If you use our application(s), we also may collect the following information if you choose to provide us with access or permission:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
              <li><strong>Mobile Device Access:</strong> We may request access or permission to certain features from your mobile device, including camera (for barcode or ID scanning), notifications, and local storage. You may change permissions in your device settings.</li>
              <li><strong>Push Notifications:</strong> We may request to send you push notifications regarding your account, exam schedules, or fee notices. You may turn them off in device settings.</li>
            </ul>
            <p>All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes.</p>
            <p><strong>Google API:</strong> Our use of information received from Google APIs will adhere to Google API Services User Data Policy, including the Limited Use requirements.</p>
          </section>

          {/* Section 2 */}
          <section id="section-2" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              2. HOW DO WE PROCESS YOUR INFORMATION?
            </h3>
            <p className="italic text-slate-500 text-xs">
              In Short: We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.
            </p>
            <p>We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li><strong>To facilitate account creation and authentication and manage user accounts:</strong> We process your information so you can create and log in to your account, as well as keep your account in working order.</li>
              <li><strong>To deliver and facilitate delivery of services to the user:</strong> We process your information to provide you with academic records, timetable, attendance tracking, fee receipts, and school administration.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="section-3" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
            </h3>
            <p className="italic text-slate-500 text-xs">
              In Short: We may share information in specific situations described in this section and/or with authorized service providers.
            </p>
            <p>
              <strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
            </p>
          </section>

          {/* Section 4 */}
          <section id="section-4" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              4. HOW DO WE HANDLE YOUR SOCIAL LOGINS?
            </h3>
            <p className="italic text-slate-500 text-xs">
              In Short: If you choose to register or log in to our Services using Google or third-party accounts, we may receive certain basic profile details.
            </p>
            <p>
              Our Services offer you the ability to register and log in using your Google account details. Where you choose to do this, we will receive certain profile information about you from Google, including your name and email address. We use this data exclusively for authentication and account access.
            </p>
          </section>

          {/* Section 5 */}
          <section id="section-5" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              5. HOW LONG DO WE KEEP YOUR INFORMATION?
            </h3>
            <p className="italic text-slate-500 text-xs">
              In Short: We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.
            </p>
            <p>
              We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or educational board auditing requirements).
            </p>
            <p>
              When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or securely store and isolate it from further processing until deletion is possible.
            </p>
          </section>

          {/* Section 6 */}
          <section id="section-6" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              6. HOW DO WE KEEP YOUR INFORMATION SAFE?
            </h3>
            <p className="italic text-slate-500 text-xs">
              In Short: We aim to protect your personal information through a system of organizational and technical security measures.
            </p>
            <p>
              We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.
            </p>
          </section>

          {/* Section 7 */}
          <section id="section-7" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              7. DO WE COLLECT INFORMATION FROM MINORS?
            </h3>
            <p className="italic text-slate-500 text-xs">
              In Short: We do not knowingly collect data from or market to children under 18 years of age without parental or educational institutional consent.
            </p>
            <p>
              By using the Services, you represent that you are at least 18 or that you are the parent, guardian, or authorized school representative of such a minor and consent to such minor dependent&apos;s use of the Services. If we learn that unauthorized personal information from users less than 18 years of age has been collected without institutional or parental consent, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any such data, please contact us at{' '}
              <a href="mailto:pay.laxmikant@gmail.com" className="text-indigo-600 font-semibold hover:underline">
                pay.laxmikant@gmail.com
              </a>.
            </p>
          </section>

          {/* Section 8 */}
          <section id="section-8" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              8. WHAT ARE YOUR PRIVACY RIGHTS?
            </h3>
            <p className="italic text-slate-500 text-xs">
              In Short: You may review, change, or terminate your account at any time.
            </p>
            <p>
              <strong>Withdrawing your consent:</strong> If we are relying on your consent to process your personal information, you have the right to withdraw your consent at any time by contacting us at{' '}
              <a href="mailto:pay.laxmikant@gmail.com" className="text-indigo-600 font-semibold hover:underline">
                pay.laxmikant@gmail.com
              </a>.
            </p>
            <p>
              <strong>Account Information:</strong> If you would at any time like to review or change the information in your account or terminate your account, you can:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
              <li>Log in to your account settings and update your user account.</li>
              <li>
                Visit our Account Deletion portal at{' '}
                <Link href="/delete" className="text-indigo-600 font-semibold hover:underline">
                  https://school-erm.onrender.com/delete
                </Link>
                .
              </li>
              <li>Contact us at pay.laxmikant@gmail.com.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section id="section-9" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              9. CONTROLS FOR DO-NOT-TRACK FEATURES
            </h3>
            <p>
              Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track (&ldquo;DNT&rdquo;) feature or setting you can activate to signal your privacy preference. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals.
            </p>
          </section>

          {/* Section 10 */}
          <section id="section-10" className="space-y-3 pt-4 border-t border-slate-100">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>10. WE ARE NOT RESPONSIBLE FOR ANY DATA LOSSES</span>
              </h3>
              <p className="text-xs leading-relaxed">
                We provide the software platform service, but we are not responsible or liable for any data losses whatsoever. School administrators and users are advised to maintain independent backups of critical institutional records.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section id="section-11" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              11. DO WE MAKE UPDATES TO THIS NOTICE?
            </h3>
            <p className="italic text-slate-500 text-xs">
              In Short: Yes, we will update this notice as necessary to stay compliant with relevant laws.
            </p>
            <p>
              We may update this Privacy Notice from time to time. The updated version will be indicated by an updated &ldquo;Revised&rdquo; date at the top of this Privacy Notice. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.
            </p>
          </section>

          {/* Section 12 */}
          <section id="section-12" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              12. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?
            </h3>
            <p>
              If you have questions or comments about this notice, you may email us at{' '}
              <a href="mailto:pay.laxmikant@gmail.com" className="text-indigo-600 font-semibold hover:underline">
                pay.laxmikant@gmail.com
              </a>{' '}
              or contact us by post at:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-700">
              <p className="font-bold text-slate-900">GI Campus</p>
              <p>PATNA, BIHAR 800001</p>
              <p>India</p>
              <p className="pt-1">
                Email:{' '}
                <a href="mailto:pay.laxmikant@gmail.com" className="text-indigo-600 font-medium hover:underline">
                  pay.laxmikant@gmail.com
                </a>
              </p>
            </div>
          </section>

          {/* Section 13 */}
          <section id="section-13" className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              13. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?
            </h3>
            <p>
              Based on the applicable laws of your country, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information.
            </p>
            <p>
              To request to review, update, or delete your personal information, please visit our dedicated Account Deletion portal:
            </p>
            <div className="pt-1">
              <Link
                href="/delete"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <span>Visit Account Deletion Portal (/delete)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <footer className="pt-4 pb-12 text-center space-y-4 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600">
            <Link href="/terms" className="hover:text-indigo-600 transition-colors">
              Terms and Conditions
            </Link>
            <span>&bull;</span>
            <Link href="/privacy" className="text-indigo-600 font-bold">
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
