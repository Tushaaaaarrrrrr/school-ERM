'use client';

// ============================================================================
// Multi-Child Parent Portal (Academics, Attendance, Fees, Transport & Leave)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import {
  parentService,
  studentService,
  attendanceService,
  feeService,
  receiptService,
  examService,
  leaveService,
  noticeService,
  holidayService,
  notificationService,
  schoolService,
  transportService,
} from '@/lib/services/api';
import {
  Student,
  ParentProfile,
  StudentFeeInvoice,
  PaymentReceipt,
  ExamResult,
  Exam,
  StudentLeave,
  StudentAttendance,
  Notice,
  SchoolHoliday,
  AppNotification,
  LeaveType,
  StudentTransportEvent,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { DateInput } from '@/components/ui/date-input';
import { StatusBadge, InvoiceStatusBadge } from '@/components/ui/badge';
import { FeeReceipt } from '@/components/receipt/fee-receipt';
import { SchoolStatusBoard } from '@/components/school/school-status-board';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils/formatters';
import {
  Home,
  Calendar,
  GraduationCap,
  IndianRupee,
  Bus,
  User,
  Bell,
  PhoneCall,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  HeartPulse,
  Printer,
  ChevronDown,
  Plus,
  ShieldCheck,
  Send,
  MapPin,
  HelpCircle,
  Building2,
  X,
  LogOut,
  Users,
  Check,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { CardSkeleton, TableSkeleton } from '@/components/ui/skeleton';

export default function ParentPortalPage() {
  const router = useRouter();
  const { currentUser, currentSchool, currentYear, logout } = useAuth();
  const schoolId = currentSchool?.id || '';
  const parentId = currentUser?.parent_id || '';
  const { success, error: toastError } = useToast();

  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  useEffect(() => {
    if (parentId) {
      parentService.getParentById(parentId).then((p) => {
        if (p) setParentProfile(p);
      }).catch(() => {});
    }
  }, [parentId]);

  // Navigation tab: 'home' | 'attendance' | 'academics' | 'fees' | 'transport' | 'profile'
  const [activeTab, setActiveTab] = useState<'home' | 'attendance' | 'academics' | 'fees' | 'transport' | 'profile'>('home');

  // Children State
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);

  // Selected Child Domain Data
  const [childInvoices, setChildInvoices] = useState<StudentFeeInvoice[]>([]);
  const [childReceipts, setChildReceipts] = useState<PaymentReceipt[]>([]);
  const [childLeaves, setChildLeaves] = useState<StudentLeave[]>([]);
  const [childAttendance, setChildAttendance] = useState<StudentAttendance[]>([]);
  const [childResults, setChildResults] = useState<{ exam: Exam; result: ExamResult }[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [holidays, setHolidays] = useState<SchoolHoliday[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Notifications Drawer State
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  // Leave Request Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('full_day');
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [partialStartTime, setPartialStartTime] = useState('09:00');
  const [partialEndTime, setPartialEndTime] = useState('12:30');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveNotes, setLeaveNotes] = useState('');
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Emergency Info Update Request Modal State
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyBloodGroup, setEmergencyBloodGroup] = useState('');
  const [emergencyAllergies, setEmergencyAllergies] = useState('');
  const [emergencyCondition, setEmergencyCondition] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // 1/4 A4 Printable Receipt Modal State
  const [activeReceiptModal, setActiveReceiptModal] = useState<PaymentReceipt | null>(null);

  // Today's Live Transport Boarding Event
  const [childTransportEvent, setChildTransportEvent] = useState<StudentTransportEvent | null>(null);

  // Load Children for Parent
  useEffect(() => {
    const fetchChildren = async () => {
      setIsLoadingChildren(true);
      try {
        const list = await parentService.getParentChildren(parentId, schoolId, currentUser?.email);
        setChildren(list);
        if (list.length > 0) {
          // Persist or default to first child
          const storedChild = typeof window !== 'undefined' ? localStorage.getItem('parent_selected_child_id') : null;
          const initial = list.find((c) => c.id === storedChild) || list[0];
          setSelectedChildId(initial.id);
        }
      } catch {
        toastError('Failed to load children profiles');
      } finally {
        setIsLoadingChildren(false);
      }
    };
    fetchChildren();
  }, [parentId, schoolId, currentUser?.email]);

  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0];

  // Load Child Data
  const loadChildData = async () => {
    if (!selectedChild) return;
    setIsLoadingData(true);
    try {
      const [invList, rcpList, levList, attendanceList, resList, notList, holList, notifList, transStatus] = await Promise.all([
        feeService.getInvoices(schoolId, { studentId: selectedChild.id }),
        receiptService.getReceipts(schoolId, { studentId: selectedChild.id }),
        leaveService.getLeaves(schoolId, { studentId: selectedChild.id }),
        attendanceService.getAttendance(schoolId, { studentId: selectedChild.id }),
        examService.getPublishedResultsForStudent(selectedChild.id),
        noticeService.getNotices(schoolId, { audience: 'parents' }),
        holidayService.getHolidays(schoolId),
        notificationService.getNotifications(currentUser?.id || parentId),
        transportService.getStudentTodayTransportStatus(selectedChild.id, schoolId),
      ]);

      setChildInvoices(invList);
      setChildReceipts(rcpList);
      setChildLeaves(levList);
      setChildAttendance(attendanceList);
      setChildResults(resList);
      setNotices(notList);
      setHolidays(holList);
      setNotifications(notifList);
      setChildTransportEvent(transStatus?.todayEvent || null);

      // Pre-fill emergency info
      if (selectedChild.emergency_info) {
        setEmergencyBloodGroup(selectedChild.emergency_info.blood_group || '');
        setEmergencyAllergies(selectedChild.emergency_info.allergies_alert || '');
        setEmergencyCondition(selectedChild.emergency_info.medical_condition_note || '');
        setEmergencyContactName(selectedChild.emergency_info.emergency_contact_name || '');
        setEmergencyContactPhone(selectedChild.emergency_info.emergency_contact_phone || '');
      }
    } catch {
      toastError('Failed to load student details');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (selectedChild) {
      loadChildData();
    }
  }, [selectedChild?.id, schoolId]);

  const handleSelectChild = (id: string) => {
    setSelectedChildId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('parent_selected_child_id', id);
    }
  };

  // Submit Leave Request
  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild) return;

    setIsSubmittingLeave(true);
    try {
      await leaveService.applyLeave({
        school_id: schoolId,
        student_id: selectedChild.id,
        leave_type: leaveType,
        start_date: leaveStartDate,
        end_date: leaveType === 'full_day' ? leaveEndDate : leaveStartDate,
        partial_start_time: leaveType === 'partial_day' ? partialStartTime : undefined,
        partial_end_time: leaveType === 'partial_day' ? partialEndTime : undefined,
        reason: leaveReason,
        notes: leaveNotes,
        requested_by_type: 'parent',
        requested_by_user_id: parentId,
        requested_by_name: currentUser?.name || 'Parent',
        student_name: `${selectedChild.first_name} ${selectedChild.last_name}`,
        class_name: selectedChild.current_enrollment?.class_name,
        section_name: selectedChild.current_enrollment?.section_name,
        parent_confirmation_required: false,
        status: 'pending',
      });

      success('Leave request submitted to Class Teacher & School Admin');
      setIsLeaveModalOpen(false);
      setLeaveNotes('');
      loadChildData();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Error submitting leave request');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  // Submit Emergency Info Update Request
  const handleUpdateEmergencyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild) return;

    try {
      await studentService.updateStudent(selectedChild.id, {
        emergency_info: {
          blood_group: emergencyBloodGroup,
          allergies_alert: emergencyAllergies,
          medical_condition_note: emergencyCondition,
          emergency_contact_name: emergencyContactName,
          emergency_contact_relationship: 'Parent',
          emergency_contact_phone: emergencyContactPhone,
          visible_to_teachers: true,
          visible_to_transport: selectedChild.emergency_info?.visible_to_transport || false,
          updated_at: new Date().toISOString(),
          updated_by_name: currentUser?.name || 'Parent',
        },
      });

      success('Emergency information updated successfully');
      setIsEmergencyModalOpen(false);
      loadChildData();
    } catch {
      toastError('Error updating emergency info');
    }
  };

  const handleMarkNotifRead = async (notifId: string) => {
    await notificationService.markAsRead(notifId);
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read_at: new Date().toISOString() } : n)));
  };

  // Financial calculations
  const totalBalanceDue = childInvoices.reduce(
    (sum, inv) => sum + Math.max(0, inv.final_amount - inv.paid_amount),
    0
  );

  const schoolContactPhone = currentSchool?.school_contact_phone || currentSchool?.phone;
  const schoolContactHref = schoolContactPhone ? `tel:${schoolContactPhone}` : currentSchool?.email ? `mailto:${currentSchool.email}` : undefined;
  const presentAttendanceCount = childAttendance.filter((record) => record.status === 'present').length;
  const childAttendanceRate = childAttendance.length > 0 ? (presentAttendanceCount / childAttendance.length) * 100 : null;
  const unreadNotifCount = notifications.filter((n) => !n.read_at).length;

  // Parent & Family Profile Details
  const parentName =
    parentProfile?.guardian_name ||
    selectedChild?.guardian?.guardian_name ||
    currentUser?.name ||
    'Parent / Guardian';

  const parentPhone =
    parentProfile?.primary_phone ||
    selectedChild?.guardian?.primary_phone ||
    '';

  const parentEmail =
    parentProfile?.email ||
    selectedChild?.guardian?.email ||
    currentUser?.email ||
    '';

  const parentAddress =
    parentProfile?.address ||
    selectedChild?.guardian?.address ||
    'Address on school record';

  const fatherName =
    parentProfile?.father_name ||
    selectedChild?.guardian?.father_name ||
    '';

  const motherName =
    parentProfile?.mother_name ||
    selectedChild?.guardian?.mother_name ||
    '';

  if (isLoadingChildren) {
    return (
      <div className="w-full max-w-5xl mx-auto p-8 text-left space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!selectedChild) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center bg-white rounded-2xl border border-slate-200 mt-12 space-y-3">
        <User className="w-10 h-10 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">No Linked Students Found</h2>
        <p className="text-xs text-slate-500">
          Your parent portal account is not currently linked to any student records. Please contact your school administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-[100dvh] overflow-y-auto overscroll-y-contain bg-slate-50 text-left w-full pb-16">
      {/* TOP HEADER: SCHOOL, CHILD SWITCHER & PARENT PROFILE (FULL WIDTH) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 xl:px-10 py-3 shadow-2xs w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: School Crest & Portal Tag */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
              <Building2 className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  {currentSchool?.name || 'School ERP'}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Parent Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Family & Academic Management</p>
            </div>
          </div>

          {/* Center: Child Switcher Dropdown */}
          <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-200/80 px-3 py-1.5 rounded-xl shadow-2xs">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {selectedChild.first_name[0]}
            </div>
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block leading-none">
                Active Student
              </span>
              <div className="relative inline-block mt-0.5">
                <select
                  value={selectedChildId}
                  onChange={(e) => handleSelectChild(e.target.value)}
                  className="appearance-none bg-transparent text-indigo-950 text-xs font-extrabold pr-6 outline-none cursor-pointer focus:ring-0"
                >
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} ({c.current_enrollment?.class_name || 'Class'}{' '}
                      {c.current_enrollment?.section_name ? `-${c.current_enrollment.section_name}` : ''})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-indigo-700 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Right: Quick Actions + Parent Profile Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={schoolContactHref}
              aria-disabled={!schoolContactHref}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold shadow-2xs transition-all"
              title="Call or email school administration"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Contact School</span>
            </a>

            <button
              onClick={() => setIsNotifDrawerOpen(true)}
              className="relative p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Parent Profile Badge */}
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
            <div className="flex items-center gap-2 pl-1">
              <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                {parentName.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden lg:flex flex-col text-left leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{parentName}</span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">
                    Guardian
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">{parentPhone || parentEmail}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Minimal Navigation Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 mt-2 border-t border-slate-100 scrollbar-none text-xs font-semibold">
          {[
            { id: 'home', label: 'Home Overview', icon: Home },
            { id: 'attendance', label: 'Attendance & Leaves', icon: Calendar },
            { id: 'academics', label: 'Academics & Reports', icon: GraduationCap },
            { id: 'fees', label: 'Fees & Receipts', icon: IndianRupee },
            { id: 'transport', label: 'Bus & Transport', icon: Bus },
            { id: 'profile', label: 'Family & Medical Profile', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6">
        {/* TAB 1: HOME DASHBOARD */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* HERO SECTION: DUAL-CARD (ACTIVE STUDENT + PARENT PROFILE) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Card: Active Student Profile (7 cols) */}
              <div className="lg:col-span-7 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-sm border border-indigo-800/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-indigo-800/50">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                        Active Student
                      </span>
                      <span className="text-xs text-indigo-300 font-medium">
                        {currentYear?.name || 'Academic Session'}
                      </span>
                    </div>
                    {children.length > 1 && (
                      <span className="text-[11px] text-indigo-300 font-medium">
                        {children.length} Siblings Enrolled
                      </span>
                    )}
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-indigo-950 border-2 border-indigo-400/30 shrink-0 shadow-md">
                      {selectedChild.photo_url ? (
                        <img src={selectedChild.photo_url} alt={selectedChild.first_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-extrabold text-xl text-indigo-200">
                          {selectedChild.first_name[0]}
                          {selectedChild.last_name[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                        {selectedChild.first_name} {selectedChild.last_name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-white text-xs font-bold border border-white/10">
                          Class {selectedChild.current_enrollment?.class_name || '—'} • Section {selectedChild.current_enrollment?.section_name || 'A'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 text-xs font-semibold">
                          Roll #{selectedChild.current_enrollment?.roll_number || '01'}
                        </span>
                        {selectedChild.registration_number && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 text-xs font-mono">
                            Reg: {selectedChild.registration_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-indigo-800/50 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-indigo-200 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Official school enrollment active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold"
                      onClick={() => setIsLeaveModalOpen(true)}
                    >
                      Request Leave
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Card: Parent & Guardian Profile (5 cols) */}
              <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-bold text-slate-900 text-sm">Parent & Guardian Profile</h3>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Check className="w-3 h-3 text-emerald-600" /> Verified Record
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 font-extrabold text-sm flex items-center justify-center shrink-0">
                        {parentName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-sm truncate">{parentName}</p>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded shrink-0">
                            Primary Guardian
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{parentPhone || 'No phone recorded'}</p>
                      </div>
                      {parentPhone && (
                        <a
                          href={`tel:${parentPhone.replace(/\s+/g, '')}`}
                          className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                          title="Call Guardian Phone"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Email Address</span>
                        <span className="font-medium text-slate-800 truncate block mt-0.5" title={parentEmail}>
                          {parentEmail || 'On school file'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Family Residence</span>
                        <span className="font-medium text-slate-800 truncate block mt-0.5" title={parentAddress}>
                          {parentAddress || 'On school file'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Emergency contacts verified</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<HeartPulse className="w-3.5 h-3.5 text-rose-600" />}
                    onClick={() => setIsEmergencyModalOpen(true)}
                  >
                    Update Info
                  </Button>
                </div>
              </div>
            </div>

            {/* Live School Operational Status Board */}
            <SchoolStatusBoard />

            {/* 4 Summary KPI Cards (Responsive Grid) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => setActiveTab('attendance')}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Attendance Rate</span>
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2 block">
                  {childAttendanceRate === null ? 'No data' : `${childAttendanceRate.toFixed(1)}%`}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {presentAttendanceCount} present of {childAttendance.length} days
                </span>
              </div>

              <div
                onClick={() => setActiveTab('fees')}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Fee Status</span>
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100 transition-colors">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold mt-2 block">
                  {totalBalanceDue > 0 ? (
                    <span className="text-rose-600">{formatCurrency(totalBalanceDue)}</span>
                  ) : (
                    <span className="text-emerald-700">All Paid</span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {totalBalanceDue > 0 ? 'Pending dues balance' : 'No balance due'}
                </span>
              </div>

              <div
                onClick={() => setActiveTab('transport')}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Transport</span>
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-100 transition-colors">
                    <Bus className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-base sm:text-lg font-bold text-indigo-900 mt-2 block truncate">
                  {selectedChild.transport_assignment?.vehicle_name || 'Not assigned'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block truncate">
                  {selectedChild.transport_assignment?.stop_name ? `Stop: ${selectedChild.transport_assignment.stop_name}` : 'No transport assignment'}
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Next Holiday</span>
                  <div className="p-1.5 rounded-lg bg-slate-50 text-slate-600">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-base sm:text-lg font-bold text-slate-900 mt-2 block truncate">
                  {holidays[0]?.name || 'Regular Schedule'}
                </span>
                <span className="text-[11px] text-indigo-600 font-semibold mt-1 block">
                  {holidays[0]?.start_date ? formatDate(holidays[0].start_date) : 'No upcoming holiday'}
                </span>
              </div>
            </div>

            {/* School Notices for Parents */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" /> School Notices & Updates
                </h3>
                <span className="text-[11px] text-slate-400 font-semibold">{notices.length} Active</span>
              </div>

              <div className="divide-y divide-slate-100">
                {notices.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No active school notices for parents at this time.</p>
                ) : (
                  notices.map((n) => (
                    <div key={n.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                        <span className="text-[10px] text-slate-400">{formatDate(n.starts_at)}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDANCE & LEAVES */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Student Attendance & Leave Requests</h2>
                <p className="text-xs text-slate-500">Submit planned leaves and review monthly attendance logs</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsLeaveModalOpen(true)}
              >
                Request Leave
              </Button>
            </div>

            {/* Leave History Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Submitted Leave Requests</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Leave Dates</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Requested By</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {childLeaves.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No leave requests recorded for {selectedChild.first_name}.
                        </td>
                      </tr>
                    ) : (
                      childLeaves.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/75">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {formatDate(l.start_date)}
                            {l.end_date !== l.start_date && ` to ${formatDate(l.end_date)}`}
                          </td>
                          <td className="py-3 px-4 capitalize text-slate-600">
                            {l.leave_type.replace('_', ' ')}
                            {l.partial_start_time && (
                              <span className="block text-[10px] text-slate-400">
                                {l.partial_start_time} - {l.partial_end_time}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {l.reason}
                            {l.rejection_reason && (
                              <span className="block text-[10px] text-rose-600 font-semibold mt-0.5">
                                Reason: {l.rejection_reason}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 capitalize">{l.requested_by_type || 'Parent'}</td>
                          <td className="py-3 px-4 text-center">
                            {l.status === 'approved' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                APPROVED
                              </span>
                            )}
                            {l.status === 'pending' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                PENDING REVIEW
                              </span>
                            )}
                            {l.status === 'rejected' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                REJECTED
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACADEMICS & EXAM RESULTS */}
        {activeTab === 'academics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Academic Performance & Published Report Cards</h2>
              <p className="text-xs text-slate-500">Term examinations and subject scores for {selectedChild.first_name}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {childResults.length === 0 ? (
                <div className="col-span-2 bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-400">
                  <GraduationCap className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">No exam results published for the current academic cycle yet.</p>
                </div>
              ) : (
                childResults.map(({ exam, result: r }) => {
                  const marks = r.marks_obtained || 0;
                  const max = exam?.max_marks || 100;
                  const pct = Math.round((marks / max) * 100);
                  return (
                    <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{exam?.name || 'Exam name unavailable'}</h4>
                          <span className="text-[11px] text-indigo-700 font-semibold">{exam?.subject_name || 'Subject unavailable'}</span>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            pct >= 80 ? 'bg-emerald-100 text-emerald-700' : pct >= 50 ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {pct}% Grade
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1 pt-1 border-t border-slate-100">
                        <span className="text-2xl font-extrabold text-slate-900">{marks}</span>
                        <span className="text-xs text-slate-400 font-bold">/ {max} marks</span>
                      </div>

                      {r.remarks && <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg">&ldquo;{r.remarks}&rdquo;</p>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: FEES & 1/4 A4 RECEIPTS */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Fees, Statements & Official Receipts</h2>
              <p className="text-xs text-slate-500">Download and print official 1/4 A4 fee receipts</p>
            </div>

            {/* Invoices Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Tuition Invoices</h3>
                <span className="text-xs font-bold text-slate-700">
                  Total Outstanding: <strong className="text-rose-600">{formatCurrency(totalBalanceDue)}</strong>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Billing Cycle</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-right">Invoiced</th>
                      <th className="py-3 px-4 text-right">Paid</th>
                      <th className="py-3 px-4 text-right">Remaining</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {childInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-3 px-4 font-bold text-slate-900">{inv.billing_month}</td>
                        <td className="py-3 px-4 text-slate-500">{formatDate(inv.due_date)}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(inv.final_amount)}</td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-semibold">{formatCurrency(inv.paid_amount)}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(inv.final_amount - inv.paid_amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <InvoiceStatusBadge status={inv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Receipts History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Official Payment Receipts (1/4 A4 Printable)
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Receipt Number</th>
                      <th className="py-3 px-4">Payment Date</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4 text-right">Amount Paid</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {childReceipts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No payment receipts generated for {selectedChild.first_name} yet.
                        </td>
                      </tr>
                    ) : (
                      childReceipts.map((rcp) => (
                        <tr key={rcp.id} className="hover:bg-slate-50/75">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600">{rcp.receipt_number}</td>
                          <td className="py-3 px-4 text-slate-500">{formatDate(rcp.payment_date || rcp.created_at)}</td>
                          <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-600">{rcp.payment_method}</td>
                          <td className="py-3 px-4 text-right font-extrabold text-slate-900">{formatCurrency(rcp.amount_paid)}</td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="outline"
                              size="xs"
                              leftIcon={<Printer className="w-3 h-3" />}
                              onClick={() => setActiveReceiptModal(rcp)}
                            >
                              Download / Print
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TRANSPORT */}
        {activeTab === 'transport' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Transport & School Bus Route</h2>
              <p className="text-xs text-slate-500">Live pickup status, vehicle details, and certified driver contact</p>
            </div>

            {selectedChild.transport_assignment ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                      <Bus className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {selectedChild.transport_assignment.vehicle_name || 'School Bus'}
                      </h3>
                      <span className="text-xs text-slate-500 font-mono">
                        Plate / Reg: {selectedChild.transport_assignment.vehicle_number || '—'}
                      </span>
                    </div>
                  </div>

                  <div>
                    {childTransportEvent?.event_type === 'picked_up' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Picked Up ({formatTime(childTransportEvent.event_time)})
                      </span>
                    ) : childTransportEvent?.event_type === 'not_riding' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        Not Riding Today
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Pickup Pending (Expected {formatTime(selectedChild.transport_assignment.estimated_pickup_time || '07:20 AM')})
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-indigo-500" /> City / Zone
                    </span>
                    <span className="font-bold text-indigo-700 text-sm block">
                      {selectedChild.transport_assignment.city || 'Kolodihari'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Route: {selectedChild.transport_assignment.route_name || 'Main Route'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-indigo-500" /> Pickup Point
                    </span>
                    <span className="font-bold text-slate-900 text-sm block truncate">
                      {selectedChild.transport_assignment.stop_name || 'Designated Stop'}
                    </span>
                    <span className="text-[11px] text-indigo-600 font-medium block">
                      Pickup Time: {formatTime(selectedChild.transport_assignment.estimated_pickup_time || '07:20 AM')}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
                      <User className="w-3 h-3 text-indigo-500" /> Assigned Driver
                    </span>
                    <span className="font-bold text-slate-900 text-sm block capitalize truncate">
                      {selectedChild.transport_assignment.driver_name || 'Assigned Driver'}
                    </span>
                    {selectedChild.transport_assignment.driver_phone ? (
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[11px] font-mono text-slate-500">
                          {selectedChild.transport_assignment.driver_phone}
                        </span>
                        <a
                          href={`tel:${selectedChild.transport_assignment.driver_phone.replace(/\s+/g, '')}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition-colors shadow-2xs"
                        >
                          <PhoneCall className="w-2.5 h-2.5" /> Call
                        </a>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">Driver contact on file</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
                <Bus className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No transport route assigned for {selectedChild.first_name}.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: PROFILE & MEDICAL / EMERGENCY */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Parent & Student Family Registry</h2>
                <p className="text-xs text-slate-500">Official guardian contacts, residential records, and student emergency health info</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<HeartPulse className="w-4 h-4 text-rose-600" />}
                onClick={() => setIsEmergencyModalOpen(true)}
              >
                Update Emergency Info
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Official Parent & Guardian Information */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Parent & Guardian Information</h3>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Family Registry
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Primary Guardian</span>
                      <span className="font-extrabold text-slate-900 text-sm block mt-0.5">{parentName}</span>
                      <span className="text-[10px] text-indigo-600 font-semibold mt-0.5 block">Authorized Legal Guardian</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Phone</span>
                      <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">{parentPhone || 'Not recorded'}</span>
                      {parentPhone && (
                        <a href={`tel:${parentPhone.replace(/\s+/g, '')}`} className="text-[10px] text-emerald-700 font-semibold hover:underline mt-0.5 inline-block">
                          Click to Call
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Email Address</span>
                      <span className="font-semibold text-slate-900 truncate block mt-0.5">{parentEmail || 'Not recorded'}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Secondary Phone</span>
                      <span className="font-mono font-semibold text-slate-900 block mt-0.5">
                        {parentProfile?.secondary_phone || selectedChild.guardian?.secondary_phone || 'None recorded'}
                      </span>
                    </div>
                  </div>

                  {(fatherName || motherName) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {fatherName && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Father&apos;s Name</span>
                          <span className="font-semibold text-slate-900 block mt-0.5">{fatherName}</span>
                        </div>
                      )}
                      {motherName && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Mother&apos;s Name</span>
                          <span className="font-semibold text-slate-900 block mt-0.5">{motherName}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Residential Address</span>
                    <span className="font-medium text-slate-800 block mt-0.5 leading-relaxed">{parentAddress || 'On school file'}</span>
                  </div>

                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 block">Enrolled Children</span>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {children.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectChild(c.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            c.id === selectedChild.id
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {c.first_name} {c.last_name} ({c.current_enrollment?.class_name || 'Class'})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Student Emergency & Medical Record */}
              <div className="bg-rose-50/40 p-6 rounded-2xl border border-rose-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-rose-200/60">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-rose-600" />
                      <h3 className="font-bold text-rose-950 text-sm">Student Emergency & Medical Profile</h3>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      {selectedChild.first_name}&apos;s Record
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mt-3.5">
                    <div className="p-3 bg-white/80 rounded-xl border border-rose-100">
                      <span className="text-rose-700 font-bold uppercase text-[10px] block">Blood Group</span>
                      <span className="font-extrabold text-slate-900 text-lg block mt-0.5">
                        {selectedChild.emergency_info?.blood_group || 'Not recorded'}
                      </span>
                    </div>

                    <div className="sm:col-span-2 p-3 bg-white/80 rounded-xl border border-rose-100">
                      <span className="text-rose-700 font-bold uppercase text-[10px] block">Known Allergy Alert</span>
                      <span className="font-semibold text-slate-900 text-xs block mt-0.5">
                        {selectedChild.emergency_info?.allergies_alert || 'No known allergies reported'}
                      </span>
                    </div>

                    <div className="sm:col-span-3 p-3 bg-white/80 rounded-xl border border-rose-100">
                      <span className="text-rose-700 font-bold uppercase text-[10px] block">Emergency & Medical Notes</span>
                      <span className="font-medium text-slate-700 text-xs block mt-0.5 leading-relaxed">
                        {selectedChild.emergency_info?.medical_condition_note || 'No special medical conditions noted'}
                      </span>
                    </div>

                    <div className="sm:col-span-2 p-3 bg-white/80 rounded-xl border border-rose-100">
                      <span className="text-rose-700 font-bold uppercase text-[10px] block">Emergency Contact Person</span>
                      <span className="font-bold text-slate-900 text-sm block mt-0.5">
                        {selectedChild.emergency_info?.emergency_contact_name || selectedChild.guardian?.guardian_name || parentName} (
                        {selectedChild.emergency_info?.emergency_contact_relationship || 'Parent'})
                      </span>
                      <span className="block font-mono text-slate-600 mt-0.5">
                        {selectedChild.emergency_info?.emergency_contact_phone || selectedChild.guardian?.primary_phone || parentPhone}
                      </span>
                    </div>

                    <div className="p-3 bg-white/80 rounded-xl border border-rose-100">
                      <span className="text-rose-700 font-bold uppercase text-[10px] block">Doctor / Clinic</span>
                      <span className="text-slate-800 font-semibold block mt-0.5">
                        {selectedChild.emergency_info?.doctor_clinic_contact || 'None specified'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-rose-200/60 flex items-center justify-between gap-2 mt-4">
                  <span className="text-[11px] text-rose-800 font-medium">Visible to verified school staff & teachers</span>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<HeartPulse className="w-3.5 h-3.5 text-rose-600" />}
                    onClick={() => setIsEmergencyModalOpen(true)}
                  >
                    Edit Medical Info
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NOTIFICATIONS DRAWER */}
      {isNotifDrawerOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsNotifDrawerOpen(false)}
          title="Parent Notifications Center"
          description="Real-time bus boarding updates, leave approvals, and fee reminders"
        >
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No notifications at this time.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkNotifRead(n.id)}
                  className={`p-3.5 rounded-xl border transition-colors cursor-pointer text-left ${
                    n.read_at ? 'bg-slate-50/70 border-slate-200' : 'bg-indigo-50/50 border-indigo-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                    <span className="text-[10px] text-slate-400">{formatDate(n.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* REQUEST LEAVE MODAL */}
      {isLeaveModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsLeaveModalOpen(false)}
          title={`Request Leave for ${selectedChild.first_name}`}
          description="Submit a planned leave request to the Class Teacher and School Administration"
        >
          <form onSubmit={handleSubmitLeave} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Leave Type *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                >
                  <option value="full_day">Full Day Leave</option>
                  <option value="partial_day">Partial Day (Few Hours)</option>
                </select>
              </div>

              <div>
                <DateInput
                  label="Start Date"
                  required
                  value={leaveStartDate}
                  onChange={(e) => setLeaveStartDate(e.target.value)}
                  className="text-xs font-semibold"
                />
              </div>
            </div>

            {leaveType === 'full_day' && (
              <div>
                <DateInput
                  label="End Date"
                  required
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  className="text-xs font-semibold"
                />
              </div>
            )}

            {leaveType === 'partial_day' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={partialStartTime}
                    onChange={(e) => setPartialStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={partialEndTime}
                    onChange={(e) => setPartialEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason *</label>
              <select
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
              >
                <option value="Family Function">Family Function / Wedding</option>
                <option value="Illness / Medical Appointment">Illness / Medical Appointment</option>
                <option value="Travel / Out of Station">Travel / Out of Station</option>
                <option value="Personal / Urgent Work">Personal / Urgent Work</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Additional Notes</label>
              <textarea
                rows={3}
                placeholder="Optional notes or details for class teacher..."
                value={leaveNotes}
                onChange={(e) => setLeaveNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsLeaveModalOpen(false)}
                disabled={isSubmittingLeave}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingLeave}>
                Submit Leave Request
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* UPDATE EMERGENCY INFO MODAL */}
      {isEmergencyModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsEmergencyModalOpen(false)}
          title={`Emergency Information: ${selectedChild.first_name}`}
          description="Update safety-relevant medical alerts and emergency contacts"
        >
          <form onSubmit={handleUpdateEmergencyInfo} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={emergencyBloodGroup}
                  onChange={(e) => setEmergencyBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Name *</label>
              <input
                type="text"
                required
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Known Allergies / Emergency Alerts</label>
              <input
                type="text"
                placeholder="e.g. Peanut allergy, Asthma inhaler carried in bag..."
                value={emergencyAllergies}
                onChange={(e) => setEmergencyAllergies(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Important Medical Note</label>
              <textarea
                rows={2}
                placeholder="Details of any condition required for student safety..."
                value={emergencyCondition}
                onChange={(e) => setEmergencyCondition(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEmergencyModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Emergency Info
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 1/4 A4 PRINTABLE RECEIPT MODAL */}
      {activeReceiptModal && (
        <Modal
          isOpen={true}
          onClose={() => setActiveReceiptModal(null)}
          title="Official School Fee Receipt"
          description={`Receipt ${activeReceiptModal.receipt_number} • 1/4 A4 Printable Size`}
          maxWidth="lg"
        >
          <div className="flex justify-center">
            <FeeReceipt
              receipt={activeReceiptModal}
              onClose={() => setActiveReceiptModal(null)}
              showActions={true}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
