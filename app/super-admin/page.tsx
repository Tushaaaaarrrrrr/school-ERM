'use client';

// ============================================================================
// Super Admin Overview Dashboard
// Real platform metrics, role distribution charts, and institutional capacity analytics
// ============================================================================

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { School } from '@/lib/types';
import { schoolService } from '@/lib/services/api';
import { StatsCard } from '@/components/ui/stats-card';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/formatters';
import {
  Building2,
  Users,
  GraduationCap,
  Plus,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  BarChart3,
  PieChart,
  Truck,
  Briefcase,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { TableSkeleton, CardSkeleton } from '@/components/ui/skeleton';

export default function SuperAdminOverview() {
  const [schools, setSchools] = useState<School[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOverviewData = async () => {
      try {
        const [schoolsData, usersRes] = await Promise.all([
          schoolService.getSchools(),
          fetch('/api/users', { cache: 'no-store' })
            .then((r) => r.json())
            .catch(() => ({ data: [] })),
        ]);
        setSchools(schoolsData || []);
        setUsers(usersRes.data || []);
      } catch (err) {
        console.error('Failed to load overview data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadOverviewData();
  }, []);

  // Aggregated Real Metrics
  const totalSchools = schools.length;
  const activeSchools = schools.filter((s) => s.status === 'active').length;
  const totalStudents = schools.reduce((acc, s) => acc + (s.student_count || 0), 0);
  const totalTeachers = schools.reduce((acc, s) => acc + (s.teacher_count || 0), 0);
  const totalUsers = users.length;

  // Role Breakdown
  const roleBreakdown = useMemo(() => {
    let super_admin = 0;
    let school_admin = 0;
    let teacher = 0;
    let driver = 0;
    let staff = 0;
    let parent = 0;
    let unassigned = 0;

    users.forEach((u) => {
      const activeMem = u.school_memberships?.find((m: any) => m.status === 'active');
      const role = u.role === 'super_admin' ? 'super_admin' : activeMem?.role || u.role || 'unassigned';

      if (role === 'super_admin') super_admin++;
      else if (role === 'school_admin') school_admin++;
      else if (role === 'teacher') teacher++;
      else if (role === 'driver') driver++;
      else if (['staff', 'accountant'].includes(role)) staff++;
      else if (['parent', 'student'].includes(role)) parent++;
      else unassigned++;
    });

    return [
      { name: 'School Admins', count: school_admin, color: 'bg-purple-500', text: 'text-purple-600', bgLight: 'bg-purple-50' },
      { name: 'Teachers', count: teacher, color: 'bg-blue-500', text: 'text-blue-600', bgLight: 'bg-blue-50' },
      { name: 'Drivers & Transport', count: driver, color: 'bg-amber-500', text: 'text-amber-600', bgLight: 'bg-amber-50' },
      { name: 'Office Staff', count: staff, color: 'bg-teal-500', text: 'text-teal-600', bgLight: 'bg-teal-50' },
      { name: 'Parents & Students', count: parent, color: 'bg-emerald-500', text: 'text-emerald-600', bgLight: 'bg-emerald-50' },
      { name: 'Super Admins', count: super_admin, color: 'bg-indigo-600', text: 'text-indigo-600', bgLight: 'bg-indigo-50' },
      { name: 'Unassigned', count: unassigned, color: 'bg-slate-400', text: 'text-slate-500', bgLight: 'bg-slate-100' },
    ].filter((r) => r.count > 0 || r.name === 'Unassigned');
  }, [users]);

  // Max student count for bar chart scaling
  const maxSchoolStudents = useMemo(() => {
    return Math.max(...schools.map((s) => s.student_count || 0), 10);
  }, [schools]);

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Overview</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/super-admin/users">
            <Button variant="outline" size="sm" leftIcon={<Users className="w-4 h-4" />}>
              Manage Users
            </Button>
          </Link>
          <Link href="/super-admin/schools">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Add School Tenant
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Real Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 xl:gap-5">
        <StatsCard
          title="Total Schools"
          value={totalSchools}
          icon={Building2}
          accentColor="indigo"
        />
        <StatsCard
          title="Total Students"
          value={totalStudents}
          icon={GraduationCap}
          accentColor="emerald"
        />
        <StatsCard
          title="Active Teachers"
          value={totalTeachers}
          icon={Users}
          accentColor="amber"
        />
        <StatsCard
          title="Total Platform Users"
          value={totalUsers}
          icon={UserCheck}
          accentColor="slate"
        />
      </div>

      {/* Analytics & Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6">
        {/* Chart 1: Institutional Size Comparison (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Institutional Enrollment & Faculty</h3>
              </div>
            </div>
            <Link href="/super-admin/schools" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              All Schools <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              <CardSkeleton />
            </div>
          ) : schools.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No school tenants created yet.</div>
          ) : (
            <div className="space-y-4 pt-1">
              {schools.map((school) => {
                const sCount = school.student_count || 0;
                const tCount = school.teacher_count || 0;
                const pct = Math.max(8, Math.round((sCount / maxSchoolStudents) * 100));

                return (
                  <div key={school.id} className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{school.name}</span>
                        <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-semibold">
                          {school.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-semibold text-slate-700">
                        <span className="flex items-center gap-1 text-emerald-700">
                          <GraduationCap className="w-3.5 h-3.5" /> {sCount} Students
                        </span>
                        <span className="flex items-center gap-1 text-amber-700">
                          <Users className="w-3.5 h-3.5" /> {tCount} Faculty
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar comparison */}
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                        title={`${sCount} students`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 2: Platform Identity Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Identity Role Distribution</h3>
              </div>
            </div>
            <Link href="/super-admin/users" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Users <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              <CardSkeleton />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stacked Ratio Bar */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-2xs">
                {roleBreakdown.map((r, i) => {
                  const widthPct = totalUsers > 0 ? (r.count / totalUsers) * 100 : 0;
                  if (widthPct === 0) return null;
                  return (
                    <div
                      key={i}
                      className={`${r.color} h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                      style={{ width: `${Math.max(3, widthPct)}%` }}
                      title={`${r.name}: ${r.count}`}
                    />
                  );
                })}
              </div>

              {/* Roles List */}
              <div className="space-y-2 pt-1">
                {roleBreakdown.map((r, i) => {
                  const pct = totalUsers > 0 ? Math.round((r.count / totalUsers) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${r.color} shrink-0`} />
                        <span className="font-semibold text-slate-800">{r.name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-slate-900">{r.count}</span>
                        <span className="text-[11px] text-slate-400">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Link Banner */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs flex items-center justify-between">
                <span className="text-indigo-900 font-medium">Need to onboard staff or teachers?</span>
                <Link
                  href="/super-admin/users"
                  className="font-bold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1"
                >
                  Create Invite Link <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Schools on Platform</h3>
          </div>
          <Link href="/super-admin/schools" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View All Schools <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={3} cols={6} />
          </div>
        ) : schools.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-900 mb-1">No Schools Onboarded Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Get started by provisioning your first institutional school instance.
            </p>
            <Link href="/super-admin/schools">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Add First School
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">School Name</th>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Students</th>
                  <th className="px-5 py-3.5">Faculty</th>
                  <th className="px-5 py-3.5">Created Date</th>
                  <th className="px-5 py-3.5">Tenant Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {schools.map((school) => (
                  <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{school.name}</td>
                    <td className="px-5 py-3.5 font-mono text-indigo-600 font-semibold">{school.code}</td>
                    <td className="px-5 py-3.5 font-medium">{school.student_count || 0}</td>
                    <td className="px-5 py-3.5 font-medium">{school.teacher_count || 0}</td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDate(school.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={school.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/super-admin/schools/${school.id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                      >
                        Details <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
