'use client';

// ============================================================================
// Teacher Personal Weekly Timetable
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { timetableService } from '@/lib/services/api';
import { TimetableEntry } from '@/lib/types';
import { formatTime, getDayName } from '@/lib/utils/formatters';
import { CalendarDays, Clock, MapPin, Trophy, BookOpen, UtensilsCrossed } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

const DAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

export default function TeacherTimetablePage() {
  const { currentUser, currentSchool } = useAuth();
  const teacherId = currentUser?.teacher_id || 'tch-001';
  const schoolId = currentSchool?.id || 'sch-001';

  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState<'today' | 'all' | number>('today');

  const getTodayDayOfWeek = (): number => {
    const d = new Date().getDay();
    return d === 0 ? 1 : d;
  };

  const todayDayNum = getTodayDayOfWeek();

  useEffect(() => {
    async function loadSchedule() {
      setIsLoading(true);
      try {
        const list = await timetableService.getTimetable(schoolId, { teacherId });
        setEntries(list);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSchedule();
  }, [schoolId, teacherId]);

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Teaching Schedule</h1>
        </div>

        {/* Day Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setDayFilter('today')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              dayFilter === 'today'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Today ({getDayName(todayDayNum).slice(0, 3)})</span>
          </button>

          <button
            onClick={() => setDayFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              dayFilter === 'all'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Full Week
          </button>

          {DAYS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDayFilter(d.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                dayFilter === d.id
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {d.short}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <TableSkeleton rows={4} cols={5} />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <CalendarDays className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No scheduled teaching periods</h3>
          <p className="text-xs text-slate-500">
            You do not have any periods assigned in the active academic timetable.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {DAYS.filter((d) => {
            if (dayFilter === 'today') return d.id === todayDayNum;
            if (dayFilter === 'all') return true;
            return d.id === dayFilter;
          }).map((d) => {
            const dayEntries = entries
              .filter((e) => e.day_of_week === d.id)
              .sort((a, b) => a.start_time.localeCompare(b.start_time));
            const isToday = d.id === todayDayNum;

            return (
              <div
                key={d.id}
                className={`bg-white rounded-xl border shadow-xs overflow-hidden flex flex-col ${
                  isToday ? 'border-indigo-300 ring-2 ring-indigo-50' : 'border-slate-200'
                }`}
              >
                <div
                  className={`p-3.5 flex items-center justify-between ${
                    isToday ? 'bg-indigo-900 text-white' : 'bg-slate-900 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider">{d.name}</h3>
                    {isToday && (
                      <span className="bg-emerald-500 text-white font-bold text-[9px] uppercase px-1.5 py-0.5 rounded">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold bg-slate-800 text-indigo-300 px-2 py-0.5 rounded">
                    {dayEntries.length} Periods
                  </span>
                </div>

                <div className="p-3.5 flex-1 space-y-2.5">
                  {dayEntries.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center italic">No classes today</p>
                  ) : (
                    dayEntries.map((slot) => {
                      const isGames = slot.slot_type === 'games';

                      return (
                        <div
                          key={slot.id}
                          className={`p-3 rounded-lg border transition-colors space-y-1 ${
                            isGames
                              ? 'bg-emerald-50/70 border-emerald-200'
                              : 'bg-slate-50 border-slate-200/80 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              {isGames ? <Trophy className="w-3 h-3 text-emerald-700" /> : null}
                              {slot.class_name ? `${slot.class_name} (${slot.section_name || 'A'})` : 'Assigned Class'}
                            </span>
                            <span className="font-mono text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 font-semibold">
                            {slot.period_name ? `${slot.period_name}: ` : ''}
                            {slot.subject_name}
                          </p>

                          {slot.room && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <MapPin className="w-3 h-3" />
                              <span>{slot.room}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
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
