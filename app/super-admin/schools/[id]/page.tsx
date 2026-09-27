'use client';

// ============================================================================
// Super Admin School Detail, Profile Editing & Status Governance
// ============================================================================

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { School } from '@/lib/types';
import { schoolService, safetyService, storageService, pinSecurityService, schoolExportService } from '@/lib/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { StatsCard } from '@/components/ui/stats-card';
import { ThreeStepConfirmModal } from '@/components/ui/three-step-confirm-modal';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils/formatters';
import {
  ArrowLeft,
  Building2,
  GraduationCap,
  Users,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Trash2,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  Edit,
  Sparkles,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Sliders,
  CheckCircle2,
  XCircle,
  Download,
  Database,
} from 'lucide-react';
import { CardSkeleton } from '@/components/ui/skeleton';
import {
  DEFAULT_SCHOOL_FEATURES,
  SCHOOL_FEATURE_CATALOG,
  FEATURE_CATEGORIES,
  isFeatureEnabled,
} from '@/lib/utils/features';
import { SchoolFeatureKey } from '@/lib/types';
import { SchoolCodeInput } from '@/components/schools/school-code-input';
import { validateSchoolCodeFormat } from '@/lib/utils/school-code';

export default function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isEditCodeValid, setIsEditCodeValid] = useState(true);
  const [isEditCodeAvailable, setIsEditCodeAvailable] = useState<boolean | null>(true);
  const [isEditCodeChecking, setIsEditCodeChecking] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
  });

  // 5-Digit PIN Management Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Feature Management State
  const [isUpdatingFeatures, setIsUpdatingFeatures] = useState(false);

  // Safety Modals & Data Protection
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [graceDays] = useState(30); // Mandatory 30-Day Recycle Bin Grace Period
  const [isExporting, setIsExporting] = useState(false);

  const currentFeatures: SchoolFeatureKey[] = school?.enabled_features || DEFAULT_SCHOOL_FEATURES;

  const handleDownloadFullBackup = async () => {
    if (!school) return;
    setIsExporting(true);
    try {
      const res = await schoolExportService.downloadSchoolBackup(
        school.id,
        school.name,
        school.code,
        'Platform Super Admin'
      );
      success(`Full Institutional Backup downloaded! (${res.totalRecords} records archived into ${res.filename})`);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to export backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleFeature = async (key: SchoolFeatureKey) => {
    if (!school || isUpdatingFeatures) return;
    const isCurrentlyEnabled = isFeatureEnabled(school, key);
    const nextFeatures: SchoolFeatureKey[] = isCurrentlyEnabled
      ? currentFeatures.filter((k) => k !== key)
      : [...currentFeatures, key];

    setIsUpdatingFeatures(true);
    try {
      const updated = await schoolService.updateSchool(school.id, {
        enabled_features: nextFeatures,
      });
      setSchool(updated);
      const feat = SCHOOL_FEATURE_CATALOG.find((f) => f.key === key);
      if (isCurrentlyEnabled) {
        success(`"${feat?.name || key}" disabled and hidden from school portal.`);
      } else {
        success(`"${feat?.name || key}" enabled and active in school portal.`);
      }
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to update feature');
    } finally {
      setIsUpdatingFeatures(false);
    }
  };

  const handleSetAllFeatures = async (enableAll: boolean) => {
    if (!school || isUpdatingFeatures) return;
    const nextFeatures: SchoolFeatureKey[] = enableAll
      ? [...DEFAULT_SCHOOL_FEATURES]
      : ['students', 'teachers'];

    setIsUpdatingFeatures(true);
    try {
      const updated = await schoolService.updateSchool(school.id, {
        enabled_features: nextFeatures,
      });
      setSchool(updated);
      success(enableAll ? 'All 16 features enabled.' : 'Reset to core features only.');
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to update features');
    } finally {
      setIsUpdatingFeatures(false);
    }
  };

  const loadSchool = async () => {
    setIsLoading(true);
    try {
      const data = await schoolService.getSchoolById(resolvedParams.id);
      setSchool(data);
      if (data) {
        setEditFormData({
          name: data.name,
          code: data.code,
          email: data.email,
          phone: data.phone,
          address: data.address || '',
        });
      }
    } catch {
      toastError('Failed to load school details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchool();
  }, [resolvedParams.id]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;

    // Validate School Code
    const codeValidation = validateSchoolCodeFormat(editFormData.code);
    if (!codeValidation.isValid) {
      toastError(codeValidation.error || 'Please enter a valid school code (5-7 characters, min 3 letters, min 2 digits)');
      return;
    }

    if (isEditCodeChecking) {
      toastError('Verifying school code availability. Please wait a moment...');
      return;
    }

    if (isEditCodeAvailable === false) {
      toastError(`School code "${editFormData.code.toUpperCase()}" is already registered by another school.`);
      return;
    }

    setIsSavingEdit(true);
    try {
      const updated = await schoolService.updateSchool(school.id, {
        name: editFormData.name,
        code: editFormData.code.trim().toUpperCase(),
        email: editFormData.email,
        phone: editFormData.phone,
        address: editFormData.address,
      });
      setSchool(updated);
      setIsEditModalOpen(false);
      success('School details updated successfully');
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to update school');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleOpenSchoolWorkspace = () => {
    if (!school) return;
    // Set this school as active and navigate to admin portal
    storageService.setItem('school_erp_active_user', {
      id: `usr-admin-${school.id}`,
      name: `${school.name} Admin`,
      email: school.email,
      role: 'school_admin',
      school_id: school.id,
      school_name: school.name,
      school_code: school.code,
    });
    router.push('/admin');
  };

  const handleConfirmSuspend = async (reason: string) => {
    if (!school) return;
    try {
      const updated = await safetyService.suspendSchool(
        school.id,
        school.code,
        reason,
        'Super Admin'
      );
      setSchool(updated);
      success(`School ${school.name} suspended successfully.`);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Suspension failed');
    }
  };

  const handleConfirmDeletion = async (reason: string) => {
    if (!school) return;
    try {
      await safetyService.scheduleSchoolDeletion(
        school.id,
        'DELETE SCHOOL',
        school.code,
        graceDays,
        reason,
        'usr-super-01',
        'Super Admin'
      );
      success(`School deletion scheduled with a ${graceDays}-day grace period.`);
      loadSchool();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Scheduling deletion failed');
    }
  };

  const handleResetAdminPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    if (!/^\d{5}$/.test(newPinInput.trim())) {
      toastError('PIN must be exactly 5 numeric digits (0-9)');
      return;
    }

    setIsSavingPin(true);
    try {
      await pinSecurityService.unlockAndResetPin({
        targetType: 'school_admin',
        targetId: school.id,
        newPin: newPinInput.trim(),
        unlockedByName: 'Super Admin',
      });
      success(`Administrator 5-digit PIN updated to "${newPinInput.trim()}". Account unlocked!`);
      setIsPinModalOpen(false);
      setNewPinInput('');
      loadSchool();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to update PIN');
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleUnlockAdmin = async () => {
    if (!school) return;
    try {
      await pinSecurityService.unlockAndResetPin({
        targetType: 'school_admin',
        targetId: school.id,
        newPin: school.admin_pin || '12345',
        unlockedByName: 'Super Admin',
      });
      success('School Administrator account unlocked successfully!');
      loadSchool();
    } catch {
      toastError('Failed to unlock account');
    }
  };

  const handleCancelDeletion = async () => {
    if (!school) return;
    try {
      await safetyService.cancelSchoolDeletion(school.id, 'Restored by Super Admin', 'usr-super-01');
      success(`School deletion cancelled. Tenant restored to active.`);
      loadSchool();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to cancel deletion');
    }
  };

  const handleReactivate = async () => {
    if (!school) return;
    try {
      const updated = await schoolService.updateSchoolStatus(school.id, 'active');
      setSchool(updated);
      success(`School reactivated successfully.`);
    } catch {
      toastError('Failed to reactivate school');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/super-admin/schools" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900 mb-1">School Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">
          The requested school does not exist or has been removed.
        </p>
        <Link href="/super-admin/schools">
          <Button variant="primary" size="sm">
            Back to Schools List
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-5xl">
      {/* Pending Deletion Grace Period Banner */}
      {school.status === 'pending_deletion' && (
        <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-sm font-bold">
                School Scheduled for Permanent Deletion (Grace Period Active)
              </strong>
              <p className="text-xs text-rose-700 mt-0.5">
                All student, teacher, staff, and financial records are scheduled for automated purge on{' '}
                <strong>{formatDate(school.pending_deletion_until || new Date().toISOString())}</strong>.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelDeletion}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="bg-white hover:bg-slate-50 border-rose-300 text-rose-800 shrink-0"
          >
            Cancel Deletion & Restore Tenant
          </Button>
        </div>
      )}

      {/* Back & Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/schools"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{school.name}</h1>
              <StatusBadge status={school.status} />
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Code: <strong className="text-indigo-600 font-semibold">{school.code}</strong> • ID: {school.id}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenSchoolWorkspace}
            rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
          >
            Open School Workspace
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadFullBackup}
            isLoading={isExporting}
            leftIcon={<Download className="w-3.5 h-3.5 text-indigo-600" />}
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            Download Backup
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            leftIcon={<Edit className="w-3.5 h-3.5 text-slate-600" />}
          >
            Edit Details
          </Button>

          {school.status === 'active' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSuspendModalOpen(true)}
              leftIcon={<ShieldAlert className="w-3.5 h-3.5 text-amber-600" />}
            >
              Suspend School
            </Button>
          ) : school.status === 'suspended' ? (
            <Button
              variant="success"
              size="sm"
              onClick={handleReactivate}
              leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
            >
              Reactivate School
            </Button>
          ) : null}

          {school.status !== 'pending_deletion' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Schedule Deletion
            </Button>
          )}
        </div>
      </div>

      {/* Real Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard
          title="Enrolled Students"
          value={school.student_count || 0}
          subtitle="Registered active students"
          icon={GraduationCap}
          accentColor="indigo"
        />
        <StatsCard
          title="Teachers"
          value={school.teacher_count || 0}
          subtitle="Active faculty members"
          icon={Users}
          accentColor="emerald"
        />
        <StatsCard
          title="Staff Members"
          value={school.staff_count || 0}
          subtitle="Non-teaching staff"
          icon={Building2}
          accentColor="slate"
        />
        <StatsCard
          title="Academic Session"
          value="2026-27"
          subtitle="Current active session"
          icon={Calendar}
          accentColor="slate"
        />
      </div>

      {/* Institutional Overview & Administrator Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact & Physical Campus Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>School Campus & Contact</span>
          </h3>

          <div className="space-y-3 text-xs divide-y divide-slate-100">
            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Official Email:
              </span>
              <span className="font-semibold text-slate-900">{school.email || 'Not configured'}</span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number:
              </span>
              <span className="font-semibold text-slate-900">{school.phone || 'Not configured'}</span>
            </div>

            <div className="pt-2 flex items-start justify-between gap-4">
              <span className="text-slate-500 flex items-center gap-2 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Campus Address:
              </span>
              <span className="font-semibold text-slate-900 text-right">{school.address || 'Not specified'}</span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Onboarded Date:
              </span>
              <span className="font-semibold text-slate-900">{formatDate(school.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Administrator Authentication & Access Information */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>School Administrator Access</span>
          </h3>

          <div className="p-3.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-indigo-900">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Passwordless Google Authentication</span>
            </div>
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              The principal and school administrators log in using <strong>Sign In with Google</strong> using their registered institutional email address.
            </p>
          </div>

          <div className="space-y-3 text-xs divide-y divide-slate-100">
            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-500">Authorized Admin Email:</span>
              <span className="font-semibold text-slate-900 font-mono">{school.admin_email || school.email}</span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-500">5-Digit Security PIN:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800 tracking-wider">
                  {showPin ? school.admin_pin || '12345' : '•••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                  title={showPin ? 'Hide PIN' : 'Reveal PIN'}
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setNewPinInput(school.admin_pin || '12345');
                    setIsPinModalOpen(true);
                  }}
                  leftIcon={<KeyRound className="w-3 h-3 text-indigo-600" />}
                >
                  Reset PIN
                </Button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-500">PIN Lockout Status:</span>
              {school.is_admin_pin_locked ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    Locked (5 Failed Attempts)
                  </span>
                  <Button variant="primary" size="xs" onClick={handleUnlockAdmin}>
                    Unlock Account
                  </Button>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active ({school.admin_pin_failed_attempts || 0} / 5 Attempts)
                </span>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-500">Security Verification:</span>
              <span className="text-slate-700 font-medium">Confidential Question Configured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modular Feature & Plan Controls Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Feature Modules & Plan Controls</span>
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {currentFeatures.length} / {DEFAULT_SCHOOL_FEATURES.length} Modules Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Super Admin can grant or revoke modules for this school at any time.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => handleSetAllFeatures(true)}
              disabled={isUpdatingFeatures}
              className="text-xs"
            >
              Enable All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => handleSetAllFeatures(false)}
              disabled={isUpdatingFeatures}
              className="text-xs text-slate-600"
            >
              Core Only
            </Button>
          </div>
        </div>

        {/* Data Safety Notice */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="font-semibold block text-emerald-900">Non-Destructive Feature Governance</strong>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Disabling a feature simply hides its navigation menu and pages from this school's users. <strong>No data is deleted</strong>. When you turn a feature back on, all previous data, records, and settings reappear intact immediately.
            </p>
          </div>
        </div>

        {/* Categories & Features Grid */}
        <div className="space-y-6">
          {FEATURE_CATEGORIES.map((cat) => {
            const features = SCHOOL_FEATURE_CATALOG.filter((f) => f.category === cat.id);
            if (features.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    {cat.label}
                  </h4>
                  <span className="text-[11px] text-slate-400">{cat.description}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {features.map((feature) => {
                    const isEnabled = isFeatureEnabled(school, feature.key);
                    return (
                      <div
                        key={feature.key}
                        className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          isEnabled
                            ? 'bg-slate-50/80 border-slate-200 shadow-2xs'
                            : 'bg-slate-100/40 border-slate-200/60 opacity-60'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{feature.name}</span>
                            {isEnabled ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Enabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.2 rounded">
                                <XCircle className="w-2.5 h-2.5" /> Hidden
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            {feature.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleFeature(feature.key)}
                          disabled={isUpdatingFeatures}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                            isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                          } ${isUpdatingFeatures ? 'opacity-50 cursor-not-allowed' : ''}`}
                          role="switch"
                          aria-checked={isEnabled}
                          title={isEnabled ? 'Click to disable and hide' : 'Click to enable and show'}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Institutional Data Archive & Safety Backup Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Full Institutional Data Backup & Export</span>
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3" /> Zero Data Loss Guarantee
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Download the complete, uncompressed database backup for <strong>{school.name}</strong> ({school.code}). Includes all students, teachers, staff, fee invoices, payment receipts, exam results, attendance registers, and timetable.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadFullBackup}
            isLoading={isExporting}
            leftIcon={<Download className="w-4 h-4" />}
            className="shrink-0"
          >
            Download Full Backup (.JSON)
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Students & Guardians</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">{school.student_count || 0} Records</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Faculty & Teachers</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">{school.teacher_count || 0} Records</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Active Modules</span>
            <span className="text-sm font-bold text-indigo-600 mt-0.5 block">{currentFeatures.length} Active Modules</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Format Standard</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">2.0-Enterprise JSON</span>
          </div>
        </div>
      </div>

      {/* Super Admin Reset 5-Digit PIN Modal */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title={`Reset 5-Digit Access PIN: ${school.name}`}
        description="Configure a new mandatory 5-digit PIN for the School Administrator"
      >
        <form onSubmit={handleResetAdminPin} className="space-y-4 text-left">
          <Input
            label="New 5-Digit PIN"
            required
            maxLength={5}
            value={newPinInput}
            onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="e.g. 54321"
            helperText="Must be exactly 5 numeric digits. Unlocks account automatically if currently locked."
          />

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              This PIN is strictly required for the Principal / School Admin on both the Web dashboard and Mobile app before accessing any student, staff, or financial data.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPinModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSavingPin}>
              Save & Unlock
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit School Details Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit School: ${school.name}`}
        description="Update institutional contact details and campus information"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-left">
          <Input
            label="School Name"
            required
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            placeholder="e.g. Modern Vidya Niketan"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SchoolCodeInput
              value={editFormData.code}
              onChange={(code) => setEditFormData({ ...editFormData, code })}
              excludeSchoolId={school?.id}
              onValidationChange={(valid, available, checking) => {
                setIsEditCodeValid(valid);
                setIsEditCodeAvailable(available);
                setIsEditCodeChecking(checking);
              }}
              required
            />
            <Input
              label="Phone Number"
              required
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              placeholder="+91 98765 00000"
            />
          </div>

          <Input
            label="Official School Email"
            type="email"
            required
            value={editFormData.email}
            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            placeholder="admin@school.edu.in"
          />

          <Input
            label="Campus Address"
            value={editFormData.address}
            onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
            placeholder="Plot No. 12, Main Road, City"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSavingEdit}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingEdit}
              disabled={isSavingEdit || isEditCodeChecking || isEditCodeAvailable === false || !isEditCodeValid}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Three-Step School Suspension Modal */}
      <ThreeStepConfirmModal
        isOpen={isSuspendModalOpen}
        onClose={() => setIsSuspendModalOpen(false)}
        title={`Suspend School: ${school.name}`}
        actionLabel="Confirm & Suspend School"
        warningMessage="Suspending this school will immediately prevent all students, teachers, and school administrators from logging in. Active student portals will show the Institutional Suspension notice."
        impactDetails={[
          { label: 'School Code', value: school.code },
          { label: 'Impacted Students', value: school.student_count || 0 },
          { label: 'Impacted Teachers', value: school.teacher_count || 0 },
          { label: 'Partition Action', value: 'Disable Active Tokens' },
        ]}
        confirmationPrompt={`To proceed, type the school code "${school.code}" below:`}
        expectedConfirmationText={school.code}
        onConfirm={handleConfirmSuspend}
      />

      {/* 3. Three-Step School Deletion Modal with Mandatory 30-Day Grace Period */}
      <ThreeStepConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={`Move School to 30-Day Recycle Bin: ${school.name}`}
        actionLabel="Move to 30-Day Recycle Bin"
        warningMessage="This moves the institution into the 30-day Recycle Bin. In accordance with safety policies, this cannot be force-purged before 30 days. You can restore this school to active status anytime during the 30-day window."
        impactDetails={[
          { label: 'School Code', value: school.code },
          { label: 'Retention Period', value: 'Strict 30 Days' },
          { label: 'Target School', value: school.name },
          { label: 'Policy Enforcement', value: 'Auto-Purge after 30 Days (No Force Delete)' },
        ]}
        confirmationPrompt='To confirm, type "DELETE SCHOOL" below:'
        expectedConfirmationText="DELETE SCHOOL"
        onConfirm={handleConfirmDeletion}
      />
    </div>
  );
}
