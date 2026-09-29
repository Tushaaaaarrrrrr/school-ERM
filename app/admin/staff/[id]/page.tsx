'use client';

// ============================================================================
// Staff Member Profile Page (Overview, Salary History, Payments & Portal Toggle)
// ============================================================================

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  staffService,
  payrollService,
  authLogService,
  salaryAdjustmentService,
  temporaryAssignmentService,
  transportService,
} from '@/lib/services/api';
import {
  Staff,
  EmployeeSalaryHistory,
  EmployeePayment,
  StaffPermission,
  AuthEvent,
  EmployeeSalaryAdjustment,
  TemporaryAssignment,
  Vehicle,
  TransportRoute,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/modal';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { SalaryAdjustmentModal } from '@/components/payroll/salary-adjustment-modal';
import { TemporaryAssignmentModal } from '@/components/payroll/temporary-assignment-modal';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/context/auth-context';
import {
  ArrowLeft,
  Users,
  IndianRupee,
  CalendarCheck,
  Phone,
  Mail,
  Calendar,
  KeyRound,
  Edit3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Briefcase,
  Building,
  CheckSquare,
  Square,
  Truck,
  UserX,
  UserCheck,
  PlusCircle,
  MinusCircle,
  Calculator,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { CardSkeleton } from '@/components/ui/skeleton';

const ALL_PERMISSIONS: { key: StaffPermission; label: string; description: string }[] = [
  { key: 'view_fees', label: 'View Fee Invoices', description: 'Can search and view student fee statements' },
  { key: 'record_student_payment', label: 'Record Fee Payments', description: 'Can collect fee receipts and mark invoices as paid' },
  { key: 'view_teacher_payments', label: 'View Faculty Salaries', description: 'Can view monthly teacher disbursement statements' },
  { key: 'view_payroll', label: 'View Employee Payroll', description: 'Can browse full staff compensation and payroll lists' },
  { key: 'manage_payroll', label: 'Disburse Payroll', description: 'Can record salary payments for staff and faculty' },
  { key: 'view_students', label: 'View Student Directory', description: 'Can browse student enrollment lists and basic records' },
  { key: 'create_student', label: 'Register New Students', description: 'Can fill out and submit new student admissions' },
  { key: 'edit_student', label: 'Edit Student Details', description: 'Can update student contacts and records' },
  { key: 'view_parent_contact', label: 'View Parent Contacts', description: 'Can view parent phone numbers and addresses' },
  { key: 'manage_attendance', label: 'Manage Attendance', description: 'Can view and record daily attendance rosters' },
  { key: 'manage_transport', label: 'Manage Transport', description: 'Can assign buses, routes, and manage fleets' },
  { key: 'record_pickup', label: 'Record Student Pickup', description: 'Can log bus boarding / drop-off status' },
  { key: 'view_notices', label: 'View Notice Board', description: 'Can read school announcements and circulars' },
  { key: 'manage_inventory', label: 'Manage School Inventory', description: 'Can log library books or asset allocations' },
];

export default function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [staff, setStaff] = useState<Staff | null>(null);
  const [salaryHistory, setSalaryHistory] = useState<EmployeeSalaryHistory[]>([]);
  const [payments, setPayments] = useState<EmployeePayment[]>([]);
  const [adjustments, setAdjustments] = useState<EmployeeSalaryAdjustment[]>([]);
  const [temporaryAssignments, setTemporaryAssignments] = useState<TemporaryAssignment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuthEvent[]>([]);
  const [assignedVehicle, setAssignedVehicle] = useState<Vehicle | null>(null);
  const [assignedRoute, setAssignedRoute] = useState<TransportRoute | null>(null);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'permissions' | 'payments' | 'adjustments' | 'coverage' | 'salary_history' | 'account' | 'history'
  >('overview');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isAssignCoverageModalOpen, setIsAssignCoverageModalOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<StaffPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Staff Form
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    employeeNumber: '',
    joiningDate: '',
    photoUrl: '',
    portalAccess: false,
    licenseNumber: '',
    licenseExpiry: '',
    status: 'active' as Staff['status'],
  });

  // Salary Update Form
  const [salaryForm, setSalaryForm] = useState({
    newSalary: 20000,
    effectiveFrom: new Date().toISOString().split('T')[0],
    reason: 'Annual Increment',
  });

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const s = await staffService.getStaffById(resolvedParams.id);
      if (s) {
        setStaff(s);
        setSelectedPermissions(s.permissions || []);
        const [salHist, pmtList, logs, adjList, asgList, vehList, rtList] = await Promise.all([
          staffService.getStaffSalaryHistory(s.id),
          payrollService.getEmployeePayments(s.school_id, { employeeType: 'staff' }),
          authLogService.getEvents({ schoolId: s.school_id, limit: 100 }),
          salaryAdjustmentService.getAdjustments(s.school_id, { employeeId: s.id }),
          temporaryAssignmentService.getAssignments(s.school_id),
          s.staff_type === 'driver' ? transportService.getVehicles(s.school_id) : Promise.resolve([]),
          s.staff_type === 'driver' ? transportService.getRoutes(s.school_id) : Promise.resolve([]),
        ]);

        const matchedVeh = vehList.find((v: any) => 
          v.driver_id === s.id || 
          v.driver_id === s.email || 
          v.driver_id === s.employee_number ||
          (v.driver_name && v.driver_name.toLowerCase().trim() === `${s.first_name} ${s.last_name}`.toLowerCase().trim())
        ) || null;
        setAssignedVehicle(matchedVeh);

        const matchedRt = matchedVeh ? rtList.find((r: any) => r.assigned_vehicle_id === matchedVeh.id || r.vehicle_id === matchedVeh.id) || null : null;
        setAssignedRoute(matchedRt);

        setSalaryHistory(salHist);
        setPayments(pmtList.filter((p) => p.employee_id === s.id));
        setAuditLogs(logs.filter((l) => l.user_id === s.id || l.details?.staffName?.toString().includes(s.first_name)));
        setAdjustments(adjList);
        setTemporaryAssignments(
          asgList.filter((a) => a.absent_employee_id === s.id || a.replacement_employee_id === s.id)
        );

        setEditForm({
          firstName: s.first_name,
          lastName: s.last_name,
          email: s.email,
          phone: s.phone,
          department: s.department || '',
          employeeNumber: s.employee_number || '',
          joiningDate: s.joining_date,
          photoUrl: s.photo_url || '',
          portalAccess: s.portal_access ?? false,
          licenseNumber: s.license_number || '',
          licenseExpiry: s.license_expiry || '',
          status: s.status,
        });

        setSalaryForm({
          newSalary: s.salary || 20000,
          effectiveFrom: new Date().toISOString().split('T')[0],
          reason: 'Annual Increment',
        });
      }
    } catch {
      toastError('Failed to load staff profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdjustment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this salary adjustment?')) return;
    try {
      await salaryAdjustmentService.deleteAdjustment(id, currentUser || undefined);
      success('Salary adjustment deleted successfully');
      loadProfile();
    } catch {
      toastError('Failed to delete salary adjustment');
    }
  };

  const handleUpdateAssignmentStatus = async (id: string, status: TemporaryAssignment['status']) => {
    try {
      await temporaryAssignmentService.updateAssignment(id, { status }, currentUser || undefined);
      success(`Temporary assignment status marked as ${status}`);
      loadProfile();
    } catch {
      toastError('Failed to update assignment status');
    }
  };

  useEffect(() => {
    loadProfile();
  }, [resolvedParams.id]);

  const calculateTenure = (joiningDate: string) => {
    try {
      const start = new Date(joiningDate);
      const now = new Date();
      const years = now.getFullYear() - start.getFullYear();
      const months = now.getMonth() - start.getMonth();
      const totalMonths = years * 12 + months;
      const y = Math.floor(totalMonths / 12);
      const m = totalMonths % 12;

      if (y > 0 && m > 0) return `${y} years, ${m} months with school`;
      if (y > 0) return `${y} years with school`;
      return `${Math.max(1, m)} months with school`;
    } catch {
      return 'Staff Member';
    }
  };

  const handleSaveStaffEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;

    try {
      await staffService.updateStaff(
        staff.id,
        {
          first_name: editForm.firstName,
          last_name: editForm.lastName,
          email: editForm.email,
          phone: editForm.phone,
          department: editForm.department,
          employee_number: editForm.employeeNumber,
          joining_date: editForm.joiningDate,
          photo_url: editForm.photoUrl,
          portal_access: editForm.portalAccess,
          license_number: editForm.licenseNumber,
          license_expiry: editForm.licenseExpiry,
          status: editForm.status,
        },
        currentUser?.id,
        currentUser?.name
      );

      success('Employee profile updated successfully');
      setIsEditModalOpen(false);
      loadProfile();
    } catch {
      toastError('Failed to update staff profile');
    }
  };

  const handleUpdateSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;

    try {
      await staffService.updateStaffSalary(
        staff.id,
        salaryForm.newSalary,
        salaryForm.effectiveFrom,
        salaryForm.reason,
        currentUser?.id,
        currentUser?.name
      );

      success('Employee salary updated and history record preserved');
      setIsSalaryModalOpen(false);
      loadProfile();
    } catch {
      toastError('Failed to update salary');
    }
  };

  const handleSavePermissions = async () => {
    if (!staff) return;
    try {
      await staffService.updateStaffPermissions(staff.id, selectedPermissions, currentUser?.name);
      success('Staff permissions updated successfully');
      loadProfile();
    } catch {
      toastError('Failed to update permissions');
    }
  };

  const handleTogglePortalAccess = async () => {
    if (!staff) return;
    try {
      const nextVal = !staff.portal_access;
      await staffService.togglePortalAccess(staff.id, nextVal, currentUser?.name);
      success(`Portal access ${nextVal ? 'ENABLED' : 'DISABLED'} for ${staff.first_name}`);
      loadProfile();
    } catch {
      toastError('Failed to toggle portal access');
    }
  };

  const handleToggleStaffStatus = async () => {
    if (!staff) return;
    const nextStatus: Staff['status'] = staff.status === 'active' ? 'inactive' : 'active';
    try {
      await staffService.updateStaff(
        staff.id,
        {
          status: nextStatus,
          portal_access: nextStatus === 'active' ? staff.portal_access : false,
        },
        currentUser?.id,
        currentUser?.name
      );
      success(
        nextStatus === 'inactive'
          ? `Staff member "${staff.first_name} ${staff.last_name}" deactivated. Portal access is disabled while payroll records remain intact.`
          : `Staff member "${staff.first_name} ${staff.last_name}" restored to Active status.`
      );
      loadProfile();
    } catch {
      toastError('Failed to change staff status');
    }
  };

  if (isLoading || !staff) {
    return (
      <div className="p-6 space-y-6">
        <CardSkeleton />
      </div>
    );
  }

  const totalPaidThisYear = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter((p) => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 text-left w-full">
      {/* Back Link */}
      <Link
        href="/admin/staff"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Staff Directory
      </Link>

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 w-full overflow-hidden">
        <div className="flex items-center gap-4 min-w-0">
          {/* Avatar */}
          <div className="relative group shrink-0">
            {staff.photo_url ? (
              <img
                src={staff.photo_url}
                alt={`${staff.first_name} ${staff.last_name}`}
                className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl font-bold shadow-2xs">
                {staff.first_name?.[0] || 'S'}
                {staff.last_name?.[0] || ''}
              </div>
            )}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute -bottom-1 -right-1 p-1 sm:p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 shadow-xs transition-colors"
              title="Change Photo"
            >
              <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* Full Name & Role */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                {staff.first_name} {staff.last_name}
              </h1>
              <StatusBadge status={staff.status} />
            </div>
            <p className="text-sm font-semibold text-slate-500 capitalize mt-0.5">
              {staff.custom_staff_type || staff.staff_type.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Quick Actions (Full width 2-column grid on mobile, row on desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAdjustmentModalOpen(true)}
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
            className="w-full sm:w-auto justify-center text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Record Salary Adjustment
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAssignCoverageModalOpen(true)}
            leftIcon={<UserCheck className="w-3.5 h-3.5 text-indigo-600" />}
            className="w-full sm:w-auto justify-center text-xs font-semibold"
          >
            Assign Coverage
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="w-full sm:w-auto justify-center text-xs font-semibold"
            leftIcon={<Edit3 className="w-3.5 h-3.5 text-slate-500" />}
          >
            Edit Details
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSalaryModalOpen(true)}
            className="w-full sm:w-auto justify-center text-xs font-semibold"
            leftIcon={<TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Update Base Salary
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTogglePortalAccess}
            className="w-full sm:w-auto justify-center text-xs font-semibold"
            leftIcon={<Shield className="w-3.5 h-3.5 text-indigo-600" />}
          >
            {staff.portal_access ? 'Disable Portal' : 'Enable Portal'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStaffStatus}
            className={`w-full sm:w-auto justify-center text-xs font-semibold ${
              staff.status === 'active'
                ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200'
                : 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200'
            }`}
            leftIcon={
              staff.status === 'active' ? (
                <UserX className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              )
            }
          >
            {staff.status === 'active' ? 'Deactivate Employee' : 'Activate Employee'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview' },
          ...(staff.portal_access ? [{ id: 'permissions', label: 'Portal Permissions' }] : []),
          { id: 'payments', label: 'Payments' },
          { id: 'adjustments', label: `Salary Adjustments (${adjustments.length})` },
          { id: 'coverage', label: `Temporary Coverage (${temporaryAssignments.length})` },
          { id: 'salary_history', label: 'Salary Revisions' },
          ...(staff.portal_access ? [{ id: 'account', label: 'Account Access' }] : []),
          { id: 'history', label: 'Audit History' },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
      />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
              <Users className="w-4 h-4" /> Employee Record
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Full Name</span>
                <span className="font-semibold text-slate-800">{staff.first_name} {staff.last_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Designation</span>
                <span className="font-semibold text-slate-800 capitalize">{staff.custom_staff_type || staff.staff_type.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Department</span>
                <span className="font-semibold text-slate-800">{staff.department || 'General Administration'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Employee ID</span>
                <span className="font-mono font-semibold text-slate-800">{staff.employee_number || 'Not assigned'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Joining Date</span>
                <span className="font-semibold text-slate-800">{formatDate(staff.joining_date)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Current Salary</span>
                <span className="font-semibold text-emerald-700">{formatCurrency(staff.salary || 20000)} / month</span>
              </div>
              <div>
                <span className="text-slate-400 block">Institutional Email</span>
                <span className="font-semibold text-slate-800">{staff.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Contact Phone</span>
                <span className="font-semibold text-slate-800 font-mono">{staff.phone}</span>
              </div>
            </div>
          </div>

          {/* Transport / Driver Specific Card */}
          {staff.staff_type === 'driver' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Driver License & Vehicle
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Driving License No</span>
                  <span className="font-mono font-semibold text-slate-800">{staff.license_number || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">License Expiry</span>
                  <span className="font-semibold text-slate-800">{staff.license_expiry ? formatDate(staff.license_expiry) : 'Not specified'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Assigned Fleet Assignment</span>
                  {assignedVehicle ? (
                    <div className="mt-1 flex items-center gap-2 text-indigo-700 font-semibold">
                      <span>{assignedVehicle.vehicle_name} ({assignedVehicle.vehicle_number})</span>
                      {assignedRoute && (
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                          {assignedRoute.route_name}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-slate-400 italic">No vehicle assigned yet</span>
                      <Link
                        href="/admin/transport"
                        className="text-indigo-600 hover:text-indigo-700 font-semibold underline text-xs ml-2"
                      >
                        Assign in Fleet Manager →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Portal Access Status */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Software Portal Access
            </h3>
            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                {staff.portal_access
                  ? 'Portal software access is enabled. This employee can log in using their registered Google or email account to perform authorized operational tasks.'
                  : 'Portal software access is disabled. This person exists in the ERP for employment, payroll, and contact records only.'}
              </p>
              <div className="pt-2">
                <Button size="sm" variant="outline" onClick={handleTogglePortalAccess}>
                  {staff.portal_access ? 'Turn Portal Access Off' : 'Enable Portal Access'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERMISSIONS */}
      {activeTab === 'permissions' && staff.portal_access && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Assigned Operational Permissions</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                School Admin can customize access boundaries for this specific staff account.
              </p>
            </div>
            <Button size="sm" variant="primary" onClick={handleSavePermissions}>
              Save Permissions
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ALL_PERMISSIONS.map((perm) => {
              const isSelected = selectedPermissions.includes(perm.key);
              return (
                <div
                  key={perm.key}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedPermissions(selectedPermissions.filter((p) => p !== perm.key));
                    } else {
                      setSelectedPermissions([...selectedPermissions, perm.key]);
                    }
                  }}
                  className={`p-3 rounded-xl border cursor-pointer flex items-start gap-3 transition-colors ${
                    isSelected ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block text-slate-900 text-xs">{perm.label}</strong>
                    <span className="text-[11px] text-slate-500">{perm.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENTS */}
      {activeTab === 'payments' && (() => {
        const baseSal = staff.salary || 20000;
        const reimbTotal = adjustments
          .filter((a) => a.adjustment_type === 'reimbursement')
          .reduce((sum, a) => sum + Number(a.amount || 0), 0);
        const deducTotal = adjustments
          .filter((a) => a.adjustment_type === 'deduction')
          .reduce((sum, a) => sum + Number(a.amount || 0), 0);
        const netSal = Math.max(0, baseSal + reimbTotal - deducTotal);

        return (
          <div className="space-y-6">
            {/* 4-Card Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Monthly Base Salary</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block font-mono">
                  {formatCurrency(baseSal)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Fixed contracted base</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
                <span className="text-[11px] font-semibold text-emerald-700 block">Total Reimbursements (+)</span>
                <span className="text-xl font-bold text-emerald-800 mt-1 block font-mono">
                  +{formatCurrency(reimbTotal)}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Overtime route & duty coverage</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
                <span className="text-[11px] font-semibold text-rose-700 block">Total Deductions (-)</span>
                <span className="text-xl font-bold text-rose-800 mt-1 block font-mono">
                  -{formatCurrency(deducTotal)}
                </span>
                <span className="text-[10px] text-rose-600 block mt-0.5">Unpaid absences & penalties</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 shadow-2xs">
                <span className="text-[11px] font-semibold text-indigo-700 block">Calculated Net Payable</span>
                <span className="text-xl font-bold text-indigo-950 mt-1 block font-mono">
                  {formatCurrency(netSal)}
                </span>
                <span className="text-[10px] text-indigo-600 block mt-0.5">Base + Reimbursements - Deductions</span>
              </div>
            </div>

            {/* Quick Action Button for Salary Adjustment */}
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>
                  Adjustments affect the final payable salary dynamically without altering the employee base salary.
                </span>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsAdjustmentModalOpen(true)}
                leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                Record Salary Adjustment
              </Button>
            </div>

            {/* Compensation Records */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Monthly Compensation Records</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Billing Month</th>
                      <th className="py-2.5 px-3">Base Salary</th>
                      <th className="py-2.5 px-3">Reimbursements</th>
                      <th className="py-2.5 px-3">Deductions</th>
                      <th className="py-2.5 px-3">Net Payable</th>
                      <th className="py-2.5 px-3">Payment Date</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {payments.map((p) => {
                      const empReimb = adjustments
                        .filter(
                          (a) =>
                            a.adjustment_type === 'reimbursement' &&
                            (a.billing_month || a.effective_date.slice(0, 7)) === p.billing_month
                        )
                        .reduce((sum, a) => sum + Number(a.amount || 0), 0);
                      const empDeduc = adjustments
                        .filter(
                          (a) =>
                            a.adjustment_type === 'deduction' &&
                            (a.billing_month || a.effective_date.slice(0, 7)) === p.billing_month
                        )
                        .reduce((sum, a) => sum + Number(a.amount || 0), 0);
                      const itemBase = p.base_salary || staff.salary || 20000;
                      const itemNet = Math.max(0, itemBase + empReimb - empDeduc);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-mono font-semibold">{p.billing_month}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{formatCurrency(itemBase)}</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-700 font-semibold">
                            {empReimb > 0 ? `+${formatCurrency(empReimb)}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-rose-700 font-semibold">
                            {empDeduc > 0 ? `-${formatCurrency(empDeduc)}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">
                            {formatCurrency(itemNet)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {p.payment_date ? formatDate(p.payment_date) : 'Pending'}
                          </td>
                          <td className="py-2.5 px-3 uppercase text-slate-600">{p.payment_method || 'Bank'}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {p.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB: SALARY ADJUSTMENTS (Reimbursements & Deductions) */}
      {activeTab === 'adjustments' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Salary Adjustments (Reimbursements & Deductions)</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Financial outcomes recorded for extra route/shift coverage or unpaid absences. Base salary remains untouched.
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsAdjustmentModalOpen(true)}
              leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              Record Salary Adjustment
            </Button>
          </div>

          {adjustments.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
              <Calculator className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No salary adjustments recorded for this employee.</p>
              <Button size="sm" variant="outline" onClick={() => setIsAdjustmentModalOpen(true)}>
                + Record First Adjustment
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Effective Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Linked Duty / Assignment</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Recorded By</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {adjustments.map((adj) => (
                    <tr key={adj.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-mono">{formatDate(adj.effective_date)}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            adj.adjustment_type === 'reimbursement'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {adj.adjustment_type === 'reimbursement' ? (
                            <PlusCircle className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <MinusCircle className="w-3 h-3 text-rose-600" />
                          )}
                          <span className="capitalize">{adj.adjustment_type}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {adj.reason}
                        {adj.notes && <p className="text-[11px] text-slate-400 font-normal">{adj.notes}</p>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {adj.temporary_assignment_label || adj.temporary_assignment_id ? (
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium text-[11px]">
                            {adj.temporary_assignment_label || `Ref: ${adj.temporary_assignment_id}`}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Standalone</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold font-mono">
                        <span
                          className={adj.adjustment_type === 'reimbursement' ? 'text-emerald-700' : 'text-rose-700'}
                        >
                          {adj.adjustment_type === 'reimbursement' ? '+' : '-'}
                          {formatCurrency(adj.amount)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{adj.created_by_name || 'Admin'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteAdjustment(adj.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete adjustment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: TEMPORARY COVERAGE (Work Replacement History) */}
      {activeTab === 'coverage' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Temporary Work Coverage History</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Coverage assignments where {staff.first_name} {staff.last_name} covered duties for a colleague or had their duties covered while on leave.
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsAssignCoverageModalOpen(true)}
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
              className="text-xs font-semibold"
            >
              + Assign Temporary Coverage
            </Button>
          </div>

          {temporaryAssignments.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
              <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No temporary work coverage assignments recorded.</p>
              <Button size="sm" variant="outline" onClick={() => setIsAssignCoverageModalOpen(true)}>
                + Create Coverage Assignment
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {temporaryAssignments.map((asg) => {
                const isReplacement = asg.replacement_employee_id === staff.id;
                return (
                  <div
                    key={asg.id}
                    className={`p-4 rounded-xl border space-y-3 text-xs ${
                      isReplacement
                        ? 'border-indigo-200 bg-indigo-50/20'
                        : 'border-slate-200 bg-slate-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          isReplacement
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isReplacement ? '⭐ Acting Replacement' : 'Leave Coverage'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          asg.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : asg.status === 'completed'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {asg.status}
                      </span>
                    </div>

                    <div>
                      <strong className="block text-slate-900 text-sm">{asg.duty_details}</strong>
                      <p className="text-slate-500 mt-0.5">
                        {isReplacement ? (
                          <>
                            Covering for absent colleague: <strong className="text-slate-800">{asg.absent_employee_name}</strong> ({asg.absent_employee_role})
                          </>
                        ) : (
                          <>
                            Covered by colleague: <strong className="text-slate-800">{asg.replacement_employee_name}</strong> ({asg.replacement_employee_role})
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-700">
                        🗓️ {formatDate(asg.start_date)} to {formatDate(asg.end_date)}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{asg.assignment_type.replace(/_/g, ' ')}</span>
                    </div>

                    {asg.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-white/60 p-2 rounded border border-slate-100">
                        &ldquo;{asg.notes}&rdquo;
                      </p>
                    )}

                    {asg.is_emergency_override && (
                      <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[10px] flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>
                          <strong>Emergency Override:</strong> {asg.override_reason || 'Admin authorized'}
                        </span>
                      </div>
                    )}

                    {/* Action Row */}
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {asg.status === 'active' && (
                          <button
                            onClick={() => handleUpdateAssignmentStatus(asg.id, 'completed')}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setIsAdjustmentModalOpen(true);
                        }}
                        leftIcon={<IndianRupee className="w-3 h-3 text-emerald-600" />}
                        className="text-[10px]"
                      >
                        Record Adjustment
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SALARY HISTORY */}
      {activeTab === 'salary_history' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Historical Salary Revisions</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Past salary compensation levels are preserved permanently without altering previous payment receipts.
              </p>
            </div>
            <Button size="sm" variant="primary" onClick={() => setIsSalaryModalOpen(true)}>
              + Increment / Revise Salary
            </Button>
          </div>

          <div className="relative border-l-2 border-indigo-200 ml-4 space-y-6 py-2">
            {salaryHistory.map((hist) => (
              <div key={hist.id} className="relative pl-6">
                <div className="absolute -left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-2xs" />
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(hist.amount)} / month
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      Effective: {formatDate(hist.effective_from)} {hist.effective_to ? `– ${formatDate(hist.effective_to)}` : '(Current)'}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">Reason: <strong>{hist.reason || 'Appraisal increment'}</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ACCOUNT ACCESS */}
      {activeTab === 'account' && staff.portal_access && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Staff Portal & Google Login Access</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff members authenticate securely via Google OAuth using their registered email address.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
              <ShieldCheck className="w-3.5 h-3.5" /> Portal Access Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div>
                <span className="text-slate-400 block font-medium">Authorized Google / Institutional Email</span>
                <strong className="font-mono text-slate-900 text-sm">{staff.email}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Employee Number</span>
                <strong className="font-mono text-slate-900 text-sm">{staff.employee_number || 'Not assigned'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Assigned Role</span>
                <strong className="text-slate-900 text-sm capitalize">{staff.custom_staff_type || staff.staff_type.replace('_', ' ')}</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-3">
              <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" /> How this staff member logs in:
              </h5>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 font-medium">
                <li>Visit the school login page.</li>
                <li>Click <strong>&ldquo;Continue with Google&rdquo;</strong>.</li>
                <li>Sign in using <strong className="font-mono text-indigo-700">{staff.email}</strong>.</li>
              </ol>
              <div className="pt-2 border-t border-indigo-100/80">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTogglePortalAccess}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  Disable Portal Access for {staff.first_name}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Audit Trail of Updates</h4>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex justify-between">
                <div>
                  <strong className="block text-slate-800 capitalize">{log.event_type.replace('_', ' ')}</strong>
                  <span className="text-slate-500">Performed by: {log.user_name || 'Administrator'}</span>
                </div>
                <span className="text-[11px] text-slate-400">{formatDate(log.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Employee Profile: ${staff.first_name} ${staff.last_name}`}
        description="Update contact details, department, license information, and photo"
      >
        <form onSubmit={handleSaveStaffEdits} className="space-y-4 text-xs text-left max-h-[75vh] overflow-y-auto pr-1">
            <PhotoUpload
              label="Employee Photo"
              currentPhotoUrl={editForm.photoUrl}
              onPhotoChange={(url) => setEditForm((prev) => ({ ...prev, photoUrl: url || '' }))}
            />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employee ID *</label>
              <input
                type="text"
                required
                readOnly
                value={editForm.employeeNumber}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-100 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Institutional Email *</label>
              <input
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>

          {staff.staff_type === 'driver' && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">License Number</label>
                <input
                  type="text"
                  value={editForm.licenseNumber}
                  onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">License Expiry</label>
                <input
                  type="date"
                  value={editForm.licenseExpiry}
                  onChange={(e) => setEditForm({ ...editForm, licenseExpiry: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* UPDATE SALARY MODAL */}
      <Modal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        title="Update Employee Monthly Salary"
        description="Records a new salary revision in historical compensation records"
      >
        <form onSubmit={handleUpdateSalarySubmit} className="space-y-4 text-xs text-left">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              <strong>Note:</strong> Updating salary creates a new historical record effective from the selected date. Past payment disbursements remain unchanged.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Monthly Salary (₹) *</label>
            <input
              type="number"
              required
              min={1000}
              value={salaryForm.newSalary}
              onChange={(e) => setSalaryForm({ ...salaryForm, newSalary: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Effective From Date *</label>
            <input
              type="date"
              required
              value={salaryForm.effectiveFrom}
              onChange={(e) => setSalaryForm({ ...salaryForm, effectiveFrom: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Revision</label>
            <input
              type="text"
              value={salaryForm.reason}
              onChange={(e) => setSalaryForm({ ...salaryForm, reason: e.target.value })}
              placeholder="e.g. Annual Increment, Seniority Promotion"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsSalaryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Update Salary
            </Button>
          </div>
        </form>
      </Modal>



      {/* RECORD SALARY ADJUSTMENT MODAL */}
      <SalaryAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSuccess={() => loadProfile()}
        employee={{
          id: staff.id,
          name: `${staff.first_name} ${staff.last_name}`,
          role: staff.staff_type === 'driver' ? 'driver' : 'staff',
          employeeNumber: staff.employee_number,
          baseSalary: staff.salary || 20000,
          department: staff.department || staff.staff_type,
        }}
      />

      {/* CREATE TEMPORARY COVERAGE MODAL */}
      <TemporaryAssignmentModal
        isOpen={isAssignCoverageModalOpen}
        onClose={() => setIsAssignCoverageModalOpen(false)}
        onSuccess={() => loadProfile()}
        preselectedAbsentMember={{
          id: staff.id,
          name: `${staff.first_name} ${staff.last_name}`,
          role: staff.staff_type === 'driver' ? 'driver' : 'staff',
          employeeNumber: staff.employee_number,
        }}
      />
    </div>
  );
}
