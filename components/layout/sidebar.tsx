'use client';

// ============================================================================
// Minimal Modern Responsive Sidebar (Role-Tailored: Admin, Staff, Teacher, Student)
// ============================================================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/context/auth-context';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  IndianRupee,
  Award,
  FileCheck2,
  Settings,
  Building2,
  Sparkles,
  Layers,
  ChevronRight,
  CalendarCheck,
  Bell,
  Palmtree,
  Clock,
  Receipt,
  Briefcase,
  ShieldCheck,
  UserX,
  UserCheck,
  History,
  ShieldAlert,
  User,
  Bus,
  Building,
  Search,
  Trash2,
} from 'lucide-react';

import { isFeatureEnabled } from '@/lib/utils/features';
import { SchoolFeatureKey } from '@/lib/types';
import { resolveUserPhoto } from '@/lib/utils/avatar';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  feature?: SchoolFeatureKey;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, currentSchool } = useAuth();

  // Auto-detect portal from route or active persona
  const getEffectiveRole = () => {
    if (pathname.startsWith('/super-admin')) return 'super_admin';
    if (pathname.startsWith('/teacher')) return 'teacher';
    if (pathname.startsWith('/student')) return 'student';
    if (pathname.startsWith('/parent')) return 'parent';
    if (pathname.startsWith('/driver')) return 'driver';
    if (pathname.startsWith('/staff')) return 'staff';
    if (pathname.startsWith('/admin')) return 'school_admin';
    return currentUser?.role || 'school_admin';
  };

  const role = getEffectiveRole();
  const effectivePhoto = currentUser?.photo_url || resolveUserPhoto(currentUser, currentSchool);

  const [studentSubtitle, setStudentSubtitle] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (role === 'student' && typeof window !== 'undefined') {
      try {
        const studentId = currentUser?.student_id || currentUser?.id?.replace(/^usr-/, '') || '';
        const loginId = currentUser?.login_id?.toLowerCase() || '';
        const raw = localStorage.getItem('school_erp_students');
        if (raw) {
          const list = JSON.parse(raw);
          const s = list.find(
            (item: any) =>
              item.id === studentId ||
              item.auth_user_id === currentUser?.id ||
              item.registration_number?.toLowerCase() === loginId
          );
          if (s) {
            const reg = s.registration_number ? `Reg ID: ${s.registration_number}` : '';
            const cls = s.current_enrollment?.class_name
              ? `${s.current_enrollment.class_name}${s.current_enrollment.section_name ? ` (${s.current_enrollment.section_name})` : ''}`
              : '';
            setStudentSubtitle(reg || cls || 'Registration ID');
          } else {
            setStudentSubtitle(currentUser?.login_id ? `Reg ID: ${currentUser.login_id}` : null);
          }
        }
      } catch {}
    } else {
      setStudentSubtitle(null);
    }
  }, [currentUser, role]);

  // Navigation Items per Role
  const getNavSections = (): NavSection[] => {
    switch (role) {
      case 'super_admin':
        return [
          {
            title: 'Platform Management',
            items: [
              { label: 'Overview', href: '/super-admin', icon: LayoutDashboard },
              { label: 'Schools Directory', href: '/super-admin/schools', icon: Building2 },
              { label: 'Users', href: '/super-admin/users', icon: Users },
              { label: 'Access Requests', href: '/super-admin/access-requests', icon: UserCheck },
              { label: 'Security & Auth Logs', href: '/super-admin/security/logs', icon: ShieldAlert },
              { label: 'Platform Settings', href: '/super-admin/settings', icon: Settings },
            ],
          },
        ];

      case 'staff':
        return [
          {
            title: 'Staff Workspace',
            items: [
              { label: 'Staff Dashboard', href: '/staff', icon: LayoutDashboard },
              { label: 'Visitor Lookup', href: '/admin/reception', icon: Search, feature: 'reception' },
              { label: 'Student Fees', href: '/admin/fees', icon: IndianRupee, feature: 'fees' },
              { label: 'Student Directory', href: '/admin/students', icon: GraduationCap, feature: 'students' },
              { label: 'Daily Attendance', href: '/admin/attendance', icon: CalendarCheck, feature: 'attendance' },
              { label: 'Notice Board', href: '/admin/notices', icon: Bell, feature: 'notices' },
            ],
          },
        ];

      case 'teacher':
        return [
          {
            title: 'Faculty Workspace',
            items: [
              { label: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
              { label: 'Student Roll Call', href: '/teacher/attendance', icon: CalendarCheck, feature: 'attendance' },
              { label: 'My Attendance & Leave', href: '/teacher/leave', icon: Clock, feature: 'teacher_attendance' },
              { label: 'My Classes & Rosters', href: '/teacher/classes', icon: Users, feature: 'academics' },
              { label: 'Exams & Marks', href: '/teacher/exams', icon: Award, feature: 'exams' },
              { label: 'Teaching Schedule', href: '/teacher/timetable', icon: CalendarDays, feature: 'timetable' },
              { label: 'Salary Statements', href: '/teacher/payments', icon: Receipt, feature: 'payroll' },
            ],
          },
        ];

      case 'student':
        return [
          {
            title: 'Student Workspace',
            items: [
              { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
              { label: 'Classes & Timetable', href: '/student/classes', icon: CalendarDays, feature: 'timetable' },
              { label: 'Bus Transport', href: '/student/transport', icon: Bus, feature: 'transport' },
              { label: 'Exam Results', href: '/student/results', icon: Award, feature: 'exams' },
              { label: 'Fee Statements', href: '/student/fees', icon: IndianRupee, feature: 'fees' },
              { label: 'Profile & Attendance', href: '/student/profile', icon: GraduationCap, feature: 'students' },
            ],
          },
        ];

      case 'driver':
        return [
          {
            title: 'Driver Fleet Portal',
            items: [
              { label: 'Driver Dashboard', href: '/driver', icon: LayoutDashboard, feature: 'transport' },
            ],
          },
        ];

      case 'parent':
        return [
          {
            title: 'Parent Portal',
            items: [
              { label: 'Parent Dashboard', href: '/parent', icon: LayoutDashboard, feature: 'parent_portal' },
            ],
          },
        ];

      case 'school_admin':
      default:
        return [
          {
            title: 'Main',
            items: [
              { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
            ],
          },
          {
            title: 'People & Operations',
            items: [
              { label: 'Students', href: '/admin/students', icon: GraduationCap, feature: 'students' },
              { label: 'Teachers', href: '/admin/teachers', icon: Users, feature: 'teachers' },
              { label: 'Staff & Support', href: '/admin/staff', icon: Briefcase, feature: 'staff' },
              { label: 'Reception & Enquiries', href: '/admin/reception', icon: Search, feature: 'reception' },
            ],
          },
          {
            title: 'Attendance & Leaves',
            items: [
              { label: 'Student Attendance', href: '/admin/attendance', icon: CalendarCheck, feature: 'attendance' },
              { label: 'Student Leaves', href: '/admin/attendance/leaves', icon: Clock, feature: 'attendance' },
              { label: 'Teacher Attendance & Leaves', href: '/admin/teachers/attendance', icon: Users, feature: 'teacher_attendance' },
              { label: 'School Holidays', href: '/admin/academics/holidays', icon: Palmtree, feature: 'timetable' },
            ],
          },
          {
            title: 'Academics & Facilities',
            items: [
              { label: 'Classes & Sections', href: '/admin/academics/classes', icon: Layers, feature: 'academics' },
              { label: 'Classrooms & Labs', href: '/admin/academics/rooms', icon: Building, feature: 'academics' },
              { label: 'Subjects', href: '/admin/academics/subjects', icon: BookOpen, feature: 'academics' },
              { label: 'Timetable', href: '/admin/academics/timetable', icon: CalendarDays, feature: 'timetable' },
            ],
          },
          {
            title: 'Transport',
            items: [
              { label: 'Fleet & Bus Routes', href: '/admin/transport', icon: Bus, feature: 'transport' },
            ],
          },
          {
            title: 'Finance & Payroll',
            items: [
              { label: 'Student Fees', href: '/admin/fees', icon: IndianRupee, feature: 'fees' },
              { label: 'Employee Payroll', href: '/admin/payroll', icon: Receipt, feature: 'payroll' },
            ],
          },
          {
            title: 'Exams & Communication',
            items: [
              { label: 'Exams', href: '/admin/exams', icon: Award, feature: 'exams' },
              { label: 'Marks & Results', href: '/admin/results', icon: FileCheck2, feature: 'exams' },
              { label: 'Notice Board', href: '/admin/notices', icon: Bell, feature: 'notices' },
            ],
          },
          {
            title: 'Governance & Security',
            items: [
              { label: 'Join Requests', href: '/admin/access-requests', icon: UserCheck },
              { label: 'Recycle Bin (30-Day)', href: '/admin/recycle-bin', icon: Trash2, feature: 'recycle_bin' },
              { label: 'Login History', href: '/admin/security/logs', icon: History, feature: 'security_logs' },
              { label: 'Deletion Requests', href: '/admin/account-requests', icon: UserX },
              { label: 'School Settings', href: '/admin/settings', icon: Settings },
            ],
          },
        ];
    }
  };

  // Filter navigation items by school's provisioned modular features
  const rawSections = getNavSections();
  const navSections = rawSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.feature || isFeatureEnabled(currentSchool, item.feature)
      ),
    }))
    .filter((section) => section.items.length > 0);

  // Determine the single, most specific active navigation item (prevents double highlights)
  const allNavItems = navSections.flatMap((s) => s.items);
  const activeHref = (() => {
    // 1. Exact match has highest priority
    const exact = allNavItems.find((item) => item.href === pathname);
    if (exact) return exact.href;

    // 2. Sub-route prefix match (pick the longest / most specific match)
    const matchingPrefixes = allNavItems.filter((item) => {
      if (
        item.href === '/admin' ||
        item.href === '/teacher' ||
        item.href === '/student' ||
        item.href === '/super-admin' ||
        item.href === '/staff' ||
        item.href === '/driver' ||
        item.href === '/parent'
      ) {
        return false;
      }
      return pathname.startsWith(item.href + '/') || pathname.startsWith(item.href + '?');
    });

    if (matchingPrefixes.length > 0) {
      matchingPrefixes.sort((a, b) => b.href.length - a.href.length);
      return matchingPrefixes[0].href;
    }

    return '';
  })();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container (Fixed in Viewport) */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-64 h-full max-h-screen bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out shrink-0 overflow-hidden lg:translate-x-0 lg:static lg:z-auto lg:h-full lg:min-h-full',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/icons/icon-192.png"
              alt="GI Campus"
              className="w-8 h-8 rounded-lg object-contain shadow-xs group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-white tracking-tight leading-tight">GI Campus</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                {role.replace('_', ' ')}
              </span>
            </div>
          </Link>
        </div>

        {/* Current Tenant Chip (if not super admin) */}
        {role !== 'super_admin' && currentSchool && (
          <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                {currentSchool.logo_url ? (
                  <img
                    src={currentSchool.logo_url}
                    alt={currentSchool.name}
                    className="w-full h-full object-contain p-0.5"
                  />
                ) : (
                  <span className="text-xs font-bold text-indigo-400">{currentSchool.code.slice(0, 3)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold text-white truncate">{currentSchool.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">Code: {currentSchool.code}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto overscroll-y-contain py-4 px-3 space-y-5 text-left">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {section.title}
              </p>
              <div className="space-y-0.5 pt-1">
                {section.items.map((item) => {
                  const isActive = activeHref === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={cn(
                            'w-4 h-4 transition-colors',
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-200" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Profile Footer & Privacy Settings Link */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2 shrink-0">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
            {effectivePhoto ? (
              <img
                src={effectivePhoto}
                alt={currentUser?.name || 'User'}
                className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                {currentUser?.role === 'super_admin' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-white truncate">{currentUser?.name || 'User'}</p>
              <p className="text-[10px] text-slate-400 truncate font-mono">
                {role === 'student'
                  ? (studentSubtitle || (currentUser?.login_id ? `Reg: ${currentUser.login_id}` : 'Student Account'))
                  : (currentUser?.email || currentUser?.login_id)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
            <Link href="/account/delete" className="hover:text-slate-200 transition-colors">
              Privacy & Deletion
            </Link>
            <Link href="/account-deletion" className="hover:text-slate-200 transition-colors">
              Policy
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
