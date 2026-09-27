'use client';

// ============================================================================
// Student Classes & Timetable View
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { timetableService, subjectService } from '@/lib/services/api';
import { TimetableEntry, Subject } from '@/lib/types';
import { formatTime, getDayName } from '@/lib/utils/formatters';
import { CalendarDays, BookOpen, Clock, MapPin } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

export default function StudentClassesPage() {
  const { currentSchool } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';

  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStudentSchedule() {
      setIsLoading(true);
      try {
        const [ttList, subList] = await Promise.all([
          timetableService.getTimetable(schoolId, { classId: 'cls-08', sectionId: 'sec-8a' }),
          subjectService.getSubjects(schoolId),
        ]);
        setEntries(ttList);
        setSubjects(subList);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStudentSchedule();
  }, [schoolId]);

  const days = [1, 2, 3, 4, 5, 6];

  return (
    <div className="space-y-6 text-left max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Classes & Weekly Schedule</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Class 8 • Section A — Enrolled subjects and timetable
        </p>
      </div>

      {/* Enrolled Subjects List */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Enrolled Subjects ({subjects.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {subjects.map((sub) => (
            <span
              key={sub.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs font-semibold"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>{sub.name}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      {isLoading ? (
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <TableSkeleton rows={4} cols={3} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {days.map((dayNum) => {
            const dayEntries = entries.filter((e) => e.day_of_week === dayNum);
            return (
              <div
                key={dayNum}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col"
              >
                <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider">{getDayName(dayNum)}</h4>
                  <span className="text-[10px] text-indigo-300 font-semibold">{dayEntries.length} Periods</span>
                </div>

                <div className="p-3 flex-1 space-y-2">
                  {dayEntries.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center italic">No classes</p>
                  ) : (
                    dayEntries.map((slot) => (
                      <div
                        key={slot.id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{slot.subject_name}</span>
                          <span className="font-mono text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {formatTime(slot.start_time)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{slot.teacher_name}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
