'use client';

// ============================================================================
// School Admin Student Leave Management with Searchable Student Selector
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { leaveService, studentService, classService } from '@/lib/services/api';
import { StudentLeave, Student, LeaveType, SchoolClass } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils/formatters';
import {
  Clock,
  Plus,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Search,
  CheckCircle2,
  GraduationCap,
  Filter,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

export default function StudentLeavesPage() {
  const { currentSchool, currentYear, currentUser } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const yearId = currentYear?.id || 'ay-2026';
  const { success, error: toastError } = useToast();

  const [leaves, setLeaves] = useState<StudentLeave[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Table Search & Filter
  const [tableSearch, setTableSearch] = useState('');
  const [tableClassFilter, setTableClassFilter] = useState('');

  // Add Leave Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalClassFilter, setModalClassFilter] = useState('');
  const [formData, setFormData] = useState<{
    studentId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
  }>({
    studentId: '',
    leaveType: 'full_day',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [leaveList, studentList, classList] = await Promise.all([
        leaveService.getLeaves(schoolId),
        studentService.getStudents(schoolId),
        classService.getClasses(schoolId),
      ]);
      setLeaves(leaveList);
      setStudents(studentList);
      setClasses(classList);
      if (studentList.length > 0 && !formData.studentId) {
        setFormData((prev) => ({ ...prev, studentId: studentList[0].id }));
      }
    } catch {
      toastError('Failed to load student leaves');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId]);

  // Filtered Students for the Modal Selector (Search by Reg No or Name)
  const filteredModalStudents = useMemo(() => {
    return students.filter((st) => {
      if (modalClassFilter && st.current_enrollment?.class_id !== modalClassFilter) {
        return false;
      }
      if (!modalSearchQuery.trim()) return true;
      const q = modalSearchQuery.toLowerCase();
      const fullName = `${st.first_name} ${st.last_name}`.toLowerCase();
      const regNo = (st.registration_number || '').toLowerCase();
      const rollNo = (st.current_enrollment?.roll_number || '').toString().toLowerCase();
      const className = (st.current_enrollment?.class_name || '').toLowerCase();
      return (
        fullName.includes(q) ||
        regNo.includes(q) ||
        rollNo.includes(q) ||
        className.includes(q)
      );
    });
  }, [students, modalSearchQuery, modalClassFilter]);

  // Selected Student Object
  const selectedStudent = useMemo(() => {
    return students.find((st) => st.id === formData.studentId) || null;
  }, [students, formData.studentId]);

  // Filtered Leaves for Main Table
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      if (tableClassFilter && !l.class_name?.toLowerCase().includes(tableClassFilter.toLowerCase())) {
        return false;
      }
      if (!tableSearch.trim()) return true;
      const q = tableSearch.toLowerCase();
      const name = (l.student_name || '').toLowerCase();
      const reg = (l.registration_number || '').toLowerCase();
      const reason = (l.reason || '').toLowerCase();
      return name.includes(q) || reg.includes(q) || reason.includes(q);
    });
  }, [leaves, tableSearch, tableClassFilter]);

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId) {
      toastError('Please select a student');
      return;
    }
    if (!formData.reason.trim()) {
      toastError('Please provide a reason for leave');
      return;
    }

    const student = students.find((s) => s.id === formData.studentId);
    if (!student) return;

    setIsSubmitting(true);
    try {
      await leaveService.createLeave({
        school_id: schoolId,
        student_id: formData.studentId,
        academic_year_id: yearId,
        leave_type: formData.leaveType,
        start_date: formData.startDate,
        end_date: formData.endDate,
        reason: formData.reason.trim(),
        status: 'approved',
        approved_by: currentUser?.id,
        student_name: `${student.first_name} ${student.last_name}`,
        registration_number: student.registration_number,
        class_name: student.current_enrollment?.class_name,
        section_name: student.current_enrollment?.section_name,
        roll_number: student.current_enrollment?.roll_number,
      });

      success(`Approved leave recorded for ${student.first_name}!`);
      setIsModalOpen(false);
      setFormData({
        studentId: students[0]?.id || '',
        leaveType: 'full_day',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
      });
      loadData();
    } catch {
      toastError('Failed to record student leave');
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 text-left w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Approved Leaves</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setModalSearchQuery('');
              setModalClassFilter('');
              setFormData((prev) => ({
                ...prev,
                studentId: students[0]?.id || '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                reason: '',
              }));
              setIsModalOpen(true);
            }}
          >
            Sanction Student Leave
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leaves by student name or registration number..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Total:</span>
          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
            {filteredLeaves.length} leaves
          </span>
        </div>
      </div>

      {/* Leaves List Table */}
      {isLoading ? (
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <TableSkeleton rows={5} cols={5} />
        </div>
      ) : filteredLeaves.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-900 mb-1">No student leaves found</p>
          <p className="text-xs text-slate-400">Click "Sanction Student Leave" to record pre-approved absences.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Class & Roll</th>
                  <th className="px-5 py-3">Leave Period</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLeaves.map((l) => {
                  const isActiveNow = todayStr >= l.start_date && todayStr <= l.end_date;

                  return (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900 block">{l.student_name || 'Student'}</span>
                        <span className="text-[11px] font-mono text-slate-400">{l.registration_number}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {l.class_name} {l.section_name ? `(${l.section_name})` : ''} • Roll {l.roll_number || '1'}
                      </td>
                      <td className="px-5 py-3.5 font-medium">
                        {l.start_date === l.end_date
                          ? formatDate(l.start_date)
                          : `${formatDate(l.start_date)} - ${formatDate(l.end_date)}`}
                      </td>
                      <td className="px-5 py-3.5 capitalize">{l.leave_type.replace('_', ' ')}</td>
                      <td className="px-5 py-3.5 text-slate-600 italic">{l.reason}</td>
                      <td className="px-5 py-3.5 text-right">
                        {isActiveNow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                            Currently Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                            {l.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sanction Leave Modal with Searchable Student Selector */}
      {isModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          title="Sanction Student Leave"
          description="Record an approved student leave to prevent unjustified absence marks"
        >
          <form onSubmit={handleCreateLeave} className="space-y-4 text-xs text-left">
            {/* Searchable Student Selector */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700">
                Select Student (Search by Name or Registration Number) <span className="text-rose-500">*</span>
              </label>

              {/* Class Filter & Search Input */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Type Student Name or Reg No (e.g. 2026-00246)..."
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  {modalSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setModalSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {classes.length > 0 && (
                  <select
                    value={modalClassFilter}
                    onChange={(e) => setModalClassFilter(e.target.value)}
                    className="px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="">All Classes</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Scrollable Student Candidate List */}
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-slate-200 bg-slate-50/50 p-1.5">
                {filteredModalStudents.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No student found matching "{modalSearchQuery}"
                  </div>
                ) : (
                  filteredModalStudents.map((st) => {
                    const isSelected = formData.studentId === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, studentId: st.id })}
                        className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border border-indigo-300 text-indigo-900 shadow-2xs'
                            : 'bg-white hover:bg-slate-100 border border-transparent text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {st.photo_url ? (
                            <img
                              src={st.photo_url}
                              alt=""
                              className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                              {st.first_name?.[0] || 'S'}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-xs truncate">
                                {st.first_name} {st.last_name}
                              </span>
                              <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                                {st.current_enrollment?.class_name || 'Class 1'}
                                {st.current_enrollment?.section_name ? ` (${st.current_enrollment.section_name})` : ''}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 block">
                              Reg No: {st.registration_number || 'N/A'} • Roll #{st.current_enrollment?.roll_number || '1'}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-1 text-indigo-600 font-bold text-xs shrink-0 pr-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Selected</span>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Selected Student Confirmation Banner */}
              {selectedStudent && (
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between text-xs text-indigo-900">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">Selected Student:</span>
                    <strong className="font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</strong>
                    <span className="font-mono text-[11px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-semibold">
                      {selectedStudent.registration_number}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    {selectedStudent.current_enrollment?.class_name || 'Class 1'}
                  </span>
                </div>
              )}
            </div>

            {/* Leave Type */}
            <Select
              label="Leave Type"
              value={formData.leaveType}
              onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as LeaveType })}
            >
              <option value="full_day">Full Day Leave</option>
              <option value="partial_day">Partial Day (Early departure / Late arrival)</option>
            </Select>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                required
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    startDate: e.target.value,
                    endDate: formData.endDate < e.target.value ? e.target.value : formData.endDate,
                  })
                }
              />
              <Input
                label="End Date"
                type="date"
                required
                min={formData.startDate}
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            {/* Reason */}
            <Input
              label="Reason for Leave"
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Family Function or Medical recovery"
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Approve Leave
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

