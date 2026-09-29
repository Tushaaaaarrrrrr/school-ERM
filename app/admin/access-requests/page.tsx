'use client';

// ============================================================================
// School Admin Join Requests & Role Assignment Review Center
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { accessRequestService, parentService, staffService, teacherService } from '@/lib/services/api';
import { SchoolAccessRequest, StaffPermission, StaffType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils/formatters';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  Briefcase,
  AlertCircle,
  ShieldCheck,
  Filter,
  UserPlus,
  BookOpen,
  FileText,
  Pencil,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

const TEACHER_DESIGNATIONS = [
  'Assistant Teacher',
  'Primary Teacher (PRT)',
  'Trained Graduate Teacher (TGT)',
  'Post Graduate Teacher (PGT)',
  'Senior Teacher',
  'Head Teacher',
  'Head of Department (HOD)',
  'Special Educator',
  'Physical Education Teacher',
  'Faculty Teacher',
];

const TEACHER_DEPARTMENTS = [
  'Mathematics',
  'Science',
  'English',
  'Hindi',
  'Social Studies',
  'Computer Science',
  'Primary Education',
  'Physical Education',
  'Arts & Music',
];

export default function AdminAccessRequestsPage() {
  const router = useRouter();
  const { currentSchool, currentUser } = useAuth();
  const schoolId = currentSchool?.id || '';
  const { success, error: toastError } = useToast();

  const [requests, setRequests] = useState<SchoolAccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  // Approve & Assign Role Modal State
  const [approvingReq, setApprovingReq] = useState<SchoolAccessRequest | null>(null);
  const [assignedRole, setAssignedRole] = useState<'teacher' | 'staff' | 'driver' | 'parent' | 'student'>('teacher');
  const [assignedDepartment, setAssignedDepartment] = useState('Mathematics');
  const [assignedDesignation, setAssignedDesignation] = useState('Faculty Teacher');
  const [assignedPin, setAssignedPin] = useState('12345');
  const [staffType, setStaffType] = useState<StaffType>('office_staff');
  const [selectedPermissions, setSelectedPermissions] = useState<StaffPermission[]>(['view_students', 'view_fees']);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reject Modal State
  const [rejectingReq, setRejectingReq] = useState<SchoolAccessRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Approved access is separate from the operational employee/parent record.
  const [editingApprovedReq, setEditingApprovedReq] = useState<SchoolAccessRequest | null>(null);
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileDesignation, setProfileDesignation] = useState('');
  const [profileDepartment, setProfileDepartment] = useState('');
  const [profileJoiningDate, setProfileJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [profileSalary, setProfileSalary] = useState('');
  const [profileStaffType, setProfileStaffType] = useState<StaffType>('office_staff');
  const [profileAddress, setProfileAddress] = useState('');

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const list = await accessRequestService.getAccessRequests(schoolId);
      setRequests(list);
    } catch {
      toastError('Failed to load join requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) loadRequests();
  }, [schoolId]);

  const splitName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    return { firstName: parts.shift() || '', lastName: parts.join(' ') };
  };

  const handleOpenApprovedProfile = async (req: SchoolAccessRequest) => {
    if (req.assigned_role === 'student') {
      router.push(`/admin/students/new?name=${encodeURIComponent(req.user_name)}&email=${encodeURIComponent(req.user_email)}`);
      return;
    }

    const { firstName, lastName } = splitName(req.user_name);
    setExistingProfileId(null);
    setProfileFirstName(firstName);
    setProfileLastName(lastName);
    setProfilePhone((req.phone || '').replace(/\D/g, '').slice(0, 10));
    setProfileDesignation(req.assigned_designation || '');
    setProfileDepartment(req.assigned_department || '');
    setProfileJoiningDate(new Date().toISOString().split('T')[0]);
    setProfileSalary('');
    setProfileStaffType(req.assigned_role === 'driver' ? 'driver' : 'office_staff');
    setProfileAddress('');

    try {
      if (req.assigned_role === 'teacher') {
        const existing = (await teacherService.getTeachers(schoolId)).find(
          (teacher) => teacher.email.toLowerCase() === req.user_email.toLowerCase()
        );
        if (existing) {
          setExistingProfileId(existing.id);
          setProfileFirstName(existing.first_name);
          setProfileLastName(existing.last_name);
          setProfilePhone(existing.phone.replace(/\D/g, '').slice(0, 10));
          setProfileDesignation(existing.designation || '');
          setProfileDepartment(existing.subjects?.[0] || req.assigned_department || '');
          setProfileJoiningDate(existing.joining_date);
          setProfileSalary(existing.monthly_salary?.toString() || '');
        }
      } else if (req.assigned_role === 'staff' || req.assigned_role === 'driver') {
        const existing = (await staffService.getStaff(schoolId)).find(
          (staff) => staff.email.toLowerCase() === req.user_email.toLowerCase()
        );
        if (existing) {
          setExistingProfileId(existing.id);
          setProfileFirstName(existing.first_name);
          setProfileLastName(existing.last_name);
          setProfilePhone(existing.phone.replace(/\D/g, '').slice(0, 10));
          setProfileDesignation(existing.custom_type_name || existing.department || '');
          setProfileDepartment(existing.department || '');
          setProfileJoiningDate(existing.joining_date);
          setProfileSalary(existing.salary?.toString() || '');
          setProfileStaffType(existing.staff_type);
        }
      } else if (req.assigned_role === 'parent') {
        const existing = (await parentService.getParents(schoolId)).find(
          (parent) => parent.email.toLowerCase() === req.user_email.toLowerCase()
        );
        if (existing) {
          setExistingProfileId(existing.id);
          setProfileFirstName(existing.guardian_name);
          setProfileLastName('');
          setProfilePhone(existing.primary_phone.replace(/\D/g, '').slice(0, 10));
          setProfileAddress(existing.address || '');
        }
      }
      setEditingApprovedReq(req);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to load the user profile');
    }
  };

  const handleSaveApprovedProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApprovedReq || !schoolId) return;
    if (!profileFirstName.trim() || !/^\d{10}$/.test(profilePhone)) {
      toastError('Name and a valid 10-digit phone number are required');
      return;
    }
    if (editingApprovedReq.assigned_role === 'teacher' && (!profileDesignation || !profileDepartment)) {
      toastError('Select the teacher designation and main subject/department');
      return;
    }

    const salary = profileSalary.trim() ? Number(profileSalary) : undefined;
    if (salary !== undefined && (!Number.isFinite(salary) || salary < 0)) {
      toastError('Salary must be a valid non-negative amount');
      return;
    }

    setIsProcessing(true);
    try {
      if (editingApprovedReq.assigned_role === 'teacher') {
        const data = {
          first_name: profileFirstName.trim(),
          last_name: profileLastName.trim(),
          phone: profilePhone.trim(),
          email: editingApprovedReq.user_email,
          joining_date: profileJoiningDate,
          designation: profileDesignation.trim(),
          subjects: profileDepartment.trim() ? [profileDepartment.trim()] : [],
          monthly_salary: salary,
          status: 'active' as const,
        };
        if (existingProfileId) {
          await teacherService.updateTeacher(existingProfileId, data, currentUser?.id, currentUser?.name);
        } else {
          await teacherService.createTeacher(schoolId, { ...data, employee_number: '' }, currentSchool?.code);
        }
      } else if (editingApprovedReq.assigned_role === 'staff' || editingApprovedReq.assigned_role === 'driver') {
        const data = {
          first_name: profileFirstName.trim(),
          last_name: profileLastName.trim(),
          email: editingApprovedReq.user_email,
          phone: profilePhone.trim(),
          staff_type: editingApprovedReq.assigned_role === 'driver' ? ('driver' as StaffType) : profileStaffType,
          department: profileDepartment.trim(),
          custom_type_name: profileDesignation.trim(),
          joining_date: profileJoiningDate,
          salary,
          portal_access: true,
          permissions: editingApprovedReq.assigned_role === 'driver' ? (['record_pickup', 'manage_transport'] as StaffPermission[]) : selectedPermissions,
          status: 'active' as const,
        };
        if (existingProfileId) {
          await staffService.updateStaff(existingProfileId, data, currentUser?.id, currentUser?.name);
        } else {
          await staffService.createStaff(schoolId, data, currentSchool?.code);
        }
      } else if (editingApprovedReq.assigned_role === 'parent') {
        const data = {
          school_id: schoolId,
          guardian_name: [profileFirstName.trim(), profileLastName.trim()].filter(Boolean).join(' '),
          primary_phone: profilePhone.trim(),
          email: editingApprovedReq.user_email,
          address: profileAddress.trim(),
          status: 'active' as const,
        };
        if (existingProfileId) await parentService.updateParent(existingProfileId, data);
        else await parentService.createParent(data);
      }

      success(`${editingApprovedReq.user_name}'s ${existingProfileId ? 'profile was updated' : 'operational profile was created'}.`);
      setEditingApprovedReq(null);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to save the user profile');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenApproveModal = (req: SchoolAccessRequest) => {
    setApprovingReq(req);
    setAssignedPin(''); // Optional by default
    // Pre-select defaults based on notes if applicable
    if (req.applicant_notes?.toLowerCase().includes('accountant')) {
      setAssignedRole('staff');
      setStaffType('accountant');
      setAssignedDesignation('Accountant');
      setSelectedPermissions(['view_fees', 'record_student_payment', 'view_all_collections']);
    } else if (req.applicant_notes?.toLowerCase().includes('driver')) {
      setAssignedRole('driver');
      setStaffType('driver');
      setAssignedDesignation('Bus Driver');
      setSelectedPermissions(['record_pickup', 'manage_transport']);
    } else {
      setAssignedRole('teacher');
      setAssignedDepartment('Mathematics');
      setAssignedDesignation('Faculty Teacher');
    }
  };

  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingReq) return;
    const trimmedPin = assignedPin.trim();
    if (trimmedPin.length > 0 && !/^\d{5}$/.test(trimmedPin)) {
      toastError('Security PIN must be exactly 5 numeric digits (0-9) or left empty');
      return;
    }

    setIsProcessing(true);
    try {
      await accessRequestService.approveAccessRequest(
        approvingReq.id,
        assignedRole,
        {
          department: assignedRole === 'teacher' ? assignedDepartment : undefined,
          designation: assignedDesignation,
          staffType: assignedRole === 'staff' ? staffType : assignedRole === 'driver' ? 'driver' : undefined,
          permissions: assignedRole === 'staff' || assignedRole === 'driver' ? selectedPermissions : undefined,
          assignedPin: trimmedPin.length === 5 ? trimmedPin : undefined,
        },
        currentUser?.name || 'School Principal'
      );

      success(`Successfully onboarded ${approvingReq.user_name} as ${assignedRole.toUpperCase()}${trimmedPin ? ' with 5-digit PIN' : ''}!`);
      setApprovingReq(null);
      loadRequests();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReq) return;
    setIsProcessing(true);
    try {
      await accessRequestService.rejectAccessRequest(
        rejectingReq.id,
        rejectReason.trim() || 'Declined by School Administration',
        currentUser?.name || 'School Principal'
      );
      success(`Request for ${rejectingReq.user_name} declined.`);
      setRejectingReq(null);
      setRejectReason('');
      loadRequests();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePermission = (perm: StaffPermission) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6 text-left w-full">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <UserCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Onboarding & Join Applications
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review incoming applications for <strong>{currentSchool?.name}</strong>, assign institutional roles, and grant portal access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadRequests}
            disabled={isLoading}
          >
            Refresh List
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'pending'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Pending Review</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-400 text-slate-900">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'approved'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Approved & Assigned
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'rejected'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Declined
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Applications
        </button>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">No {activeTab !== 'all' ? activeTab : ''} applications</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When candidates and personnel sign in with Google and enter your School Code (<strong>{currentSchool?.code}</strong>), their applications will appear here for role assignment.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
          {filteredRequests.map((req) => (
            <div key={req.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                  {req.user_name.charAt(0).toUpperCase()}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{req.user_name}</h3>
                    {req.assigned_role && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        Assigned: {req.assigned_role}
                      </span>
                    )}
                    {req.assigned_department && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                        {req.assigned_department}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {req.user_email}
                    </span>
                    {req.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {req.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      Applied {formatDate(req.created_at)}
                    </span>
                  </div>

                  {req.applicant_notes && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-2 mt-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-[11px] text-slate-900 block font-semibold">Applicant Note:</strong>
                        <span>{req.applicant_notes}</span>
                      </div>
                    </div>
                  )}

                  {req.status === 'rejected' && req.rejection_reason && (
                    <p className="text-xs text-rose-600">
                      Declined Reason: <em>{req.rejection_reason}</em>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {req.status === 'pending' ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenApproveModal(req)}
                      disabled={isProcessing}
                      leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                    >
                      Assign Role & Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectingReq(req)}
                      disabled={isProcessing}
                      className="text-rose-600 hover:bg-rose-50 border-rose-200"
                      leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    >
                      Decline
                    </Button>
                  </>
                ) : req.status === 'approved' ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Approved & Active
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenApprovedProfile(req)}
                      disabled={isProcessing}
                      leftIcon={<Pencil className="w-3.5 h-3.5" />}
                    >
                      {req.assigned_role === 'student' ? 'Complete Enrollment' : 'Complete / Edit Profile'}
                    </Button>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    Declined
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role Assignment & Approval Modal */}
      <Modal
        isOpen={Boolean(approvingReq)}
        onClose={() => setApprovingReq(null)}
        title={`Assign Institutional Role: ${approvingReq?.user_name}`}
        description={`Assign role, designation, and portal permissions for ${approvingReq?.user_email}.`}
      >
        <form onSubmit={handleConfirmApproval} className="space-y-4 text-left">
          {/* Role Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Institutional Role <span className="text-rose-500">*</span>
            </label>
            <select
              value={assignedRole}
              onChange={(e) => setAssignedRole(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500"
            >
              <option value="teacher">Teacher / Faculty Member</option>
              <option value="staff">Non-Teaching Staff (Accountant, Admin, Clerk)</option>
              <option value="driver">Transport Bus Driver</option>
              <option value="parent">Parent / Guardian</option>
              <option value="student">Student</option>
            </select>
          </div>

          {/* Teacher Specific Fields */}
          {assignedRole === 'teacher' && (
            <div className="space-y-3 p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Teacher Configuration
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department / Main Subject</label>
                  <select
                    value={assignedDepartment}
                    onChange={(e) => setAssignedDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    {TEACHER_DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation <span className="text-rose-500">*</span></label>
                  <select required value={assignedDesignation} onChange={(e) => setAssignedDesignation(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select designation</option>
                    {TEACHER_DESIGNATIONS.map((designation) => <option key={designation} value={designation}>{designation}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Staff Specific Fields */}
          {assignedRole === 'staff' && (
            <div className="space-y-3 p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                Staff Role & Permissions
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Category</label>
                  <select
                    value={staffType}
                    onChange={(e) => setStaffType(e.target.value as StaffType)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="accountant">Accountant / Fee Collector</option>
                    <option value="receptionist">Receptionist / Front Desk</option>
                    <option value="office_staff">Office Administrator</option>
                    <option value="librarian">Librarian</option>
                    <option value="lab_assistant">Lab Assistant</option>
                    <option value="it_staff">IT & Systems Support</option>
                  </select>
                </div>

                <Input
                  label="Designation"
                  required
                  value={assignedDesignation}
                  onChange={(e) => setAssignedDesignation(e.target.value)}
                  placeholder="e.g. Senior Accountant"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Granted Portal Permissions</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes('view_fees')}
                      onChange={() => togglePermission('view_fees')}
                      className="rounded text-indigo-600"
                    />
                    <span>View Fee Invoices</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes('record_student_payment')}
                      onChange={() => togglePermission('record_student_payment')}
                      className="rounded text-indigo-600"
                    />
                    <span>Collect Payments</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes('view_students')}
                      onChange={() => togglePermission('view_students')}
                      className="rounded text-indigo-600"
                    />
                    <span>View Student Profiles</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes('manage_enquiries')}
                      onChange={() => togglePermission('manage_enquiries')}
                      className="rounded text-indigo-600"
                    />
                    <span>Manage Enquiries</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100">
            <Input
              label="Assigned 5-Digit Security PIN (Optional)"
              maxLength={5}
              value={assignedPin}
              onChange={(e) => setAssignedPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="e.g. 54321 (Leave blank if no PIN)"
              helperText="Optional. If set, user must enter this 5-digit PIN to access portal. Leave blank for instant access without PIN."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setApprovingReq(null)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isProcessing}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Confirm & Onboard User
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(editingApprovedReq)}
        onClose={() => setEditingApprovedReq(null)}
        title={`${existingProfileId ? 'Edit' : 'Complete'} ${editingApprovedReq?.assigned_role || ''} profile`}
        description="Portal approval and operational details are separate. Complete these details before assigning work, classes, payroll, or children."
      >
        <form onSubmit={handleSaveApprovedProfile} className="space-y-4 text-left">
          <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-900">
            <strong>Login:</strong> {editingApprovedReq?.user_email}.
            {editingApprovedReq?.assigned_role !== 'parent' && ' Employee ID is generated automatically for identification only; no temporary password is created.'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label={editingApprovedReq?.assigned_role === 'parent' ? 'Guardian Name' : 'First Name'} required value={profileFirstName} onChange={(e) => setProfileFirstName(e.target.value)} />
            {editingApprovedReq?.assigned_role !== 'parent' && (
              <Input label="Last Name" required value={profileLastName} onChange={(e) => setProfileLastName(e.target.value)} />
            )}
            <Input label="Email / Portal Login" value={editingApprovedReq?.user_email || ''} disabled />
            <Input label="Phone Number" required inputMode="numeric" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, '').slice(0, 10))} helperText="Digits only (exactly 10 digits)" />
          </div>

          {editingApprovedReq?.assigned_role === 'parent' ? (
            <Input label="Residential Address" required value={profileAddress} onChange={(e) => setProfileAddress(e.target.value)} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Joining Date" required type="date" value={profileJoiningDate} onChange={(e) => setProfileJoiningDate(e.target.value)} />
                {editingApprovedReq?.assigned_role === 'teacher' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Designation <span className="text-rose-500">*</span></label>
                    <select required value={profileDesignation} onChange={(e) => setProfileDesignation(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white">
                      <option value="">Select designation</option>
                      {profileDesignation && !TEACHER_DESIGNATIONS.includes(profileDesignation) && <option value={profileDesignation}>{profileDesignation}</option>}
                      {TEACHER_DESIGNATIONS.map((designation) => <option key={designation} value={designation}>{designation}</option>)}
                    </select>
                  </div>
                ) : <Input label="Designation" required value={profileDesignation} onChange={(e) => setProfileDesignation(e.target.value)} />}
                {editingApprovedReq?.assigned_role === 'teacher' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Main Subject / Department <span className="text-rose-500">*</span></label>
                    <select required value={profileDepartment} onChange={(e) => setProfileDepartment(e.target.value)} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white">
                      <option value="">Select subject / department</option>
                      {profileDepartment && !TEACHER_DEPARTMENTS.includes(profileDepartment) && <option value={profileDepartment}>{profileDepartment}</option>}
                      {TEACHER_DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
                    </select>
                  </div>
                ) : <Input label="Department" required value={profileDepartment} onChange={(e) => setProfileDepartment(e.target.value)} />}
                <Input label="Monthly Salary (Optional)" type="number" min="0" value={profileSalary} onChange={(e) => setProfileSalary(e.target.value)} />
              </div>
              {editingApprovedReq?.assigned_role === 'staff' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Category</label>
                  <select value={profileStaffType} onChange={(e) => setProfileStaffType(e.target.value as StaffType)} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white">
                    <option value="accountant">Accountant</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="office_staff">Office Staff</option>
                    <option value="librarian">Librarian</option>
                    <option value="lab_assistant">Lab Assistant</option>
                    <option value="it_staff">IT Staff</option>
                  </select>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingApprovedReq(null)} disabled={isProcessing}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isProcessing}>{existingProfileId ? 'Save Changes' : 'Create Profile'}</Button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={Boolean(rejectingReq)}
        onClose={() => setRejectingReq(null)}
        title="Decline Join Application"
        description={`Decline application from ${rejectingReq?.user_name} (${rejectingReq?.user_email}).`}
      >
        <form onSubmit={handleConfirmReject} className="space-y-4 text-left">
          <Input
            label="Reason for Declining"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Identity could not be verified / Staff quota full"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectingReq(null)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isProcessing}
            >
              Confirm Decline
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
