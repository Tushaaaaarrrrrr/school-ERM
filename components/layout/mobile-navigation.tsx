'use client';

// ============================================================================
// Mobile Bottom Navigation Bar (Supports safe area insets)
// ============================================================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  IndianRupee,
  Award,
  CalendarDays,
  Building2,
  CalendarCheck,
  Bell,
  Briefcase,
} from 'lucide-react';

export function MobileNavigation() {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const getEffectiveRole = () => {
    if (pathname.startsWith('/super-admin')) return 'super_admin';
    if (pathname.startsWith('/teacher')) return 'teacher';
    if (pathname.startsWith('/student')) return 'student';
    if (pathname.startsWith('/staff')) return 'staff';
    if (pathname.startsWith('/admin')) return 'school_admin';
    return currentUser?.role || 'school_admin';
  };

  const role = getEffectiveRole();

  const getNavLinks = () => {
    switch (role) {
      case 'super_admin':
        return [
          { label: 'Overview', href: '/super-admin', icon: LayoutDashboard },
          { label: 'Schools', href: '/super-admin/schools', icon: Building2 },
        ];
      case 'staff':
        return [
          { label: 'Home', href: '/staff', icon: LayoutDashboard },
          { label: 'Fees', href: '/admin/fees', icon: IndianRupee },
          { label: 'Students', href: '/admin/students', icon: GraduationCap },
          { label: 'Notices', href: '/admin/notices', icon: Bell },
        ];
      case 'teacher':
        return [
          { label: 'Home', href: '/teacher', icon: LayoutDashboard },
          { label: 'Attendance', href: '/teacher/attendance', icon: CalendarCheck },
          { label: 'Classes', href: '/teacher/classes', icon: Users },
          { label: 'Exams', href: '/teacher/exams', icon: Award },
          { label: 'Schedule', href: '/teacher/timetable', icon: CalendarDays },
        ];
      case 'student':
        return [
          { label: 'Home', href: '/student', icon: LayoutDashboard },
          { label: 'Results', href: '/student/results', icon: Award },
          { label: 'Fees', href: '/student/fees', icon: IndianRupee },
          { label: 'Profile', href: '/student/profile', icon: GraduationCap },
        ];
      case 'school_admin':
      default:
        return [
          { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
          { label: 'Students', href: '/admin/students', icon: GraduationCap },
          { label: 'Staff', href: '/admin/staff', icon: Briefcase },
          { label: 'Attendance', href: '/admin/attendance', icon: CalendarCheck },
          { label: 'Fees', href: '/admin/fees', icon: IndianRupee },
        ];
    }
  };

  const links = getNavLinks();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 lg:hidden pb-safe-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== '/admin' &&
              link.href !== '/teacher' &&
              link.href !== '/student' &&
              link.href !== '/super-admin' &&
              link.href !== '/staff' &&
              pathname.startsWith(link.href));
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors',
                isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-0.5', isActive ? 'text-indigo-600' : 'text-slate-500')} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
