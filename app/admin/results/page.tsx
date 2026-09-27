'use client';

// ============================================================================
// Marks Entry Sheet & Results Publishing Center
// ============================================================================

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { examService, studentService } from '@/lib/services/api';
import { Exam, Student, ExamResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils/formatters';
import {
  FileCheck2,
  Save,
  Send,
  AlertCircle,
  Award,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

function MarksEntryContent() {
  const searchParams = useSearchParams();
  const examIdParam = searchParams.get('examId');

  const { currentSchool } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [marksState, setMarksState] = useState<
    Record<string, { marks: string; absent: boolean; remarks: string }>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);

  useEffect(() => {
    async function loadExamsList() {
      setIsLoading(true);
      try {
        const exList = await examService.getExams(schoolId);
        setExams(exList);
        const defaultId = examIdParam || (exList[0]?.id ?? '');
        setSelectedExamId(defaultId);
      } catch {
        toastError('Failed to load exams');
      } finally {
        setIsLoading(false);
      }
    }
    loadExamsList();
  }, [schoolId, examIdParam]);

  useEffect(() => {
    if (!selectedExamId) return;

    async function loadExamAndMarks() {
      setIsLoading(true);
      try {
        const [exam, allStudents, existingResults] = await Promise.all([
          examService.getExamById(selectedExamId),
          studentService.getStudents(schoolId),
          examService.getExamResults(selectedExamId),
        ]);

        setSelectedExam(exam);

        // Filter students in the exam class
        const targetStudents = allStudents.filter(
          (s: Student) =>
            s.current_enrollment?.class_id === exam?.class_id &&
            s.current_enrollment?.section_id === exam?.section_id
        );
        setStudents(targetStudents.length > 0 ? targetStudents : allStudents.slice(0, 4));

        // Build marks map
        const stateMap: Record<string, { marks: string; absent: boolean; remarks: string }> = {};
        targetStudents.forEach((st: Student) => {
          const res = existingResults.find((r: ExamResult) => r.student_id === st.id);
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

    loadExamAndMarks();
  }, [selectedExamId, schoolId]);

  const handleMarkChange = (studentId: string, val: string) => {
    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marks: val,
        absent: false,
      },
    }));
  };

  const handleAbsentToggle = (studentId: string, absent: boolean) => {
    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        absent,
        marks: absent ? '' : prev[studentId]?.marks || '',
      },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const handleSaveMarks = async (publish = false) => {
    if (!selectedExam) return;

    // Validate marks obtained <= max marks
    for (const [stId, data] of Object.entries(marksState)) {
      if (!data.absent && data.marks !== '') {
        const num = parseFloat(data.marks);
        if (isNaN(num) || num < 0 || num > selectedExam.max_marks) {
          const st = students.find((s) => s.id === stId);
          toastError(
            `Invalid marks for ${st?.first_name || 'student'}. Must be between 0 and ${selectedExam.max_marks}`
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
        success('Marks saved and results published to students!');
        setSelectedExam((prev) => (prev ? { ...prev, status: 'published' } : null));
      } else {
        success('Marks draft saved successfully.');
      }
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Error saving marks');
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Marks & Results</h1>
        </div>

        {selectedExam && (
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
        )}
      </div>

      {/* Exam Selector Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
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
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
              Maximum Marks: {selectedExam.max_marks}
            </span>
            <span>Date: {formatDate(selectedExam.exam_date)}</span>
            <StatusBadge status={selectedExam.status} />
          </div>
        )}
      </div>

      {/* Marks Entry Table */}
      {isLoading ? (
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <TableSkeleton rows={4} cols={5} />
        </div>
      ) : !selectedExam ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
          Select or schedule an exam to enter marks.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Student Score Entry Roster ({students.length} Students)
            </h3>
            <span className="text-[11px] text-slate-400">
              Draft marks are private until you click "Publish Results"
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 w-16">Roll No</th>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3">Registration No</th>
                  <th className="px-5 py-3 w-36">Marks (Max {selectedExam.max_marks})</th>
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
                          onChange={(e) => handleMarkChange(student.id, e.target.value)}
                          min={0}
                          max={selectedExam.max_marks}
                          placeholder="—"
                          className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 focus:border-indigo-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={state.absent}
                            onChange={(e) => handleAbsentToggle(student.id, e.target.checked)}
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
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                          placeholder="e.g. Excellent conceptual clarity"
                          className="w-full max-w-sm px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-indigo-600 focus:outline-none text-slate-700"
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

      {/* Publish Results Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isPublishDialogOpen}
        onClose={() => setIsPublishDialogOpen(false)}
        onConfirm={() => handleSaveMarks(true)}
        title="Publish Exam Results to Students?"
        message={`Are you sure you want to publish results for "${selectedExam?.name}"? Students will immediately see their scores on the Student Portal.`}
        confirmLabel="Yes, Publish Results"
        variant="primary"
        isLoading={isSaving}
      />
    </div>
  );
}

export default function AdminResultsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={5} cols={6} />}>
      <MarksEntryContent />
    </Suspense>
  );
}
