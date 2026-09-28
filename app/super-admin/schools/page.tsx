'use client';

// ============================================================================
// Super Admin Schools Management & School Creation Modal
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { School, SchoolStatus, SchoolFeatureKey } from '@/lib/types';
import { schoolService } from '@/lib/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { SearchFilterBar } from '@/components/ui/search-filter-bar';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils/formatters';
import { Building2, Plus, Users, GraduationCap, Phone, Mail, ExternalLink, Sparkles, MapPin, ShieldCheck, Lock } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';
import {
  DEFAULT_SCHOOL_FEATURES,
  SCHOOL_FEATURE_CATALOG,
  FEATURE_CATEGORIES,
  getFeaturesByCategory,
} from '@/lib/utils/features';
import { SchoolCodeInput } from '@/components/schools/school-code-input';
import { GoogleEmailInput } from '@/components/ui/google-email-input';
import { PhoneInput, validatePhoneNumber } from '@/components/ui/phone-input';
import { validateSchoolCodeFormat } from '@/lib/utils/school-code';
import { emailValidationService } from '@/lib/services/api';

export default function SchoolsManagementPage() {
  const { success, error: toastError } = useToast();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [isCodeAvailable, setIsCodeAvailable] = useState<boolean | null>(null);
  const [isCodeChecking, setIsCodeChecking] = useState(false);
  const [isAdminEmailValid, setIsAdminEmailValid] = useState(false);
  const [isAdminEmailAvailable, setIsAdminEmailAvailable] = useState<boolean | null>(null);
  const [isAdminEmailChecking, setIsAdminEmailChecking] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    adminName: '',
    adminEmail: '',
    adminPin: '12345',
    securityQuestion: 'principal_reg',
    customSecurityQuestion: '',
    securityAnswer: '',
  });

  const [selectedFeatures, setSelectedFeatures] = useState<SchoolFeatureKey[]>([
    ...DEFAULT_SCHOOL_FEATURES,
  ]);

  const toggleFeature = (key: SchoolFeatureKey) => {
    setSelectedFeatures((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllFeatures = () => {
    setSelectedFeatures([...DEFAULT_SCHOOL_FEATURES]);
  };

  const handleDeselectAllFeatures = () => {
    setSelectedFeatures(['students', 'teachers']); // Keep core minimally
  };

  const loadSchools = async () => {
    setIsLoading(true);
    try {
      const data = await schoolService.getSchools();
      setSchools(data);
    } catch {
      toastError('Failed to load schools');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate School Code
    const codeValidation = validateSchoolCodeFormat(formData.code);
    if (!codeValidation.isValid) {
      toastError(codeValidation.error || 'Please enter a valid school code (5-7 characters, min 3 letters, min 2 digits)');
      return;
    }

    if (isCodeChecking) {
      toastError('Verifying school code availability. Please wait a moment...');
      return;
    }

    if (isCodeAvailable === false) {
      toastError(`School code "${formData.code.toUpperCase()}" is already registered. Please choose another one.`);
      return;
    }

    // 2. Validate Admin Google Email
    const emailValidation = emailValidationService.validateGmailFormat(formData.adminEmail);
    if (!emailValidation.isValid) {
      toastError(emailValidation.error || 'Admin Google Email must end with @gmail.com for Sign-In');
      return;
    }

    if (isAdminEmailChecking) {
      toastError('Verifying Admin Google email in central registry. Please wait a moment...');
      return;
    }

    if (isAdminEmailAvailable === false) {
      toastError(`Admin Google Email "${formData.adminEmail.trim().toLowerCase()}" is already registered in the central database. Please choose a unique account.`);
      return;
    }

    // 3. Validate Phone Number (must start with 6, 7, 8, or 9 and be exactly 10 digits)
    const phoneCheck = validatePhoneNumber(formData.phone);
    if (!phoneCheck.isValid) {
      toastError(phoneCheck.error || 'Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits');
      return;
    }

    if (!/^\d{5}$/.test(formData.adminPin.trim())) {
      toastError('Administrator Security PIN must be exactly 5 numeric digits (0-9)');
      return;
    }
    setIsSubmitting(true);

    try {
      const finalQuestion =
        formData.securityQuestion === 'custom'
          ? formData.customSecurityQuestion.trim()
          : formData.securityQuestion;

      if (formData.securityQuestion === 'custom' && !formData.customSecurityQuestion.trim()) {
        toastError('Please enter your custom security question');
        setIsSubmitting(false);
        return;
      }

      await schoolService.createSchool({
        name: formData.name,
        code: formData.code.trim().toUpperCase(),
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail.trim().toLowerCase(),
        adminPin: formData.adminPin.trim(),
        securityQuestion: finalQuestion,
        securityAnswer: formData.securityAnswer,
        enabled_features: selectedFeatures,
      });

      success(`School "${formData.name}" created successfully with ${selectedFeatures.length} enabled modules!`);
      setIsModalOpen(false);
      setFormData({
        name: '',
        code: '',
        email: '',
        phone: '',
        address: '',
        adminName: '',
        adminEmail: '',
        adminPin: '12345',
        securityQuestion: 'principal_reg',
        customSecurityQuestion: '',
        securityAnswer: '',
      });
      setIsCodeValid(false);
      setIsCodeAvailable(null);
      setIsAdminEmailValid(false);
      setIsAdminEmailAvailable(null);
      setSelectedFeatures([...DEFAULT_SCHOOL_FEATURES]);
      loadSchools();
    } catch (err: any) {
      toastError(err?.message || 'Failed to create school');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered List
  const filteredSchools = schools.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? s.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Schools Directory</h1>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create New School
        </Button>
      </div>

      {/* Search & Filters */}
      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by school name, code or email..."
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Suspended', value: 'suspended' },
              { label: 'Inactive', value: 'inactive' },
            ],
          },
        ]}
        onClearAll={() => {
          setSearch('');
          setStatusFilter('');
        }}
      />

      {/* Responsive Table / Cards */}
      {isLoading ? (
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <TableSkeleton rows={4} cols={6} />
        </div>
      ) : filteredSchools.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
          No schools matching your search criteria.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">School Name</th>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Students</th>
                  <th className="px-5 py-3">Teachers</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSchools.map((school) => (
                  <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{school.name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{school.address}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">{school.code}</td>
                    <td className="px-5 py-3.5">
                      <div>{school.email}</div>
                      <div className="text-slate-400">{school.phone}</div>
                    </td>
                    <td className="px-5 py-3.5 font-medium">{school.student_count || 0}</td>
                    <td className="px-5 py-3.5 font-medium">{school.teacher_count || 0}</td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDate(school.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={school.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/super-admin/schools/${school.id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                      >
                        View <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredSchools.map((school) => (
              <div key={school.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{school.name}</h3>
                    <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {school.code}
                    </span>
                  </div>
                  <StatusBadge status={school.status} />
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{school.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{school.phone}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex gap-3 text-slate-500">
                    <span>{school.student_count || 0} students</span>
                    <span>•</span>
                    <span>{school.teacher_count || 0} teachers</span>
                  </div>
                  <Link
                    href={`/super-admin/schools/${school.id}`}
                    className="text-indigo-600 font-semibold"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create School Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New School Tenant"
        description="Provision a new multi-tenant school instance with its own database partition"
        fullScreen={true}
        allowFullScreenToggle={true}
        maxWidth="full"
      >
        <form onSubmit={handleCreateSchool} className="space-y-6 text-left">
          {/* Card 1: Institutional Identity */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">Institutional Identity</h4>
                <p className="text-xs text-slate-500">Official registered school name and unique system code</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              <div>
                <Input
                  label="School Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Modern Vidya Niketan"
                  helperText="Official school title printed on receipts, notices, and portals"
                />
              </div>

              <div>
                <SchoolCodeInput
                  value={formData.code}
                  onChange={(code) => setFormData({ ...formData, code })}
                  onValidationChange={(valid, available, checking) => {
                    setIsCodeValid(valid);
                    setIsCodeAvailable(available);
                    setIsCodeChecking(checking);
                  }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Card 2: Contact & Location */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">Contact & Location</h4>
                <p className="text-xs text-slate-500">Public institutional contact points for parents and stakeholders</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              <Input
                label="Official School Contact Email (Public)"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@schoolcampus.edu.in"
                helperText="Public email printed on fee receipts and official circulars"
              />

              <PhoneInput
                label="Phone Number"
                required
                value={formData.phone}
                onChange={(phone) => setFormData({ ...formData, phone })}
                placeholder="98765 00000"
                helperText="10-digit primary mobile/office contact (starts with 6, 7, 8, 9)"
              />
            </div>

            <div>
              <Input
                label="Campus Physical Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Plot No. 12, Sector 8, New Delhi"
                helperText="Street address, city, and state"
              />
            </div>
          </div>

          {/* Card 3: Administrator Account & Recovery */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">Initial School Administrator Account</h4>
                <p className="text-xs text-slate-500">Principal or administrative head who will manage this tenant</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              <Input
                label="Admin Full Name"
                required
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                placeholder="Dr. K. S. Murthy"
                helperText="Principal or Headmaster full name"
              />

              <GoogleEmailInput
                targetRole="school_admin"
                value={formData.adminEmail}
                onChange={(adminEmail) => setFormData({ ...formData, adminEmail })}
                onValidationChange={(valid, available, checking) => {
                  setIsAdminEmailValid(valid);
                  setIsAdminEmailAvailable(available);
                  setIsAdminEmailChecking(checking);
                }}
                required
              />

              <Input
                label="5-Digit Access PIN"
                required
                maxLength={5}
                value={formData.adminPin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    adminPin: e.target.value.replace(/\D/g, '').slice(0, 5),
                  })
                }
                placeholder="12345"
                helperText="Super Admin set only (5 digits)"
              />
            </div>

            <div className="p-3.5 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-start gap-3 text-xs text-indigo-950">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="block font-semibold">Passwordless Google OAuth Access</strong>
                <span className="text-[11px] text-indigo-800 leading-relaxed block">
                  The administrator will sign in directly using <strong>Sign In with Google</strong> with their registered Admin Email. No complex passwords required.
                </span>
              </div>
            </div>

            {/* Symmetrical Security Verification Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Confidential Security Question <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.securityQuestion}
                  onChange={(e) => setFormData({ ...formData, securityQuestion: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600"
                >
                  <option value="principal_reg">What is the Principal's confidential appointment / registration code?</option>
                  <option value="noc_code">What is the official state affiliation / NOC order reference number?</option>
                  <option value="trust_reg">What is the founding society / trust deed registration number?</option>
                  <option value="treasury_ac">What are the last 4 digits of the institutional treasury / fee bank account?</option>
                  <option value="smc_secretary">What is the full name of the first SMC (School Management Committee) Secretary?</option>
                  <option value="custom">✏️ Write a custom confidential question (Known only to Principal)...</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Used for emergency access recovery and PIN resets</p>
              </div>

              <div>
                <Input
                  label="Security Answer"
                  required
                  value={formData.securityAnswer}
                  onChange={(e) => setFormData({ ...formData, securityAnswer: e.target.value })}
                  placeholder="Enter confidential answer..."
                  helperText="Strictly confidential, known only to Principal"
                />
              </div>
            </div>

            {formData.securityQuestion === 'custom' && (
              <div className="pt-2">
                <Input
                  label="Custom Confidential Question"
                  required
                  value={formData.customSecurityQuestion}
                  onChange={(e) => setFormData({ ...formData, customSecurityQuestion: e.target.value })}
                  placeholder="e.g. What was the private reference code assigned by the founding committee?"
                  helperText="Type any secret question that only the Principal knows"
                />
              </div>
            )}
          </div>

          {/* Card 4: Module & Feature Access */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                    Module & Feature Access ({selectedFeatures.length}/{DEFAULT_SCHOOL_FEATURES.length} Enabled)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Select ERP features provisioned for this school. Features can be toggled later anytime.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAllFeatures}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllFeatures}
                  className="text-xs font-bold text-slate-600 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Core Only
                </button>
              </div>
            </div>

            {/* Symmetrical 2-Column Category Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {FEATURE_CATEGORIES.map((cat) => {
                const features = SCHOOL_FEATURE_CATALOG.filter((f) => f.category === cat.id);
                if (features.length === 0) return null;

                return (
                  <div key={cat.id} className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          {cat.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {features.filter(f => selectedFeatures.includes(f.key)).length}/{features.length} Active
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-2">{cat.description}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {features.map((feature) => {
                        const isChecked = selectedFeatures.includes(feature.key);
                        return (
                          <label
                            key={feature.key}
                            className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-white border-indigo-300 shadow-2xs text-slate-900 font-medium'
                                : 'bg-slate-100/60 border-slate-200 text-slate-500 opacity-60 hover:opacity-80'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleFeature(feature.key)}
                              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-bold block text-xs truncate">
                                {feature.name}
                              </span>
                              <span className="text-[10px] text-slate-500 block leading-tight line-clamp-1">
                                {feature.description}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky Symmetrical Action Footer */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 md:-mx-8 md:-mb-8 p-4 sm:p-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg z-10">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className={`inline-flex items-center gap-1 ${isCodeValid && isCodeAvailable ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                {isCodeValid && isCodeAvailable ? '✓' : '•'} Code Verified
              </span>
              <span className={`inline-flex items-center gap-1 ${isAdminEmailValid && isAdminEmailAvailable ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                {isAdminEmailValid && isAdminEmailAvailable ? '✓' : '•'} Admin Email Verified
              </span>
              <span className={`inline-flex items-center gap-1 ${/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, '')) ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                {/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, '')) ? '✓' : '•'} 10-Digit Phone
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                disabled={
                  isSubmitting ||
                  isCodeChecking ||
                  isCodeAvailable === false ||
                  !isCodeValid ||
                  isAdminEmailChecking ||
                  isAdminEmailAvailable === false ||
                  !isAdminEmailValid ||
                  !/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))
                }
                className="w-full sm:w-auto px-6 font-bold shadow-md hover:shadow-lg transition-all"
              >
                Provision School Tenant
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
