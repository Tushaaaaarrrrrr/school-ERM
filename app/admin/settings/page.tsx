'use client';

// ============================================================================
// School Admin Settings (Branding, Logo, Limits, Academic Years & Governance)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { schoolService, academicYearService, sessionTransitionService, schoolExportService } from '@/lib/services/api';
import { AcademicYear, AcademicYearTransitionBatch, SchoolDayKey, SchoolHours } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils/formatters';
import { SessionTransitionModal } from '@/components/academic/session-transition-modal';
import { UserPasswordCard } from '@/components/auth/user-password-modal';
import { DEFAULT_WEEKLY_HOURS } from '@/lib/utils/school-timing';
import Link from 'next/link';
import {
  Building,
  Calendar,
  Plus,
  Shield,
  Lock,
  History,
  UserX,
  Sparkles,
  Sliders,
  ArrowRight,
  RotateCcw,
  Users,
  CheckCircle2,
  Pencil,
  Clock3,
  Download,
  Database,
  ShieldCheck,
} from 'lucide-react';

const SCHOOL_DAYS: Array<{ key: SchoolDayKey; label: string }> = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const defaultOrConfiguredHours = (hours?: SchoolHours): SchoolHours => {
  if (hours && typeof hours === 'object' && Object.keys(hours).length > 0) {
    const merged: Record<string, any> = { ...DEFAULT_WEEKLY_HOURS };
    for (const day of SCHOOL_DAYS) {
      if (hours[day.key] && typeof hours[day.key].is_open === 'boolean') {
        merged[day.key] = hours[day.key];
      }
    }
    return merged as SchoolHours;
  }
  return DEFAULT_WEEKLY_HOURS;
};

