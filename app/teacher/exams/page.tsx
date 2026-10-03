'use client';

// ============================================================================
// Teacher Exams Management & Marks Entry
// ============================================================================

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { examService, teacherService, studentService } from '@/lib/services/api';
import { Exam, TeacherAssignment, Student, ExamResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils/formatters';
import { Award, Plus, Save, Send, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

function TeacherExamsContent() {
  const searchParams = useSearchParams();
  const examIdParam = searchParams.get('examId');

  const { currentUser, currentSchool, currentYear } = useAuth();
  const schoolId = currentSchool?.id || currentUser?.school_id || '';
  const yearId = currentYear?.id || 'ay-2026';
  const { success, error: toastError } = useToast();

  const [exams, setExams] = useState<Exam[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [marksState, setMarksState] = useState<
    Record<string, { marks: string; absent: boolean; remarks: string }>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Unit Test 2',
    assignmentId: '',
    maxMarks: '20',
    examDate: new Date().toISOString().split('T')[0],
  });

  const loadTeacherExams = async () => {
    setIsLoading(true);
    try {
      const teacher = await teacherService.getTeacherForUser(currentUser, schoolId);
      const teacherId = teacher?.id || '';
      const [exList, asgList] = await Promise.all([
        examService.getExams(schoolId, { teacherId }),
        teacherService.getAssignments(schoolId, teacherId),
      ]);
      setExams(exList);
      setAssignments(asgList);

      const defaultId = examIdParam || (exList[0]?.id ?? '');
      setSelectedExamId(defaultId);
      if (asgList.length > 0) {
        setFormData((prev) => ({ ...prev, assignmentId: asgList[0].id }));
      }
    } catch {
      toastError('Failed to load exams');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherExams();
  }, [schoolId, currentUser, examIdParam]);

  useEffect(() => {
    if (!selectedExamId) return;

    async function loadMarksSheet() {
      setIsLoading(true);
      try {
        const [exam, allStudents, existingResults] = await Promise.all([
          examService.getExamById(selectedExamId),
          studentService.getStudents(schoolId),
          examService.getExamResults(selectedExamId),
        ]);
        setSelectedExam(exam);

        const targetStudents = allStudents.filter(
          (s: Student) =>
            s.current_enrollment?.class_id === exam?.class_id &&
            s.current_enrollment?.section_id === exam?.section_id
        );
        setStudents(targetStudents);

        const stateMap: Record<string, { marks: string; absent: boolean; remarks: string }> = {};
        targetStudents.forEach((st: Student) => {
          const res = existingResults.find((r) => r.student_id === st.id);
          stateMap[st.id] = {
            marks: res && !res.absent && res.marks_obtained !== undefined ? String(res.marks_obtained) : '',
            absent: res ? res.absent : false,
            remarks: res?.remarks || '',
          };
        });
        setMarksState(stateMap);
      } catch {
        toastError('Failed to load marks sheet');
      } finally {
        setIsLoading(false);
      }
    }

    loadMarksSheet();
  }, [selectedExamId, schoolId]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const asg = assignments.find((a) => a.id === formData.assignmentId);
    if (!asg || !formData.name.trim() || Number(formData.maxMarks) <= 0) return;

    try {
      const created = await examService.createExam({
        school_id: schoolId,
        academic_year_id: yearId,
        class_id: asg.class_id,
        section_id: asg.section_id,
        subject_id: asg.subject_id,
        teacher_id: asg.teacher_id,
        name: formData.name.trim(),
        max_marks: Number(formData.maxMarks),
        exam_date: formData.examDate,
      });

      success(`Exam "${created.name}" created!`);
      setIsCreateModalOpen(false);
      loadTeacherExams();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Error creating exam');
    }
  };

  const handleSaveMarks = async (publish = false) => {
    if (!selectedExam) return;

    for (const [stId, data] of Object.entries(marksState)) {
      if (!data.absent && data.marks !== '') {
        const num = parseFloat(data.marks);
        if (isNaN(num) || num < 0 || num > selectedExam.max_marks) {
          const st = students.find((s) => s.id === stId);
          toastError(
            `Marks for ${st?.first_name || 'student'} must be between 0 and ${selectedExam.max_marks}`
          );
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      const payload = Object.entries(marksState).map(([student_id, data]) => ({
        student_id,
        marks_obtained: data.absent ? 0 : data.marks === '' ? undefined : parseFloat(data.marks),
        absent: data.absent,
        remarks: data.remarks,
      }));

      await examService.saveExamMarks(selectedExam.id, payload, publish);
      if (publish) {
        success('Marks saved and published to students!');
        setSelectedExam((prev) => (prev ? { ...prev, status: 'published' } : null));
      } else {
        success('Marks draft saved.');
      }
    } catch {
      toastError('Error saving marks');
    } finally {
      setIsSaving(false);
      setIsPublishDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Exams & Mark Sheets</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Exam
          </Button>
        </div>
      </div>

      {/* Exam Picker Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase">Select Exam:</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-indigo-500"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} • {ex.class_name} ({ex.section_name}) - {ex.subject_name}
              </option>
            ))}
          </select>
        </div>

        {selectedExam && (
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
              Max: {selectedExam.max_marks} Marks
            </span>
            <StatusBadge status={selectedExam.status} />
          </div>
        )}
      </div>

      {/* Marks Entry Sheet */}
      {isLoading ? (
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <TableSkeleton rows={4} cols={5} />
        </div>
      ) : !selectedExam ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
          No exams found. Click "Create Exam" to schedule your first test.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {selectedExam.name} • {selectedExam.class_name} ({selectedExam.section_name}) — Marks Sheet
              </h3>
              <p className="text-[11px] text-slate-400">Date: {formatDate(selectedExam.exam_date)}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Save className="w-4 h-4" />}
                isLoading={isSaving}
                onClick={() => handleSaveMarks(false)}
              >
                Save Draft
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Send className="w-4 h-4" />}
                onClick={() => setIsPublishDialogOpen(true)}
              >
                Publish Results
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 w-16">Roll</th>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3">Registration No</th>
                  <th className="px-5 py-3 w-36">Score (Max {selectedExam.max_marks})</th>
                  <th className="px-5 py-3 w-28">Absent</th>
                  <th className="px-5 py-3">Remarks / Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.map((student) => {
                  const state = marksState[student.id] || { marks: '', absent: false, remarks: '' };

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {student.current_enrollment?.roll_number || '—'}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-500">
                        {student.registration_number}
                      </td>
                      <td className="px-5 py-3.5">
                        <input
                          type="number"
                          disabled={state.absent}
                          value={state.marks}
                          onChange={(e) =>
                            setMarksState((prev) => ({
                              ...prev,
                              [student.id]: { ...prev[student.id], marks: e.target.value, absent: false },
                            }))
                          }
                          min={0}
                          max={selectedExam.max_marks}
                          placeholder="—"
                          className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 focus:border-indigo-600 focus:outline-none disabled:bg-slate-100"
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={state.absent}
                            onChange={(e) =>
                              setMarksState((prev) => ({
                                ...prev,
                                [student.id]: {
                                  ...prev[student.id],
                                  absent: e.target.checked,
                                  marks: e.target.checked ? '' : prev[student.id]?.marks || '',
                                },
                              }))
                            }
                            className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                          />
                          <span className={state.absent ? 'font-bold text-rose-600' : 'text-slate-500'}>
                            Absent
                          </span>
                        </label>
                      </td>
                      <td className="px-5 py-3.5">
                        <input
                          type="text"
                          value={state.remarks}
                          onChange={(e) =>
                            setMarksState((prev) => ({
                              ...prev,
                              [student.id]: { ...prev[student.id], remarks: e.target.value },
                            }))
                          }
                          placeholder="Feedback remarks"
                          className="w-full max-w-sm px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Exam Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Exam for Your Assigned Class"
        description="Schedule a test and prepare the student mark entry sheet"
      >
        <form onSubmit={handleCreateExam} className="space-y-4 text-left">
          <Input
            label="Exam Title"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Unit Test 2 or Chapter 4 Quiz"
          />

          <Select
            label="Assigned Class & Subject"
            required
            value={formData.assignmentId}
            onChange={(e) => setFormData({ ...formData, assignmentId: e.target.value })}
          >
            {assignments.map((asg) => (
              <option key={asg.id} value={asg.id}>
                {asg.class_name} ({asg.section_name}) - {asg.subject_name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Maximum Marks"
              type="number"
              required
              value={formData.maxMarks}
              onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
              min={1}
              max={500}
            />
            <Input
              label="Exam Date"
              type="date"
              required
              value={formData.examDate}
              onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Exam Sheet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Publish Dialog */}
      <ConfirmDialog
        isOpen={isPublishDialogOpen}
        onClose={() => setIsPublishDialogOpen(false)}
        onConfirm={() => handleSaveMarks(true)}
        title="Publish Results to Student Portal?"
        message="Once published, students will immediately see their scores on their dashboard."
        confirmLabel="Publish to Students"
        variant="primary"
        isLoading={isSaving}
      />
    </div>
  );
}

export default function TeacherExamsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={4} cols={5} />}>
      <TeacherExamsContent />
    </Suspense>
  );
}
