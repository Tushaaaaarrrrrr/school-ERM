'use client';

// ============================================================================
// School Admin Staff Directory & Role Permission Management
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { staffService, pinSecurityService, schoolIdentifierService } from '@/lib/services/api';
import { Staff, StaffType, StaffPermission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { GoogleEmailInput } from '@/components/ui/google-email-input';
import { StatusBadge } from '@/components/ui/badge';
import { SearchFilterBar } from '@/components/ui/search-filter-bar';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import {
  Users,
  Plus,
  Phone,
  Mail,
  Shield,
  KeyRound,
  Trash2,
  Lock,
  CheckSquare,
  Square,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Building,
  UserCheck,
  UserX,
  Download,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';
import { exportStaffToCsv } from '@/lib/utils/export';
import { SalaryAdjustmentModal } from '@/components/payroll/salary-adjustment-modal';
import { TemporaryAssignmentModal } from '@/components/payroll/temporary-assignment-modal';
import { IndianRupee } from 'lucide-react';

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

// Role Permission Templates
const ROLE_TEMPLATES: Record<string, { label: string; portalAccess: boolean; permissions: StaffPermission[] }> = {
  accountant: {
    label: 'Accountant',
    portalAccess: true,
    permissions: ['view_fees', 'record_student_payment', 'view_teacher_payments', 'view_payroll', 'manage_payroll', 'view_students'],
  },
  receptionist: {
    label: 'Receptionist',
    portalAccess: true,
    permissions: ['view_students', 'view_parent_contact', 'view_notices'],
  },
  librarian: {
    label: 'Librarian',
    portalAccess: true,
    permissions: ['view_students', 'view_notices', 'manage_inventory'],
  },
  transport_manager: {
    label: 'Transport Manager',
    portalAccess: true,
    permissions: ['manage_transport', 'view_students', 'record_pickup'],
  },
  driver: {
    label: 'Driver',
    portalAccess: true,
    permissions: ['record_pickup', 'manage_transport'],
  },
  office_staff: {
    label: 'Office Administrator',
    portalAccess: true,
    permissions: ['view_students', 'create_student', 'view_parent_contact', 'view_notices'],
  },
  caretaker: {
    label: 'Caretaker',
    portalAccess: false,
    permissions: [],
  },
  cleaning_staff: {
    label: 'Cleaning Staff / Sweeper',
    portalAccess: false,
    permissions: [],
  },
  security: {
    label: 'Security Guard',
    portalAccess: false,
    permissions: [],
  },
  peon: {
    label: 'Peon / Helper',
    portalAccess: false,
    permissions: [],
  },
  cook: {
    label: 'Cook / Kitchen Staff',
    portalAccess: false,
    permissions: [],
  },
  other: {
    label: 'Custom Staff Role',
    portalAccess: false,
    permissions: [],
  },
};

export default function AdminStaffPage() {
  const { currentSchool, currentUser } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [permissionModalStaff, setPermissionModalStaff] = useState<Staff | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<StaffPermission[]>([]);

  // Salary Adjustment & Coverage Modals
  const [selectedStaffForAdjustment, setSelectedStaffForAdjustment] = useState<Staff | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedStaffForCoverage, setSelectedStaffForCoverage] = useState<Staff | null>(null);
  const [isCoverageModalOpen, setIsCoverageModalOpen] = useState(false);

  // 5-Digit PIN Modal State
  const [selectedStaffForPin, setSelectedStaffForPin] = useState<Staff | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [staffPinInput, setStaffPinInput] = useState('12345');
  const [isSavingPin, setIsSavingPin] = useState(false);

  // Add Form
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+91 ',
    staffType: 'accountant',
    customStaffType: '',
    department: 'Accounts & Finance',
    employeeNumber: '',
    joiningDate: new Date().toISOString().split('T')[0],
    salary: 25000,
    portalAccess: true,
    licenseNumber: '',
    licenseExpiry: '',
    permissions: ['view_fees', 'record_student_payment'] as StaffPermission[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStaffEmailValid, setIsStaffEmailValid] = useState(false);
  const [isStaffEmailAvailable, setIsStaffEmailAvailable] = useState<boolean | null>(null);
  const [isStaffEmailChecking, setIsStaffEmailChecking] = useState(false);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const [list, nextEmployeeNumber] = await Promise.all([
        staffService.getStaff(schoolId),
        schoolIdentifierService.nextStaffNumber(schoolId, currentSchool?.code),
      ]);
      setStaffList(list);
      setFormData((previous) => ({ ...previous, employeeNumber: nextEmployeeNumber }));
    } catch {
      toastError('Failed to load staff list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [schoolId]);

  const handleRoleChange = (role: string) => {
    const template = ROLE_TEMPLATES[role] || ROLE_TEMPLATES.other;
    setFormData((prev) => ({
      ...prev,
      staffType: role,
      portalAccess: template.portalAccess,
      permissions: [...template.permissions],
    }));
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.email.trim()) {
      if (!formData.email.trim().toLowerCase().endsWith('@gmail.com')) {
        toastError('Staff Google email must end with @gmail.com.');
        return;
      }
      if (isStaffEmailAvailable === false) {
        toastError('This Google email is not available or registered to a conflicting account.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await staffService.createStaff(schoolId, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        staff_type: formData.staffType,
        custom_staff_type: formData.staffType === 'other' ? formData.customStaffType : undefined,
        department: formData.department,
        employee_number: formData.employeeNumber,
        joining_date: formData.joiningDate,
        salary: formData.salary,
        portal_access: formData.portalAccess,
        permissions: formData.permissions,
        license_number: formData.staffType === 'driver' ? formData.licenseNumber : undefined,
        license_expiry: formData.staffType === 'driver' ? formData.licenseExpiry : undefined,
        status: 'active',
      }, currentSchool?.code);

      success('Employee profile created successfully');
      setIsAddModalOpen(false);
      loadStaff();
    } catch (err: any) {
      toastError(err.message || 'Failed to create employee profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPermissions = (staff: Staff) => {
    setPermissionModalStaff(staff);
    setSelectedPermissions(staff.permissions || []);
  };

  const handleSavePermissions = async () => {
    if (!permissionModalStaff) return;
    try {
      await staffService.updateStaffPermissions(permissionModalStaff.id, selectedPermissions);
      success('Staff permissions updated successfully');
      setPermissionModalStaff(null);
      loadStaff();
    } catch {
      toastError('Failed to update permissions');
    }
  };

  const handleToggleStaffStatus = async (staffMember: Staff) => {
    const nextStatus: Staff['status'] = staffMember.status === 'active' ? 'inactive' : 'active';
    try {
      await staffService.updateStaff(
        staffMember.id,
        {
          status: nextStatus,
          portal_access: nextStatus === 'active' ? staffMember.portal_access : false,
        },
        currentUser?.id,
        currentUser?.name
      );
      success(
        nextStatus === 'inactive'
          ? `Staff member "${staffMember.first_name} ${staffMember.last_name}" deactivated. Portal access is disabled while payroll records remain intact.`
          : `Staff member "${staffMember.first_name} ${staffMember.last_name}" restored to Active status.`
      );
      loadStaff();
    } catch {
      toastError('Failed to change staff status');
    }
  };

  const handleOpenStaffPinModal = (staff: Staff) => {
    setSelectedStaffForPin(staff);
    setStaffPinInput(staff.security_pin || '');
    setIsPinModalOpen(true);
  };

  const handleResetStaffPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForPin) return;
    const trimmedPin = staffPinInput.trim();
    if (trimmedPin.length > 0 && !/^\d{5}$/.test(trimmedPin)) {
      toastError('Security PIN must be exactly 5 numeric digits (0-9) or left blank to remove');
      return;
    }

    setIsSavingPin(true);
    try {
      await pinSecurityService.unlockAndResetPin({
        targetType: 'staff',
        targetId: selectedStaffForPin.id,
        newPin: trimmedPin.length === 5 ? trimmedPin : undefined,
        unlockedByName: currentUser?.name || 'School Principal',
      });
      if (trimmedPin.length === 5) {
        success(`Updated 5-digit PIN for ${selectedStaffForPin.first_name} ${selectedStaffForPin.last_name}. Account unlocked!`);
      } else {
        success(`Removed PIN requirement for ${selectedStaffForPin.first_name} ${selectedStaffForPin.last_name}. Account unlocked!`);
      }
      setIsPinModalOpen(false);
      setSelectedStaffForPin(null);
      loadStaff();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to update PIN');
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleRemoveStaffPin = async () => {
    if (!selectedStaffForPin) return;
    setIsSavingPin(true);
    try {
      await pinSecurityService.unlockAndResetPin({
        targetType: 'staff',
        targetId: selectedStaffForPin.id,
        newPin: undefined,
        unlockedByName: currentUser?.name || 'School Principal',
      });
      success(`Security PIN removed for ${selectedStaffForPin.first_name}. Employee can now log in without a PIN.`);
      setIsPinModalOpen(false);
      setSelectedStaffForPin(null);
      loadStaff();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to remove PIN');
    } finally {
      setIsSavingPin(false);
    }
  };

  const filteredStaff = (staffList || []).filter((s) => {
    if (!s) return false;
    const matchesSearch =
      `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase().includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.employee_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.phone || '').includes(search);
    const matchesType = !typeFilter || s.staff_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" /> School Staff & Employee Directory
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              exportStaffToCsv(filteredStaff, currentUser?.name, schoolId);
              success(`Exported ${filteredStaff.length} staff records`);
            }}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setSelectedStaffForCoverage(null);
              setIsCoverageModalOpen(true);
            }}
            className="flex items-center gap-1.5 shadow-sm text-indigo-600 border-indigo-200 hover:bg-indigo-50"
          >
            <UserCheck className="w-4 h-4" />
            <span>+ Assign Coverage</span>
          </Button>

          <Link href="/admin/staff/new">
            <Button
              variant="primary"
              className="flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search staff by name, email, employee ID or phone..."
        filters={[
          {
            id: 'type',
            label: 'All Designations',
            value: typeFilter,
            options: [
              { label: 'All Designations', value: '' },
              { label: 'Accountants', value: 'accountant' },
              { label: 'Receptionists', value: 'receptionist' },
              { label: 'Drivers', value: 'driver' },
              { label: 'Transport Managers', value: 'transport_manager' },
              { label: 'Librarians', value: 'librarian' },
              { label: 'Office Staff', value: 'office_staff' },
              { label: 'Security', value: 'security' },
              { label: 'Caretakers', value: 'caretaker' },
              { label: 'Cleaning Staff', value: 'sweeper' },
            ],
            onChange: setTypeFilter,
          },
        ]}
      />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No staff members found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role & Department</th>
                  <th className="py-3 px-4">Portal Access</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/staff/${staff.id}`}
                        className="flex items-center gap-3 group"
                      >
                        {staff.photo_url ? (
                          <img
                            src={staff.photo_url}
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700">
                            {staff.first_name?.[0] || 'S'}
                            {staff.last_name?.[0] || ''}
                          </div>
                        )}
                        <div>
                          <strong className="block font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {staff.first_name || ''} {staff.last_name || ''}
                          </strong>
                          <span className="text-[11px] font-mono text-slate-400">
                            {staff.employee_number || 'Not assigned'}
                          </span>
                        </div>
                      </Link>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 capitalize block">
                        {staff.custom_staff_type || (staff.staff_type ? staff.staff_type.replace('_', ' ') : 'Staff')}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {staff.department || 'General Administration'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {staff.portal_access ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" /> ENABLED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <ShieldAlert className="w-3 h-3 text-slate-400" /> OFF (No Login)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/staff/${staff.id}`}>
                          <Button size="sm" variant="outline">
                            View →
                          </Button>
                        </Link>
                        {/* Adjust Salary */}
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setSelectedStaffForAdjustment(staff);
                            setIsAdjustmentModalOpen(true);
                          }}
                          leftIcon={<IndianRupee className="w-3 h-3 text-emerald-600" />}
                          className="text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                          title="Record Reimbursement or Deduction"
                        >
                          ± Adjust
                        </Button>
                        {/* Assign Coverage */}
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setSelectedStaffForCoverage(staff);
                            setIsCoverageModalOpen(true);
                          }}
                          leftIcon={<UserCheck className="w-3 h-3 text-indigo-600" />}
                          className="text-indigo-700 hover:bg-indigo-50 border-indigo-200"
                          title="Assign Temporary Coverage"
                        >
                          Cover
                        </Button>
                        {staff.portal_access && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenPermissions(staff)}
                              title="Manage Permissions"
                            >
                              <Shield className="w-3.5 h-3.5 text-indigo-600" />
                            </Button>
                            <Button
                              size="xs"
                              variant={staff.is_pin_locked ? 'danger' : 'ghost'}
                              onClick={() => handleOpenStaffPinModal(staff)}
                              title="Configure 5-Digit Security PIN / Unlock"
                              leftIcon={<KeyRound className="w-3 h-3" />}
                            >
                              {staff.is_pin_locked ? '🔒 Locked' : 'PIN'}
                            </Button>
                          </>
                        )}
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleToggleStaffStatus(staff)}
                          title={staff.status === 'active' ? 'Deactivate Employee (Preserves History)' : 'Activate Employee'}
                          className={staff.status === 'active' ? 'text-rose-600 hover:bg-rose-50 border-rose-200' : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'}
                          leftIcon={
                            staff.status === 'active' ? (
                              <UserX className="w-3 h-3 text-rose-500" />
                            ) : (
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                            )
                          }
                        >
                          {staff.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD STAFF MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add School Employee"
        description="Create employee records for administrative, support, or maintenance personnel"
      >
        <form onSubmit={handleAddStaffSubmit} className="space-y-4 text-xs text-left max-h-[75vh] overflow-y-auto pr-1">
          {/* Role Template Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Employee Designation *</label>
            <select
              value={formData.staffType}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
            >
              {Object.entries(ROLE_TEMPLATES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {formData.staffType === 'other' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Custom Role Name *</label>
              <input
                type="text"
                required
                value={formData.customStaffType}
                onChange={(e) => setFormData({ ...formData, customStaffType: e.target.value })}
                placeholder="e.g. Sports Coordinator, Lab Assistant, Nurse"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="e.g. Ramesh"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="e.g. Kumar"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Accounts, Front Office, Housekeeping"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Monthly Salary (₹)</label>
              <input
                type="number"
                min={0}
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employee ID *</label>
              <input
                type="text"
                required
                readOnly
                value={formData.employeeNumber}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
              />
              <p className="mt-1 text-[11px] text-slate-500">Automatically assigned from the school code and staff sequence.</p>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Joining Date</label>
              <input
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <GoogleEmailInput
              label="Google Email (@gmail.com)"
              required={formData.portalAccess}
              value={formData.email}
              onChange={(val) => setFormData({ ...formData, email: val })}
              targetSchoolId={schoolId}
              targetRole="staff"
              onValidationChange={(valid, available, checking) => {
                setIsStaffEmailValid(valid);
                setIsStaffEmailAvailable(available);
                setIsStaffEmailChecking(checking);
              }}
              placeholder="staff.name@gmail.com"
              helperText="Google account for staff portal sign-in"
              id="staff-create-email-input"
            />
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>

          {/* Driver Specific Fields */}
          {formData.staffType === 'driver' && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Driving License Number</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  placeholder="DL-04-2018-984210"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">License Expiry Date</label>
                <input
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>
          )}

          {/* Portal Access Toggle */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <strong className="block text-slate-900">ERP Portal Software Access</strong>
              <span className="text-[11px] text-slate-500">
                Default OFF for maintenance, security, sweepers, etc. Enable only if required.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.portalAccess}
              onChange={(e) => setFormData({ ...formData, portalAccess: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={isSubmitting || isStaffEmailChecking || (Boolean(formData.email.trim()) && isStaffEmailAvailable === false)}
            >
              Create Employee Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* PERMISSION ASSIGNMENT MODAL */}
      {permissionModalStaff && (
        <Modal
          isOpen={true}
          onClose={() => setPermissionModalStaff(null)}
          title={`Custom Permissions: ${permissionModalStaff.first_name} ${permissionModalStaff.last_name}`}
          description={`Fine-tune authorized ERP modules for ${permissionModalStaff.staff_type}`}
        >
          <div className="space-y-4 text-left text-xs">
            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
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
                      <strong className="block text-slate-900">{perm.label}</strong>
                      <span className="text-[11px] text-slate-500">{perm.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setPermissionModalStaff(null)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleSavePermissions}>
                Save Permissions
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 5-Digit PIN Management Modal */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title={`Configure Security PIN: ${selectedStaffForPin?.first_name} ${selectedStaffForPin?.last_name}`}
        description="Set or remove the optional 5-digit PIN for this staff member's web and mobile portal access"
      >
        <form onSubmit={handleResetStaffPin} className="space-y-4 text-left">
          <Input
            label="5-Digit Security PIN (Optional)"
            maxLength={5}
            value={staffPinInput}
            onChange={(e) => setStaffPinInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="e.g. 12345 (Leave blank if no PIN)"
            helperText="Optional. If set, employee must enter this 5-digit PIN to access portal. Leave blank for immediate access without PIN."
          />

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              Assigning a PIN is completely optional. If assigned, 5 consecutive failed attempts will lock the account until you reset or unlock it here.
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100">
            {selectedStaffForPin?.security_pin ? (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleRemoveStaffPin}
                disabled={isSavingPin}
              >
                Remove PIN (No Lock)
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPinModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSavingPin}>
                Save & Unlock
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Salary Adjustment Modal */}
      {selectedStaffForAdjustment && (
        <SalaryAdjustmentModal
          isOpen={isAdjustmentModalOpen}
          onClose={() => {
            setIsAdjustmentModalOpen(false);
            setSelectedStaffForAdjustment(null);
          }}
          onSuccess={() => loadStaff()}
          employee={{
            id: selectedStaffForAdjustment.id,
            name: `${selectedStaffForAdjustment.first_name} ${selectedStaffForAdjustment.last_name}`,
            role: selectedStaffForAdjustment.staff_type === 'driver' ? 'driver' : 'staff',
            employeeNumber: selectedStaffForAdjustment.employee_number,
            baseSalary: selectedStaffForAdjustment.salary || 20000,
            department: selectedStaffForAdjustment.department || selectedStaffForAdjustment.staff_type,
          }}
        />
      )}

      {/* Temporary Coverage Modal */}
      <TemporaryAssignmentModal
        isOpen={isCoverageModalOpen}
        onClose={() => {
          setIsCoverageModalOpen(false);
          setSelectedStaffForCoverage(null);
        }}
        onSuccess={() => loadStaff()}
        preselectedAbsentMember={
          selectedStaffForCoverage
            ? {
                id: selectedStaffForCoverage.id,
                name: `${selectedStaffForCoverage.first_name} ${selectedStaffForCoverage.last_name}`,
                role: selectedStaffForCoverage.staff_type === 'driver' ? 'driver' : 'staff',
                employeeNumber: selectedStaffForCoverage.employee_number,
              }
            : undefined
        }
      />
    </div>
  );
}