export default function SchoolSettingsPage() {
  const { currentSchool, setCurrentSchool, academicYears, setCurrentYear, currentYear, currentUser } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [profileData, setProfileData] = useState({
    name: currentSchool?.name || '',
    phone: currentSchool?.phone || '',
    email: currentSchool?.email || '',
    address: currentSchool?.address || '',
    logoUrl: currentSchool?.logo_url || '',
    photoMaxMb: currentSchool?.profile_photo_max_mb || 2,
    timezone: currentSchool?.timezone || 'Asia/Kolkata',
    schoolContactPhone: currentSchool?.school_contact_phone || '+91 98765 43210',
    schoolContactAlternate: currentSchool?.school_contact_alternate || '',
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [schoolHours, setSchoolHours] = useState<SchoolHours>(() => defaultOrConfiguredHours(currentSchool?.school_hours));
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isEditYearModalOpen, setIsEditYearModalOpen] = useState(false);
  const [sessionYears, setSessionYears] = useState<AcademicYear[]>(academicYears);
  const [editingYearId, setEditingYearId] = useState('');
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [transitionBatches, setTransitionBatches] = useState<AcademicYearTransitionBatch[]>([]);
  const [isReversingBatchId, setIsReversingBatchId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadSchoolBackup = async () => {
    if (!currentSchool) return;
    setIsExporting(true);
    try {
      const res = await schoolExportService.downloadSchoolBackup(
        currentSchool.id,
        currentSchool.name,
        currentSchool.code,
        currentUser?.name || 'School Principal'
      );
      success(`Complete Institutional Backup downloaded! (${res.totalRecords} records archived into ${res.filename})`);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to export backup');
    } finally {
      setIsExporting(false);
    }
  };

  const [newYear, setNewYear] = useState({
    name: '2027-28',
    startDate: '2027-04-01',
    endDate: '2028-03-31',
    isCurrent: false,
  });
  const [editYear, setEditYear] = useState({ name: '', startDate: '', endDate: '' });

  const loadSessions = async () => {
    if (!currentSchool?.id) return;
    try {
      const state = await academicYearService.ensureCurrentYear(currentSchool.id);
      setSessionYears(state.years);
      setCurrentYear(state.current);
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to load academic sessions');
    }
  };

  const loadBatches = async () => {
    try {
      const bList = await sessionTransitionService.getTransitionBatches(schoolId);
      setTransitionBatches(bList);
    } catch {}
  };

  useEffect(() => {
    loadBatches();
    loadSessions();
  }, [schoolId]);

  const handleReverseTransition = async (batch: AcademicYearTransitionBatch) => {
    if (
      !confirm(
        `Are you sure you want to reverse the session transition for ${batch.target_academic_year_name}? All newly generated enrollments will be removed and students will be reverted to previous session rosters.`
      )
    )
      return;

    setIsReversingBatchId(batch.id);
    try {
      await sessionTransitionService.reverseAcademicYearTransition(
        schoolId,
        batch.id,
        currentUser?.name || 'School Admin',
        currentUser?.id
      );
      success(`Session transition for ${batch.target_academic_year_name} reversed successfully!`);
      loadBatches();
    } catch (err: any) {
      toastError(err.message || 'Failed to reverse session transition');
    } finally {
      setIsReversingBatchId(null);
    }
  };

  useEffect(() => {
    if (currentSchool) {
      setProfileData({
        name: currentSchool.name,
        phone: currentSchool.phone,
        email: currentSchool.email,
        address: currentSchool.address || '',
        logoUrl: currentSchool.logo_url || '',
        photoMaxMb: currentSchool.profile_photo_max_mb || 2,
        timezone: currentSchool.timezone || 'Asia/Kolkata',
        schoolContactPhone: currentSchool.school_contact_phone || currentSchool.phone || '+91 98765 43210',
        schoolContactAlternate: currentSchool.school_contact_alternate || '',
      });
      setSchoolHours(defaultOrConfiguredHours(currentSchool.school_hours));
    }
  }, [currentSchool]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalidDay = SCHOOL_DAYS.find(({ key }) => {
      const hours = schoolHours[key];
      return hours.is_open && (!hours.start_time || !hours.end_time || hours.end_time <= hours.start_time);
    });
    if (invalidDay) {
      toastError(`${invalidDay.label}: closing time must be after opening time`);
      return;
    }
    setIsSavingProfile(true);

    const targetSchoolId = currentSchool?.id || schoolId;
    try {
      const updated = await schoolService.updateSchoolProfile(targetSchoolId, {
        name: profileData.name,
        phone: profileData.phone,
        email: profileData.email,
        address: profileData.address,
        logo_url: profileData.logoUrl,
        profile_photo_max_mb: Math.min(10, Math.max(1, profileData.photoMaxMb)),
        timezone: profileData.timezone,
        school_contact_phone: profileData.schoolContactPhone,
        school_contact_alternate: profileData.schoolContactAlternate,
        school_hours: schoolHours,
      });
      setCurrentSchool(updated);
      success('School profile, contact numbers and branding updated successfully!');
    } catch (err: any) {
      toastError(err?.message || 'Failed to update school profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYear.name.trim()) return;

    try {
      const created = await academicYearService.createYear(
        schoolId,
        newYear.name.trim(),
        newYear.startDate,
        newYear.endDate
      );

      success(`Academic Year ${created.name} created!`);
      setIsYearModalOpen(false);
      if (newYear.isCurrent) {
        const active = await academicYearService.setCurrentYear(schoolId, created.id);
        setCurrentYear(active);
      }
      await loadSessions();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to create academic year');
    }
  };

  const openEditYear = (year: AcademicYear) => {
    setEditingYearId(year.id);
    setEditYear({ name: year.name, startDate: year.start_date, endDate: year.end_date });
    setIsEditYearModalOpen(true);
  };

  const handleEditYear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await academicYearService.updateYear(schoolId, editingYearId, {
        name: editYear.name.trim(),
        start_date: editYear.startDate,
        end_date: editYear.endDate,
      });
      if (updated.id === currentYear?.id) setCurrentYear(updated);
      setIsEditYearModalOpen(false);
      await loadSessions();
      success(`Academic session ${updated.name} updated.`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to update academic session');
    }
  };

  return (
    <div className="space-y-6 text-left w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">School Settings</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/security/logs">
            <Button variant="outline" size="sm" leftIcon={<History className="w-3.5 h-3.5" />}>
              Login Logs
            </Button>
          </Link>
          <Link href="/admin/account-requests">
            <Button variant="outline" size="sm" leftIcon={<UserX className="w-3.5 h-3.5 text-rose-500" />}>
              Deletion Requests
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. School Profile & Branding */}
      <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Building className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">School Profile & Branding</h3>
        </div>

        {/* Logo Upload with Containment */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <PhotoUpload
            label="School Official Logo"
            helperText="JPG, PNG, or WEBP (Max 2MB). Displayed with containment across all student, teacher & admin portals."
            currentPhotoUrl={profileData.logoUrl}
            aspectRatio="contain"
            maxMb={2}
            onPhotoChange={(url) => setProfileData({ ...profileData, logoUrl: url || '' })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="School Name"
            required
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              School Code (Permanent Partition Key)
            </label>
            <div className="px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-mono font-bold">
              {currentSchool?.code}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Public Contact Email"
            type="email"
            required
            value={profileData.email}
            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
          />
          <Input
            label="General Contact Phone"
            required
            value={profileData.phone}
            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Parent Helpline / Call School Phone (Dialed from Parent Portal)"
            required
            value={profileData.schoolContactPhone}
            onChange={(e) => setProfileData({ ...profileData, schoolContactPhone: e.target.value })}
            helperText="Opens when parents tap [Call School] on Parent Portal"
          />
          <Input
            label="Alternate Emergency Phone (Optional)"
            value={profileData.schoolContactAlternate}
            onChange={(e) => setProfileData({ ...profileData, schoolContactAlternate: e.target.value })}
          />
        </div>

        <Input
          label="Campus Address"
          value={profileData.address}
          onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Profile Photo Upload Limit (Max MB per user)
            </label>
            <Input
              type="number"
              min={1}
              max={10}
              value={profileData.photoMaxMb}
              onChange={(e) => setProfileData({ ...profileData, photoMaxMb: parseInt(e.target.value) || 2 })}
              helperText="Allowed between 1MB and 10MB (Platform maximum)"
            />
          </div>

          <Input
            label="Timezone"
            value={profileData.timezone}
            onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
            helperText="Default schedule timezone (e.g. Asia/Kolkata)"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-indigo-600 shrink-0" />
            <h4 className="text-xs font-bold text-slate-900">Weekly School Timing</h4>
          </div>
          <div className="space-y-2">
            {SCHOOL_DAYS.map(({ key, label }) => {
              const hours = schoolHours[key];
              return (
                <div
                  key={key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 sm:p-3"
                >
                  <div className="flex items-center justify-between sm:justify-start sm:gap-4 min-w-[130px]">
                    <span className="text-xs font-bold text-slate-800">{label}</span>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hours.is_open}
                        onChange={(e) =>
                          setSchoolHours({
                            ...schoolHours,
                            [key]: { ...hours, is_open: e.target.checked },
                          })
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span>Open</span>
                    </label>
                  </div>

                  {hours.is_open ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        aria-label={`${label} opening time`}
                        type="time"
                        value={hours.start_time}
                        onChange={(e) =>
                          setSchoolHours({
                            ...schoolHours,
                            [key]: { ...hours, start_time: e.target.value },
                          })
                        }
                        className="flex-1 sm:w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-mono font-medium text-slate-900 bg-white"
                      />
                      <span className="text-xs text-slate-400 font-medium px-1">to</span>
                      <input
                        aria-label={`${label} closing time`}
                        type="time"
                        value={hours.end_time}
                        onChange={(e) =>
                          setSchoolHours({
                            ...schoolHours,
                            [key]: { ...hours, end_time: e.target.value },
                          })
                        }
                        className="flex-1 sm:w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-mono font-medium text-slate-900 bg-white"
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 italic">School Closed</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button type="submit" variant="primary" size="sm" isLoading={isSavingProfile}>
            Save School Profile & Branding
          </Button>
        </div>
      </form>

      {/* 2. Institutional Ownership & Governance (Platform Managed) */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-700" />
            <h3 className="text-sm font-bold text-slate-900">Administrator Identity & Governance</h3>
          </div>
          <span className="text-[11px] font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Lock className="w-3 h-3" /> Managed by Platform Administrator
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          For tenant security and compliance governance, the primary administrator account ownership and institutional status may only be altered by a Platform Super Administrator.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-slate-400 text-[10px] block">Designated Principal / Admin</span>
            <strong className="text-slate-900 font-semibold">{currentUser?.name || 'Dr. Anita Deshmukh'}</strong>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-slate-400 text-[10px] block">Admin Login Email</span>
            <strong className="text-slate-900 font-mono font-semibold">{currentUser?.email || 'admin@delhipublic.edu.in'}</strong>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-slate-400 text-[10px] block">Tenant Status</span>
            <strong className="text-emerald-700 font-semibold">Active & Verified</strong>
          </div>
        </div>
      </div>

      {/* 3. Academic Years Session Manager & Move to New Session */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Academic Years & Sessions</h3>
              <p className="text-xs text-slate-500">Configure annual terms and transition student cohorts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsYearModalOpen(true)}
            >
              Add Session
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setIsTransitionModalOpen(true)}
            >
              Move to New Session
            </Button>
          </div>
        </div>

        {currentYear && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Current Academic Session</span>
                <p className="mt-1 text-lg font-bold text-slate-900">{currentYear.name}</p>
                <p className="text-xs text-slate-600">Starts {formatDate(currentYear.start_date)} • Ends {formatDate(currentYear.end_date)}</p>
              </div>
              <Button variant="outline" size="sm" leftIcon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEditYear(currentYear)}>
                Edit Current Session
              </Button>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="divide-y divide-slate-100">
          {sessionYears.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">No academic sessions configured.</div>
          )}
          {sessionYears.map((yr) => (
            <div key={yr.id} className="py-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{yr.name}</span>
                  {yr.id === currentYear?.id ? (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      Active Current Session
                    </span>
                  ) : yr.status === 'draft' ? (
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                      Draft / Upcoming
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-slate-500">
                  {formatDate(yr.start_date)} to {formatDate(yr.end_date)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" leftIcon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEditYear(yr)}>
                  Edit
                </Button>
                {yr.id !== currentYear?.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const active = await academicYearService.setCurrentYear(schoolId, yr.id);
                      setCurrentYear(active);
                      await loadSessions();
                      success(`Switched active academic session to ${yr.name}`);
                    }}
                  >
                    Set as Current
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Session Transition Batches & Reversal Safeguard */}
        {transitionBatches.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" /> Session Transition Batches & Reversibility
              </span>
            </div>

            <div className="space-y-2">
              {transitionBatches.map((batch) => (
                <div
                  key={batch.id}
                  className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    batch.status === 'reversed'
                      ? 'bg-slate-50 border-slate-200 opacity-70'
                      : 'bg-emerald-50/40 border-emerald-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {batch.source_academic_year_name} → {batch.target_academic_year_name}
                      </span>
                      {batch.status === 'completed' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          TRANSITION ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                          REVERSED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {batch.promoted_count} promoted • {batch.repeated_count} repeated • {batch.left_count} left •{' '}
                      {batch.graduated_count} graduated • Executed on {formatDate(batch.created_at)} by{' '}
                      <strong>{batch.created_by_name}</strong>
                    </p>
                  </div>

                  {batch.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="xs"
                      isLoading={isReversingBatchId === batch.id}
                      leftIcon={<RotateCcw className="w-3 h-3 text-rose-600" />}
                      className="text-rose-700 border-rose-200 hover:bg-rose-50 self-start sm:self-center"
                      onClick={() => handleReverseTransition(batch)}
                    >
                      Reverse Transition
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Account Password & Direct Login Security */}
      <UserPasswordCard />

      {/* Full Institutional Data Archive & Safety Backup Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Institutional Data Backup & Offline Export</span>
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3 h-3" /> Full Data Protection
            </span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadSchoolBackup}
            isLoading={isExporting}
            leftIcon={<Download className="w-4 h-4" />}
            className="shrink-0"
          >
            Download Complete School Backup (.JSON)
          </Button>
        </div>
      </div>

      {/* Move to New Session Multi-Step Modal */}
      <SessionTransitionModal
        isOpen={isTransitionModalOpen}
        onClose={() => setIsTransitionModalOpen(false)}
        onTransitionComplete={() => {
          loadBatches();
        }}
      />

      {/* Add Academic Year Modal */}
      <Modal
        isOpen={isYearModalOpen}
        onClose={() => setIsYearModalOpen(false)}
        title="Add Academic Session"
        description="e.g. 2027-28 (from 1st April to 31st March)"
      >
        <form onSubmit={handleCreateYear} className="space-y-4 text-left">
          <Input
            label="Session Name"
            required
            value={newYear.name}
            onChange={(e) => setNewYear({ ...newYear, name: e.target.value })}
            placeholder="e.g. 2027-28"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              required
              value={newYear.startDate}
              onChange={(e) => setNewYear({ ...newYear, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={newYear.endDate}
              onChange={(e) => setNewYear({ ...newYear, endDate: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={newYear.isCurrent}
              onChange={(e) => setNewYear({ ...newYear, isCurrent: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Set as Current Active Session immediately</span>
          </label>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsYearModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Academic Year
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditYearModalOpen}
        onClose={() => setIsEditYearModalOpen(false)}
        title="Edit Academic Session"
        description="Update the session name and its exact start and end dates."
      >
        <form onSubmit={handleEditYear} className="space-y-4 text-left">
          <Input label="Session Name" required value={editYear.name} onChange={(e) => setEditYear({ ...editYear, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" required value={editYear.startDate} onChange={(e) => setEditYear({ ...editYear, startDate: e.target.value })} />
            <Input label="End Date" type="date" required value={editYear.endDate} onChange={(e) => setEditYear({ ...editYear, endDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditYearModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
