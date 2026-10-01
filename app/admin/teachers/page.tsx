'use client';

// ============================================================================
// Teachers Directory, Full Editing, Assignment & Access Management
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { teacherService, classService, subjectService, pinSecurityService, schoolIdentifierService } from '@/lib/services/api';
import { Teacher, SchoolClass, Section, Subject, TeacherAssignment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { GoogleEmailInput } from '@/components/ui/google-email-input';
import { StatusBadge } from '@/components/ui/badge';
import { SearchFilterBar } from '@/components/ui/search-filter-bar';
import { useToast } from '@/components/ui/toast';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import {
  Users,
  Plus,
  Phone,
  Mail,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  KeyRound,
  Check,
  Edit3,
  Eye,
  UserCheck,
  UserX,
  Download,
  IndianRupee,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';
import { exportTeachersToCsv } from '@/lib/utils/export';
import { SalaryAdjustmentModal } from '@/components/payroll/salary-adjustment-modal';
import { TemporaryAssignmentModal } from '@/components/payroll/temporary-assignment-modal';

export default function TeachersPage() {
  const { currentSchool, currentYear, currentUser } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const yearId = currentYear?.id || 'ay-2026';
  const { success, error: toastError } = useToast();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Salary Adjustment & Temporary Coverage Modals
  const [selectedTeacherForAdjustment, setSelectedTeacherForAdjustment] = useState<Teacher | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedTeacherForCoverage, setSelectedTeacherForCoverage] = useState<Teacher | null>(null);
  const [isCoverageModalOpen, setIsCoverageModalOpen] = useState(false);

  // Add Teacher Form
  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    employeeNumber: '',
    phone: '+91 ',
    email: '',
    photoUrl: '',
    joiningDate: new Date().toISOString().split('T')[0],
    monthlySalary: '30000',
  });
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState<boolean | null>(null);
  const [isEmailChecking, setIsEmailChecking] = useState(false);

  // Edit Teacher Form
  const [editForm, setEditForm] = useState({
    id: '',
    firstName: '',
    lastName: '',
    employeeNumber: '',
    phone: '',
    email: '',
    joiningDate: '',
    photoUrl: '',
    status: 'active' as Teacher['status'],
    monthlySalary: 30000,
  });
  const [isEditEmailValid, setIsEditEmailValid] = useState(true);
  const [isEditEmailAvailable, setIsEditEmailAvailable] = useState<boolean | null>(true);
  const [isEditEmailChecking, setIsEditEmailChecking] = useState(false);
  const [editOriginalEmail, setEditOriginalEmail] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  // Assignment Form
  const [assignmentData, setAssignmentData] = useState({
    classId: '',
    sectionId: '',
    subjectId: '',
  });

  // 5-Digit PIN Management
  const [selectedTeacherForPin, setSelectedTeacherForPin] = useState<Teacher | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [teacherPinInput, setTeacherPinInput] = useState('12345');
  const [isSavingPin, setIsSavingPin] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tchList, clsList, subList, nextEmployeeNumber] = await Promise.all([
        teacherService.getTeachers(schoolId),
        classService.getClasses(schoolId),
        subjectService.getSubjects(schoolId),
        schoolIdentifierService.nextTeacherNumber(schoolId, currentSchool?.code),
      ]);
      setTeachers(tchList);
      setClasses(clsList);
      setSubjects(subList);
      setNewTeacher((previous) => ({ ...previous, employeeNumber: nextEmployeeNumber }));

      const allSecs: Section[] = [];
      clsList.forEach((c) => {
        if (c.sections) allSecs.push(...c.sections);
      });
      setSections(allSecs);

      if (clsList.length > 0) {
        setAssignmentData({
          classId: clsList[0].id,
          sectionId: '',
          subjectId: subList[0]?.id || '',
        });
      }
    } catch {
      toastError('Failed to load teachers data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const handleOpenEditModal = (teacher: Teacher) => {
    setEditForm({
      id: teacher.id,
      firstName: teacher.first_name,
      lastName: teacher.last_name,
      employeeNumber: teacher.employee_number,
      phone: teacher.phone,
      email: teacher.email,
      joiningDate: teacher.joining_date,
      photoUrl: teacher.photo_url || '',
      status: teacher.status,
      monthlySalary: teacher.monthly_salary || 30000,
    });
    setEditOriginalEmail(teacher.email || '');
    setIsEditingEmail(false);
    setIsEditEmailValid(true);
    setIsEditEmailAvailable(true);
    setIsEditEmailChecking(false);
    setSelectedTeacher(teacher);
    setIsEditModalOpen(true);
  };

  const handleUpdateTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.firstName.trim() || !editForm.employeeNumber || !editForm.email.trim()) {
      toastError('Please fill all required teacher fields (First Name, Employee ID, Email).');
      return;
    }

    if (!editForm.email.trim().toLowerCase().endsWith('@gmail.com')) {
      toastError('Teacher email must be an official @gmail.com account for Google sign-in.');
      return;
    }

    if (isEditingEmail && isEditEmailAvailable === false) {
      toastError('This Google email is not available or registered to a conflicting account.');
      return;
    }

    try {
      await teacherService.updateTeacher(
        editForm.id,
        {
          first_name: editForm.firstName.trim(),
          last_name: editForm.lastName.trim(),
          employee_number: editForm.employeeNumber.trim().toUpperCase(),
          phone: editForm.phone.trim(),
          email: editForm.email.trim(),
          joining_date: editForm.joiningDate,
          photo_url: editForm.photoUrl.trim() || undefined,
          status: editForm.status,
        },
        currentUser?.id,
        currentUser?.name
      );

      success(`Teacher ${editForm.firstName} ${editForm.lastName || ''} updated successfully!`);
      setIsEditModalOpen(false);
      loadData();
    } catch {
      toastError('Failed to update teacher profile');
    }
  };

  const handleToggleStatus = async (teacher: Teacher) => {
    const nextStatus: Teacher['status'] = teacher.status === 'active' ? 'inactive' : 'active';
    try {
      await teacherService.updateTeacher(
        teacher.id,
        { status: nextStatus },
        currentUser?.id,
        currentUser?.name
      );
      success(
        nextStatus === 'inactive'
          ? `Teacher "${teacher.first_name} ${teacher.last_name}" deactivated. Class assignments & salary history remain preserved.`
          : `Teacher "${teacher.first_name} ${teacher.last_name}" restored to Active status.`
      );
      loadData();
    } catch {
      toastError('Failed to change teacher status');
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacher.firstName.trim() || !newTeacher.employeeNumber || !newTeacher.email) {
      toastError('Please fill all required teacher fields (First Name, Employee ID, Email).');
      return;
    }

    if (!newTeacher.email.trim().toLowerCase().endsWith('@gmail.com')) {
      toastError('Teacher email must be an official @gmail.com account for Google sign-in.');
      return;
    }

    if (isEmailAvailable === false) {
      toastError('This Google email is not available or registered to a conflicting account.');
      return;
    }

    try {
      const created = await teacherService.createTeacher(schoolId, {
        first_name: newTeacher.firstName.trim(),
        last_name: newTeacher.lastName.trim(),
        employee_number: newTeacher.employeeNumber.trim().toUpperCase(),
        phone: newTeacher.phone.trim(),
        email: newTeacher.email.trim(),
        photo_url: newTeacher.photoUrl || undefined,
        joining_date: newTeacher.joiningDate,
        monthly_salary: parseInt(newTeacher.monthlySalary, 10) || 30000,
      }, currentSchool?.code);

      success(`Teacher ${created.first_name} ${created.last_name || ''} created successfully!`);
      setIsAddModalOpen(false);
      setNewTeacher({
        firstName: '',
        lastName: '',
        employeeNumber: '',
        phone: '+91 ',
        email: '',
        photoUrl: '',
        joiningDate: new Date().toISOString().split('T')[0],
        monthlySalary: '30000',
      });
      loadData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to create teacher');
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !assignmentData.classId || !assignmentData.subjectId) {
      toastError('Please select both class and subject');
      return;
    }

    try {
      const cls = classes.find((c) => c.id === assignmentData.classId);
      const sec = sections.find((s) => s.id === assignmentData.sectionId);
      const sub = subjects.find((s) => s.id === assignmentData.subjectId);

      await teacherService.assignSubject(schoolId, {
        school_id: schoolId,
        academic_year_id: yearId,
        teacher_id: selectedTeacher.id,
        class_id: assignmentData.classId,
        section_id: assignmentData.sectionId,
        subject_id: assignmentData.subjectId,
        teacher_name: `${selectedTeacher.first_name} ${selectedTeacher.last_name}`,
        class_name: cls?.name,
        section_name: sec?.name,
        subject_name: sub?.name,
        room_number: sec?.room_number,
      });

      success('Subject assignment added successfully!');
      setIsAssignModalOpen(false);
      loadData();
    } catch {
      toastError('Failed to assign subject');
    }
  };

  const handleOpenTeacherPinModal = (teacher: Teacher) => {
    setSelectedTeacherForPin(teacher);
    setTeacherPinInput(teacher.security_pin || '');
    setIsPinModalOpen(true);
  };

  const handleResetTeacherPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherForPin) return;
    const trimmedPin = teacherPinInput.trim();
    if (trimmedPin.length > 0 && !/^\d{5}$/.test(trimmedPin)) {
      toastError('Security PIN must be exactly 5 numeric digits (0-9) or left blank to remove');
      return;
    }

    setIsSavingPin(true);
    try {
      await pinSecurityService.unlockAndResetPin({
        targetType: 'teacher',
        targetId: selectedTeacherForPin.id,
        newPin: trimmedPin.length === 5 ? trimmedPin : undefined,
        unlockedByName: currentUser?.name || 'School Principal',
      });
      if (trimmedPin.length === 5) {
        success(`Updated 5-digit PIN for ${selectedTeacherForPin.first_name} ${selectedTeacherForPin.last_name}. Account unlocked!`);
      } else {
        success(`Removed PIN requirement for ${selectedTeacherForPin.first_name} ${selectedTeacherForPin.last_name}. Account unlocked!`);
      }
      setIsPinModalOpen(false);
      setSelectedTeacherForPin(null);
      loadData();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to update PIN');
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleRemoveTeacherPin = async () => {
    if (!selectedTeacherForPin) return;
    setIsSavingPin(true);
    try {
      await pinSecurityService.unlockAndResetPin({
        targetType: 'teacher',
        targetId: selectedTeacherForPin.id,
        newPin: undefined,
        unlockedByName: currentUser?.name || 'School Principal',
      });
      success(`Security PIN removed for ${selectedTeacherForPin.first_name}. Teacher can now log in without a PIN.`);
      setIsPinModalOpen(false);
      setSelectedTeacherForPin(null);
      loadData();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to remove PIN');
    } finally {
      setIsSavingPin(false);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      `${t.first_name} ${t.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      t.employee_number.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" /> Teachers & Faculty
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportTeachersToCsv(filteredTeachers, currentSchool?.name)}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedTeacherForCoverage(null);
              setIsCoverageModalOpen(true);
            }}
            leftIcon={<UserCheck className="w-4 h-4 text-indigo-600" />}
            className="text-xs font-semibold"
          >
            + Assign Coverage
          </Button>

          <Link href="/admin/teachers/new">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              + Add Teacher
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <SearchFilterBar
        searchPlaceholder="Search teacher name, employee ID, or email..."
        searchQuery={search}
        onSearchChange={setSearch}
        filters={[
          {
            id: 'status',
            label: 'Status',
            options: [
              {
                label: 'All Statuses',
                value: '',
              },
              {
                label: 'Active Only',
                value: 'active',
              },
              {
                label: 'Inactive',
                value: 'inactive',
              },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
      />

      {/* Teachers Directory List */}
      {isLoading ? (
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <TableSkeleton rows={4} cols={7} />
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-4">No teachers found matching criteria.</p>
          <Link href="/admin/teachers/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Add First Teacher
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3.5">Teacher</th>
                  <th className="px-4 py-3.5">Assigned Classes & Subjects</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      <Link
                        href={`/admin/teachers/${teacher.id}`}
                        className="inline-flex items-center gap-2.5 group hover:text-indigo-600 transition-colors"
                        title="Click to view full teacher profile & details"
                      >
                        {teacher.photo_url ? (
                          <img
                            src={teacher.photo_url}
                            alt={teacher.first_name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 group-hover:border-indigo-400 transition-colors"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs group-hover:bg-indigo-700 transition-colors">
                            {teacher.first_name?.[0] || 'T'}
                            {teacher.last_name ? teacher.last_name[0] : ''}
                          </div>
                        )}
                        <span className="group-hover:underline">
                          {teacher.first_name} {teacher.last_name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      {teacher.assignments && teacher.assignments.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {Array.from(
                            new Map(
                              (teacher.assignments || []).map((a) => [
                                `${a.class_id || a.class_name}_${a.section_id || a.section_name}_${a.subject_id || a.subject_name}`,
                                a,
                              ])
                            ).values()
                          ).map((a) => (
                            <span
                              key={a.id}
                              className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200"
                            >
                              <BookOpen className="w-2.5 h-2.5 text-indigo-600" />
                              <span>
                                {a.class_name}{a.section_name ? ` (${a.section_name})` : ''} - {a.subject_name}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No classes assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={teacher.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. VIEW */}
                        <Link href={`/admin/teachers/${teacher.id}`}>
                          <Button
                            variant="outline"
                            size="xs"
                            leftIcon={<Eye className="w-3 h-3 text-slate-500" />}
                          >
                            View
                          </Button>
                        </Link>

                        {/* 2. RECORD SALARY ADJUSTMENT */}
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setSelectedTeacherForAdjustment(teacher);
                            setIsAdjustmentModalOpen(true);
                          }}
                          leftIcon={<IndianRupee className="w-3 h-3 text-emerald-600" />}
                          className="text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                          title="Record Reimbursement or Deduction"
                        >
                          ± Adjust
                        </Button>

                        {/* 3. ASSIGN COVERAGE */}
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setSelectedTeacherForCoverage(teacher);
                            setIsCoverageModalOpen(true);
                          }}
                          leftIcon={<UserCheck className="w-3 h-3 text-indigo-600" />}
                          className="text-indigo-700 hover:bg-indigo-50 border-indigo-200"
                          title="Assign Temporary Leave Coverage"
                        >
                          Cover
                        </Button>

                        {/* 4. EDIT */}
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenEditModal(teacher)}
                          leftIcon={<Edit3 className="w-3 h-3 text-slate-600" />}
                        >
                          Edit
                        </Button>

                        {/* 5. ASSIGN CLASS */}
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setIsAssignModalOpen(true);
                          }}
                          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-semibold"
                          title="Assign Class & Subject"
                        >
                          + Class
                        </Button>

                        {/* 6. DEACTIVATE / ACTIVATE */}
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleToggleStatus(teacher)}
                          className={teacher.status === 'active' ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'}
                        >
                          {teacher.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>

                        {/* 7. 5-DIGIT PIN RESET & UNLOCK */}
                        <Button
                          variant={teacher.is_pin_locked ? 'danger' : 'ghost'}
                          size="xs"
                          onClick={() => handleOpenTeacherPinModal(teacher)}
                          title="Configure 5-Digit Security PIN / Unlock"
                          leftIcon={<KeyRound className="w-3 h-3" />}
                        >
                          {teacher.is_pin_locked ? '🔒 Locked' : 'PIN'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredTeachers.map((teacher) => (
              <div key={teacher.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <Link
                    href={`/admin/teachers/${teacher.id}`}
                    className="flex items-center gap-2.5 group"
                  >
                    {teacher.photo_url ? (
                      <img
                        src={teacher.photo_url}
                        alt={teacher.first_name}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                        {teacher.first_name?.[0] || 'T'}
                        {teacher.last_name ? teacher.last_name[0] : ''}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 group-hover:underline">
                        {teacher.first_name} {teacher.last_name}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {teacher.assignments?.length || 0} class assignments
                      </p>
                    </div>
                  </Link>
                  <StatusBadge status={teacher.status} />
                </div>

                {teacher.assignments && teacher.assignments.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {teacher.assignments.map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200"
                      >
                        <BookOpen className="w-2.5 h-2.5 text-indigo-600" />
                        <span>
                          {a.class_name}{a.section_name ? ` (${a.section_name})` : ''} - {a.subject_name}
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2">
                  <Link href={`/admin/teachers/${teacher.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditModal(teacher)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setIsAssignModalOpen(true);
                    }}
                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-semibold"
                  >
                    + Assign Class
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Edit Teacher Modal */}
      {isEditModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Teacher: ${editForm.firstName} ${editForm.lastName}`}
          description="Update personal details, contact info, employee ID, and status"
        >
          <form onSubmit={handleUpdateTeacherSubmit} className="space-y-4 text-left text-xs">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                required
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                placeholder="e.g. Rajesh"
              />
              <Input
                label="Last Name"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                placeholder="e.g. Sharma (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Employee ID"
                readOnly
                value={editForm.employeeNumber}
                helperText="Permanent school identifier; it is not a login credential."
              />
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employment Status *</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Teacher['status'] })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                >
                  <option value="active">Active (Full Portal Access)</option>
                  <option value="inactive">Inactive (Suspended)</option>
                  <option value="on_leave">On Extended Leave</option>
                </select>
              </div>
            </div>

            <PhotoUpload
              label="Faculty Photo (Optional)"
              currentPhotoUrl={editForm.photoUrl}
              onPhotoChange={(url) => setEditForm({ ...editForm, photoUrl: url || '' })}
              helperText="Recommended: 1:1 square photo (auto-crops on upload)"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Teacher Google Email (For Sign-In) *
                </label>
                {!isEditingEmail && editForm.email ? (
                  <div className="p-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs font-mono font-medium text-slate-800 truncate" title={editForm.email}>
                        {editForm.email}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingEmail(true);
                        setIsEditEmailAvailable(null);
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 shrink-0 px-2 py-0.5 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
                    >
                      Change Email
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <GoogleEmailInput
                      label=""
                      required
                      value={editForm.email}
                      onChange={(val) => setEditForm({ ...editForm, email: val })}
                      targetSchoolId={schoolId}
                      targetRole="teacher"
                      excludeEmail={editOriginalEmail}
                      onValidationChange={(valid, available, checking) => {
                        setIsEditEmailValid(valid);
                        setIsEditEmailAvailable(available);
                        setIsEditEmailChecking(checking);
                      }}
                      placeholder="teacher.name@gmail.com"
                      id="teacher-edit-email-input"
                    />
                    {isEditingEmail && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditForm({ ...editForm, email: editOriginalEmail });
                          setIsEditingEmail(false);
                          setIsEditEmailValid(true);
                          setIsEditEmailAvailable(true);
                        }}
                        className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                      >
                        Keep original email
                      </button>
                    )}
                  </div>
                )}
              </div>
              <Input
                label="Phone Number"
                required
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>

            <Input
              label="Joining Date"
              type="date"
              value={editForm.joiningDate}
              onChange={(e) => setEditForm({ ...editForm, joiningDate: e.target.value })}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isEditEmailChecking || (isEditingEmail && isEditEmailAvailable === false)}
              >
                Save Teacher Details
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Teacher Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Faculty Member"
        description="Create a faculty profile with a unique school employee ID"
      >
        <form onSubmit={handleCreateTeacher} className="space-y-4 text-left text-xs">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              required
              value={newTeacher.firstName}
              onChange={(e) => setNewTeacher({ ...newTeacher, firstName: e.target.value })}
              placeholder="e.g. Rajesh"
            />
            <Input
              label="Last Name"
              value={newTeacher.lastName}
              onChange={(e) => setNewTeacher({ ...newTeacher, lastName: e.target.value })}
              placeholder="e.g. Sharma (optional)"
            />
          </div>

          <PhotoUpload
            label="Faculty Photo (Optional)"
            currentPhotoUrl={newTeacher.photoUrl}
            onPhotoChange={(url) => setNewTeacher({ ...newTeacher, photoUrl: url || '' })}
            helperText="Recommended: 1:1 square photo (auto-crops on upload)"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Employee ID"
              required
              readOnly
              value={newTeacher.employeeNumber}
              helperText="Automatically assigned school teacher identifier; this is not a login credential."
            />
            <Input
              label="Monthly Salary (₹)"
              type="number"
              value={newTeacher.monthlySalary}
              onChange={(e) => setNewTeacher({ ...newTeacher, monthlySalary: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <GoogleEmailInput
              label="Teacher Google Email (For Sign-In)"
              required
              value={newTeacher.email}
              onChange={(val) => setNewTeacher({ ...newTeacher, email: val })}
              targetSchoolId={schoolId}
              targetRole="teacher"
              onValidationChange={(valid, available, checking) => {
                setIsEmailValid(valid);
                setIsEmailAvailable(available);
                setIsEmailChecking(checking);
              }}
              placeholder="teacher.name@gmail.com"
              helperText="Valid @gmail.com required for Google Sign-In"
              id="teacher-create-email-input"
            />
            <Input
              label="Phone Number"
              required
              value={newTeacher.phone}
              onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
            />
          </div>

          <Input
            label="Joining Date"
            type="date"
            required
            value={newTeacher.joiningDate}
            onChange={(e) => setNewTeacher({ ...newTeacher, joiningDate: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isEmailChecking || isEmailAvailable === false}
            >
              Create Teacher Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Class / Subject Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Class & Subject: ${selectedTeacher?.first_name} ${selectedTeacher?.last_name}`}
        description="Select a class and subject; section is optional"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-left text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Class *</label>
            <select
              value={assignmentData.classId}
              onChange={(e) => setAssignmentData({ ...assignmentData, classId: e.target.value, sectionId: '' })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Section (Optional)</label>
            <select
              value={assignmentData.sectionId}
              onChange={(e) => setAssignmentData({ ...assignmentData, sectionId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
            >
              <option value="">Whole class / All sections</option>
              {sections
                .filter((s) => !assignmentData.classId || s.class_id === assignmentData.classId)
                .map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    Section {sec.name} {sec.room_number ? `(Room ${sec.room_number})` : ''}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Subject *</label>
            <select
              value={assignmentData.subjectId}
              onChange={(e) => setAssignmentData({ ...assignmentData, subjectId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5-Digit PIN Management Modal */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title={`Configure Security PIN: ${selectedTeacherForPin?.first_name} ${selectedTeacherForPin?.last_name}`}
        description="Set or remove the optional 5-digit PIN for this teacher's web and mobile portal access"
      >
        <form onSubmit={handleResetTeacherPin} className="space-y-4 text-left">
          <Input
            label="5-Digit Security PIN (Optional)"
            maxLength={5}
            value={teacherPinInput}
            onChange={(e) => setTeacherPinInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="e.g. 12345 (Leave blank if no PIN)"
            helperText="Optional. If set, teacher must enter this 5-digit PIN to access portal. Leave blank for immediate access without PIN."
          />

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              Assigning a PIN is completely optional. If assigned, 5 consecutive failed attempts will lock the account until you reset or unlock it here.
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100">
            {selectedTeacherForPin?.security_pin ? (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleRemoveTeacherPin}
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
      {selectedTeacherForAdjustment && (
        <SalaryAdjustmentModal
          isOpen={isAdjustmentModalOpen}
          onClose={() => {
            setIsAdjustmentModalOpen(false);
            setSelectedTeacherForAdjustment(null);
          }}
          onSuccess={() => loadData()}
          employee={{
            id: selectedTeacherForAdjustment.id,
            name: `${selectedTeacherForAdjustment.first_name} ${selectedTeacherForAdjustment.last_name}`,
            role: 'teacher',
            employeeNumber: selectedTeacherForAdjustment.employee_number,
            baseSalary: selectedTeacherForAdjustment.monthly_salary || 35000,
            department: 'Academics',
          }}
        />
      )}

      {/* Temporary Coverage Modal */}
      <TemporaryAssignmentModal
        isOpen={isCoverageModalOpen}
        onClose={() => {
          setIsCoverageModalOpen(false);
          setSelectedTeacherForCoverage(null);
        }}
        onSuccess={() => loadData()}
        preselectedAbsentMember={
          selectedTeacherForCoverage
            ? {
                id: selectedTeacherForCoverage.id,
                name: `${selectedTeacherForCoverage.first_name} ${selectedTeacherForCoverage.last_name}`,
                role: 'teacher',
                employeeNumber: selectedTeacherForCoverage.employee_number,
              }
            : undefined
        }
      />
    </div>
  );
}
