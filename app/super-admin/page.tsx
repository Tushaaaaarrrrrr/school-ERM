'use client';

// ============================================================================
// Super Admin Overview Dashboard
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { School } from '@/lib/types';
import { schoolService } from '@/lib/services/api';
import { StatsCard } from '@/components/ui/stats-card';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/formatters';
import { Building2, Users, GraduationCap, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

export default function SuperAdminOverview() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    schoolService.getSchools().then((data) => {
      setSchools(data);
      setIsLoading(false);
    });
  }, []);

  const totalSchools = schools.length;
  const activeSchools = schools.filter((s) => s.status === 'active').length;
  const totalStudents = schools.reduce((acc, s) => acc + (s.student_count || 0), 0);
  const totalTeachers = schools.reduce((acc, s) => acc + (s.teacher_count || 0), 0);

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage multi-school tenants, operational health, and system status
          </p>
        </div>

        <Link href="/super-admin/schools">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Manage & Add Schools
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Total Schools"
          value={totalSchools}
          subtitle={`${activeSchools} Active`}
          icon={Building2}
          accentColor="indigo"
        />
        <StatsCard
          title="Total Students"
          value={totalStudents}
          subtitle="Across all schools"
          icon={GraduationCap}
          accentColor="emerald"
        />
        <StatsCard
          title="Total Teachers"
          value={totalTeachers}
          subtitle="Active faculty"
          icon={Users}
          accentColor="amber"
        />
        <StatsCard
          title="Platform Status"
          value="Healthy"
          subtitle="All DB instances active"
          icon={ShieldCheck}
          accentColor="slate"
        />
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Schools on Platform</h3>
            <p className="text-xs text-slate-500">Overview of active school instances</p>
          </div>
          <Link href="/super-admin/schools" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={3} cols={5} />
          </div>
        ) : schools.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-900 mb-1">No Schools Onboarded Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Get started by adding and onboarding your first institutional school instance.
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
                  <th className="px-5 py-3">School Name</th>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Students</th>
                  <th className="px-5 py-3">Teachers</th>
                  <th className="px-5 py-3">Created Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {schools.map((school) => (
                  <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{school.name}</td>
                    <td className="px-5 py-3.5 font-mono text-indigo-600 font-medium">{school.code}</td>
                    <td className="px-5 py-3.5">{school.student_count || 0}</td>
                    <td className="px-5 py-3.5">{school.teacher_count || 0}</td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDate(school.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={school.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/super-admin/schools/${school.id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Details
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
