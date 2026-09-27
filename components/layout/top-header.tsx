'use client';

// ============================================================================
// Top Header with Real Profile Info, Academic Year Selector & Responsive Controls
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Calendar,
  LogOut,
  ChevronDown,
  Building,
  User,
  Shield,
  Clock3,
  KeyRound,
} from 'lucide-react';
import { UserPasswordModal } from '@/components/auth/user-password-modal';
import type { SchoolDayKey } from '@/lib/types';
import { calculateSchoolStatus } from '@/lib/utils/school-timing';

interface TopHeaderProps {
  onToggleMobileMenu: () => void;
}

export function TopHeader({ onToggleMobileMenu }: TopHeaderProps) {
  const router = useRouter();
  const {
    currentUser,
    currentSchool,
    currentYear,
    academicYears,
    setCurrentYear,
    logout,
  } = useAuth();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showYearMenu, setShowYearMenu] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const status = calculateSchoolStatus(currentSchool, [], now);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-20">
      {/* Left: Mobile menu button + Title/Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
          <Building className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-800">
            {currentUser?.role === 'super_admin' ? 'Super Admin Platform' : currentSchool?.name || 'School ERP'}
          </span>
          {currentUser?.role !== 'super_admin' && currentSchool?.code && (
            <>
              <span>•</span>
              <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                {currentSchool.code}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: Academic Year Selector + Real User Profile Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {currentUser?.role !== 'super_admin' && currentSchool && (
          <div className="hidden lg:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-600">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide ${
                status.status === 'open'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : status.status === 'holiday'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status.status === 'open'
                    ? 'bg-emerald-500 animate-pulse'
                    : status.status === 'holiday'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              {status.status === 'open' ? 'OPEN' : status.status === 'holiday' ? 'HOLIDAY' : 'CLOSED'}
            </span>
            <span className="font-semibold text-slate-800">{status.dayLabel}</span>
            <span>•</span>
            <span>{status.formattedTodayHours}</span>
            <span className="border-l border-slate-300 pl-2 font-semibold text-indigo-700">Now {status.currentTimeStr}</span>
          </div>
        )}
        {/* Academic Year Selector (for School Admin / Teacher / Staff) */}
        {currentUser?.role !== 'super_admin' && academicYears.length > 0 && (
          <div className="relative">
            <button
              onClick={() => {
                setShowYearMenu(!showYearMenu);
                setShowUserMenu(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Year:</span>
              <span className="font-semibold">{currentYear?.name || '2026-27'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showYearMenu && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-left animate-in fade-in">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Academic Year
                </div>
                {academicYears.map((yr) => (
                  <button
                    key={yr.id}
                    onClick={() => {
                      setCurrentYear(yr);
                      setShowYearMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between cursor-pointer"
                  >
                    <span>{yr.name}</span>
                    {yr.is_current && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded">
                        Current
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Logged In User Profile & Logout */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowYearMenu(false);
            }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 transition-colors text-xs font-medium cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser?.role === 'super_admin' ? (
                <Shield className="w-3.5 h-3.5" />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="text-left hidden md:block">
              <span className="font-semibold block truncate max-w-[120px]">
                {currentUser?.name || 'Account'}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-left animate-in fade-in">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="font-semibold text-xs text-slate-900 truncate">
                  {currentUser?.name || 'Logged In User'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.email || ''}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 capitalize border border-indigo-100">
                  {currentUser?.role.replace('_', ' ') || 'User'}
                </span>
              </div>

              <div className="py-1 border-b border-slate-100">
                <button
                  onClick={() => {
                    setIsPasswordModalOpen(true);
                    setShowUserMenu(false);
                  }}
                  className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Password &amp; Security</span>
                </button>
              </div>

              <div className="pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Password Management Modal */}
      <UserPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </header>
  );
}
