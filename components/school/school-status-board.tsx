'use client';

// ============================================================================
// Clean Minimal School Operational Status Sign (OPEN / CLOSED / HOLIDAY)
// ============================================================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { holidayService, schoolService, STORAGE_KEYS } from '@/lib/services/api';
import { School, SchoolHoliday } from '@/lib/types';
import { calculateSchoolStatus } from '@/lib/utils/school-timing';
import {
  Clock,
  DoorOpen,
  DoorClosed,
  Palmtree,
  Building2,
} from 'lucide-react';

interface SchoolStatusBoardProps {
  className?: string;
}

export function SchoolStatusBoard({ className = '' }: SchoolStatusBoardProps) {
  const { currentSchool: authSchool } = useAuth();
  const [liveSchool, setLiveSchool] = useState<School | null>(authSchool);
  const [holidays, setHolidays] = useState<SchoolHoliday[]>([]);
  const [now, setNow] = useState(() => new Date());

  const refreshSchoolInfo = useCallback(async () => {
    if (!authSchool?.id) return;
    try {
      const fresh = await schoolService.getSchoolById(authSchool.id);
      if (fresh) {
        setLiveSchool((prev) => {
          if (!prev) return fresh;
          if (
            prev.id === fresh.id &&
            prev.name === fresh.name &&
            prev.code === fresh.code &&
            prev.status === fresh.status &&
            JSON.stringify(prev.school_hours) === JSON.stringify(fresh.school_hours)
          ) {
            return prev;
          }
          return fresh;
        });
      }
    } catch {
      // fallback to auth school
    }
  }, [authSchool?.id]);

  // Auto-refresh clock every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live school & holidays
  useEffect(() => {
    setLiveSchool(authSchool);
    if (!authSchool?.id) return;
    holidayService
      .getHolidays(authSchool.id)
      .then((data) => setHolidays(data || []))
      .catch(() => {});
  }, [authSchool?.id]);

  // Listen strictly to relevant storage sync events (schools or holidays only)
  useEffect(() => {
    if (!authSchool?.id) return;

    const handleSync = (e: any) => {
      const key = e?.detail?.key || e?.key;
      if (key === STORAGE_KEYS.SCHOOLS) {
        refreshSchoolInfo();
      } else if (key === STORAGE_KEYS.HOLIDAYS) {
        holidayService
          .getHolidays(authSchool.id)
          .then((data) => setHolidays(data || []))
          .catch(() => {});
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('school_erp_data_sync', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('school_erp_data_sync', handleSync);
    };
  }, [authSchool?.id, refreshSchoolInfo]);

  const targetSchool = liveSchool || authSchool;
  const status = calculateSchoolStatus(targetSchool, holidays, now);

  // Theme styling based on live status
  const theme = {
    open: {
      cardBg: 'bg-gradient-to-br from-emerald-50 to-white',
      border: 'border-emerald-200',
      badgeBg: 'bg-emerald-600 text-white',
      badgePulse: 'bg-emerald-300',
      statusText: 'text-emerald-700',
      iconBg: 'bg-emerald-100 text-emerald-700',
      label: 'School: OPEN',
      icon: DoorOpen,
    },
    closed: {
      cardBg: 'bg-gradient-to-br from-rose-50 to-white',
      border: 'border-rose-200',
      badgeBg: 'bg-rose-600 text-white',
      badgePulse: 'bg-rose-300',
      statusText: 'text-rose-700',
      iconBg: 'bg-rose-100 text-rose-700',
      label: 'School: CLOSED',
      icon: DoorClosed,
    },
    holiday: {
      cardBg: 'bg-gradient-to-br from-amber-50 to-white',
      border: 'border-amber-200',
      badgeBg: 'bg-amber-600 text-white',
      badgePulse: 'bg-amber-300',
      statusText: 'text-amber-700',
      iconBg: 'bg-amber-100 text-amber-700',
      label: 'School: HOLIDAY',
      icon: Palmtree,
    },
  }[status.status];

  const Icon = theme.icon;

  return (
    <div
      className={`bg-white rounded-xl border ${theme.border} shadow-xs overflow-hidden flex flex-col transition-all ${className}`}
    >
      {/* Header bar with Live Clock & School Name */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-xs font-bold text-slate-800 truncate">
            {targetSchool?.name || 'School Status'}{targetSchool?.code ? ` (${targetSchool.code})` : ''}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            {status.dayLabel} • {status.currentTimeStr}
          </span>
        </div>
      </div>

      {/* Clean, Bold Sign */}
      <div className={`p-6 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 ${theme.cardBg} flex-1`}>
        <div className="flex items-center gap-4 text-left">
          <div className={`w-14 h-14 rounded-2xl ${theme.iconBg} flex items-center justify-center shrink-0 shadow-xs`}>
            <Icon className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${theme.badgeBg} shadow-xs`}
              >
                <span className={`w-2 h-2 rounded-full ${theme.badgePulse} animate-ping`} />
                {status.status === 'open' ? 'OPEN' : status.status === 'holiday' ? 'HOLIDAY' : 'CLOSED'}
              </span>
            </div>

            <h3 className={`text-xl sm:text-2xl font-black mt-1.5 tracking-tight ${theme.statusText}`}>
              {theme.label}
            </h3>
            {status.status === 'holiday' && status.holidayName && (
              <p className="text-xs text-amber-700 mt-0.5 font-semibold">
                Official Holiday: {status.holidayName}
              </p>
            )}
          </div>
        </div>

        {/* Right side timing chip */}
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-center sm:text-right shrink-0 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Today's Hours
          </span>
          <strong className="text-sm font-extrabold text-slate-900 block font-mono">
            {status.formattedTodayHours}
          </strong>
        </div>
      </div>
    </div>
  );
}
