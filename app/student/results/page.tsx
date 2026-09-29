'use client';

// ============================================================================
// Student Published Exam Results & Report Cards
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { examService } from '@/lib/services/api';
import { Exam, ExamResult } from '@/lib/types';
import { formatDate, formatPercentage } from '@/lib/utils/formatters';
import { Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

export default function StudentResultsPage() {
  const { currentUser } = useAuth();
  const studentId = currentUser?.student_id || 'std-001';

  const [results, setResults] = useState<{ exam: Exam; result: ExamResult }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      setIsLoading(true);
      try {
        const list = await examService.getPublishedResultsForStudent(studentId);
        setResults(list);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadResults();
  }, [studentId]);

  return (
    <div className="space-y-6 text-left w-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Results & Grades</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Official published examination performance reports
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <TableSkeleton rows={4} cols={4} />
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
          <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-900 mb-1">No published results available</p>
          <p className="text-xs text-slate-400">Exam scores will appear here once officially published by your teachers.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Unit Test 1 (Published Report)
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {results.map(({ exam, result }) => (
                <div key={result.id} className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">{exam.subject_name}</h4>
                    <p className="text-xs text-slate-500">Exam Date: {formatDate(exam.exam_date)}</p>
                    {result.remarks && (
                      <p className="text-xs text-slate-600 italic">Teacher feedback: "{result.remarks}"</p>
                    )}
                  </div>

                  <div className="text-right">
                    {result.absent ? (
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded">
                        ABSENT
                      </span>
                    ) : (
                      <div>
                        <span className="text-lg font-extrabold text-indigo-600">
                          {result.marks_obtained} / {exam.max_marks}
                        </span>
                        <div className="text-xs font-semibold text-emerald-600">
                          {formatPercentage(result.marks_obtained || 0, exam.max_marks)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
