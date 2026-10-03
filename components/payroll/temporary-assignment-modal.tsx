'use client';

// ============================================================================
// Modal: Assign Temporary Work Coverage (One Role Rule & Same-Role Substitution)
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/context/auth-context';
import {
  temporaryAssignmentService,
  teacherService,
  staffService,
} from '@/lib/services/api';
import {
  TemporaryAssignment,
  TemporaryAssignmentType,
  Teacher,
  Staff,
} from '@/lib/types';
import {
  Users,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Briefcase,
  BookOpen,
  Truck,
  CheckCircle2,
  Search,
} from 'lucide-react';

interface TemporaryAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (assignment: TemporaryAssignment) => void;
  preselectedAbsentMember?: {
    id: string;
    name: string;
    role: string;
    employeeNumber?: string;
  };
  initialDates?: {
    startDate?: string;
    endDate?: string;
  };
}

interface MemberOption {
  id: string;
  name: string;
  role: string;
  employeeNumber: string;
  department?: string;
  type: 'teacher' | 'staff' | 'driver';
}

export function TemporaryAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedAbsentMember,
  initialDates,
}: TemporaryAssignmentModalProps) {
  const { currentSchool, currentUser } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  // Form State
  const [absentMemberId, setAbsentMemberId] = useState('');
  const [replacementMemberId, setReplacementMemberId] = useState('');
  const [assignmentType, setAssignmentType] = useState<TemporaryAssignmentType>('class_attendance_coverage');
  const [startDate, setStartDate] = useState(
    initialDates?.startDate || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    initialDates?.endDate || new Date().toISOString().split('T')[0]
  );
  const [dutyDetails, setDutyDetails] = useState('');
  const [notes, setNotes] = useState('');

  // Cross-Role Emergency Override State
  const [isEmergencyOverride, setIsEmergencyOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load active personnel
  useEffect(() => {
    if (isOpen && schoolId) {
      setIsLoadingMembers(true);
      Promise.all([
        teacherService.getTeachers(schoolId, { status: 'active' }),
        staffService.getStaff(schoolId, { status: 'active' }),
      ])
        .then(([tList, sList]) => {
          setTeachers(tList);
          setStaffList(sList);
          if (preselectedAbsentMember) {
            setAbsentMemberId(preselectedAbsentMember.id);
          } else if (tList.length > 0) {
            setAbsentMemberId(tList[0].id);
          }
        })
        .finally(() => setIsLoadingMembers(false));
    }
  }, [isOpen, schoolId, preselectedAbsentMember]);

  // Combine unified member options
  const allMembers: MemberOption[] = useMemo(() => {
    const list: MemberOption[] = [];
    teachers.forEach((t) => {
      list.push({
        id: t.id,
        name: `${t.first_name} ${t.last_name}`,
        role: 'teacher',
        employeeNumber: t.employee_number || 'TCH',
        department: 'Academics',
        type: 'teacher',
      });
    });
    staffList.forEach((s) => {
      const isDriver = s.staff_type === 'driver';
      list.push({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        role: isDriver ? 'driver' : s.staff_type,
        employeeNumber: s.employee_number || 'STF',
        department: s.department || 'General Administration',
        type: isDriver ? 'driver' : 'staff',
      });
    });
    return list;
  }, [teachers, staffList]);

  // Selected absent member object
  const selectedAbsentMember = useMemo(() => {
    return allMembers.find((m) => m.id === absentMemberId) || null;
  }, [allMembers, absentMemberId]);

  // Filter replacement candidates (prefer same role, exclude absent person)
  const replacementCandidates = useMemo(() => {
    if (!selectedAbsentMember) return allMembers;
    return allMembers.filter((m) => m.id !== selectedAbsentMember.id);
  }, [allMembers, selectedAbsentMember]);

  // Pre-select replacement candidate with matching role when absent person changes
  useEffect(() => {
    if (selectedAbsentMember) {
      const sameRoleMatch = replacementCandidates.find(
        (m) => m.role === selectedAbsentMember.role || m.type === selectedAbsentMember.type
      );
      if (sameRoleMatch) {
        setReplacementMemberId(sameRoleMatch.id);
      } else if (replacementCandidates.length > 0) {
        setReplacementMemberId(replacementCandidates[0].id);
      }

      // Auto set assignment type according to role
      if (selectedAbsentMember.type === 'teacher') {
        setAssignmentType('class_attendance_coverage');
      } else if (selectedAbsentMember.type === 'driver') {
        setAssignmentType('transport_route_coverage');
      } else {
        setAssignmentType('other_duty_coverage');
      }
    }
  }, [selectedAbsentMember]);

  const selectedReplacementMember = useMemo(() => {
    return allMembers.find((m) => m.id === replacementMemberId) || null;
  }, [allMembers, replacementMemberId]);

  // Is cross-role substitution
  const isCrossRole = useMemo(() => {
    if (!selectedAbsentMember || !selectedReplacementMember) return false;
    const roleA = (selectedAbsentMember.role || selectedAbsentMember.type).toLowerCase();
    const roleB = (selectedReplacementMember.role || selectedReplacementMember.type).toLowerCase();
    return roleA !== roleB;
  }, [selectedAbsentMember, selectedReplacementMember]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAbsentMember || !selectedReplacementMember) {
      toastError('Please select both the absent employee and replacement employee');
      return;
    }
    if (endDate < startDate) {
      toastError('End date cannot be earlier than start date');
      return;
    }
    if (!dutyDetails.trim()) {
      toastError('Please describe the specific coverage duty details');
      return;
    }

    if (isCrossRole) {
      if (!isEmergencyOverride) {
        toastError(
          'Cross-role substitution is not allowed normally. Please confirm the Administrator Emergency Override checkbox.'
        );
        return;
      }
      if (!overrideReason.trim()) {
        toastError('Please provide an emergency justification for this cross-role substitution');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const created = await temporaryAssignmentService.createAssignment(
        schoolId,
        {
          absent_employee_id: selectedAbsentMember.id,
          absent_employee_name: selectedAbsentMember.name,
          absent_employee_role: selectedAbsentMember.role,
          replacement_employee_id: selectedReplacementMember.id,
          replacement_employee_name: selectedReplacementMember.name,
          replacement_employee_role: selectedReplacementMember.role,
          assignment_type: assignmentType,
          start_date: startDate,
          end_date: endDate,
          status: 'active',
          duty_details: dutyDetails.trim(),
          notes: notes.trim() || null,
          is_emergency_override: isCrossRole ? isEmergencyOverride : false,
          override_reason: isCrossRole ? overrideReason.trim() : null,
        },
        currentUser || undefined
      );

      success(
        `Temporary coverage assigned: ${selectedReplacementMember.name} covering for ${selectedAbsentMember.name}`
      );
      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to create temporary assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Temporary Work Coverage"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-left max-h-[78vh] overflow-y-auto pr-1">
        {/* Core Business Rule Banner */}
        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-900 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
          <div className="text-[11px] leading-snug">
            <strong>Single Role Preservation:</strong> Users maintain exactly one primary role in the ERP. Leave coverage is recorded as a temporary assignment without altering user logins or security boundaries.
          </div>
        </div>

        {/* Step 1: Absent Employee & Replacement Employee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Absent Employee */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Absent Employee (On Leave) <span className="text-rose-500">*</span>
            </label>
            <select
              value={absentMemberId}
              onChange={(e) => setAbsentMemberId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:outline-none focus:border-indigo-500"
            >
              <optgroup label="Teachers & Faculty">
                {allMembers
                  .filter((m) => m.type === 'teacher')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.employeeNumber}) - Faculty
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Staff & Drivers">
                {allMembers
                  .filter((m) => m.type !== 'teacher')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.employeeNumber}) - {m.role}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Replacement Employee */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Replacement Employee (Covering Work) <span className="text-rose-500">*</span>
            </label>
            <select
              value={replacementMemberId}
              onChange={(e) => setReplacementMemberId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:outline-none focus:border-indigo-500"
            >
              <optgroup label="Preferred Same-Role Candidates">
                {replacementCandidates
                  .filter(
                    (m) =>
                      selectedAbsentMember &&
                      (m.role === selectedAbsentMember.role || m.type === selectedAbsentMember.type)
                  )
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      ⭐ {m.name} ({m.employeeNumber}) - {m.role}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Other Staff (Cross-Role Requires Override)">
                {replacementCandidates
                  .filter(
                    (m) =>
                      selectedAbsentMember &&
                      m.role !== selectedAbsentMember.role &&
                      m.type !== selectedAbsentMember.type
                  )
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      ⚠️ {m.name} ({m.employeeNumber}) - {m.role}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Step 2: Assignment Type */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Assignment Type <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                type: 'class_attendance_coverage',
                label: 'Class Attendance Coverage',
                desc: 'Take morning roll call and class duties',
                icon: BookOpen,
              },
              {
                type: 'subject_coverage',
                label: 'Subject / Period Proxy',
                desc: 'Conduct lectures for absent faculty',
                icon: Briefcase,
              },
              {
                type: 'transport_route_coverage',
                label: 'Transport Route Coverage',
                desc: 'Operate assigned bus route / vehicle',
                icon: Truck,
              },
              {
                type: 'other_duty_coverage',
                label: 'Other Duty Coverage',
                desc: 'Support, office, or gate security proxy',
                icon: Users,
              },
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = assignmentType === opt.type;
              return (
                <div
                  key={opt.type}
                  onClick={() => setAssignmentType(opt.type as TemporaryAssignmentType)}
                  className={`p-2.5 rounded-xl border cursor-pointer flex items-start gap-2 transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600 text-indigo-950 font-semibold'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-xs block">{opt.label}</span>
                    <span className="text-[10px] text-slate-500 font-normal leading-tight block">{opt.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Date Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input
              label="Start Date"
              type="date"
              required
              value={startDate}
              onChange={(e) => {
                const s = e.target.value;
                setStartDate(s);
                if (endDate < s) setEndDate(s);
              }}
              className="text-xs"
            />
          </div>
          <div>
            <Input
              label="End Date"
              type="date"
              required
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        {/* Step 4: Duty Details */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Duty Details & Specifics <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder={
              selectedAbsentMember?.type === 'teacher'
                ? 'e.g. Class 8A Morning Attendance & Mathematics Periods 1-2'
                : selectedAbsentMember?.type === 'driver'
                ? 'e.g. Route 2 (South Extension Bus 04 Morning 07:00 AM shift)'
                : 'e.g. Front desk reception visitor log and fee counter'
            }
            value={dutyDetails}
            onChange={(e) => setDutyDetails(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Step 5: Handover Notes */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Handover Instructions / Notes (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Handover notes, keys handed over, lesson syllabus or special instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Cross-Role Emergency Override Box */}
        {isCrossRole && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="text-[11px] leading-tight">
                <strong>Cross-Role Substitution Warning:</strong> You are assigning a{' '}
                <span className="font-bold underline">{selectedReplacementMember?.role}</span> to cover for a{' '}
                <span className="font-bold underline">{selectedAbsentMember?.role}</span>. Cross-role substitutions are not allowed normally and require administrator emergency authorization.
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-amber-950 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isEmergencyOverride}
                onChange={(e) => setIsEmergencyOverride(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <span>Authorize Administrator Emergency Override</span>
            </label>

            {isEmergencyOverride && (
              <div>
                <label className="block font-semibold text-amber-950 mb-1 text-[11px]">
                  Emergency Override Justification / Reason <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unforeseen staff shortage; authorized under principal supervision"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs text-slate-800"
                />
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Create Assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
