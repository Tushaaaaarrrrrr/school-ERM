'use client';

// ============================================================================
// School Admin Authentication & Login History
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { authLogService } from '@/lib/services/api';
import { AuthEvent } from '@/lib/types';
import { formatDate } from '@/lib/utils/formatters';
import { ShieldCheck, CheckCircle2, XCircle, Clock, UserCheck } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

export default function AdminSecurityLogsPage() {
  const { currentSchool } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';

  const [logs, setLogs] = useState<AuthEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      setIsLoading(true);
      try {
        const list = await authLogService.getLogs({ schoolId });
        setLogs(list);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadLogs();
  }, [schoolId]);

  return (
    <div className="space-y-6 text-left max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Login & Authentication History</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Recent user sign-in activities across students, teachers, and staff at {currentSchool?.name}
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <TableSkeleton rows={5} cols={4} />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-900 mb-1">No login records found</p>
          <p className="text-xs text-slate-400">Sign-in activities will appear here in chronological order.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Authentication Method</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {log.user_name || log.email || log.registration_identifier || 'Unknown User'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="capitalize text-slate-600 font-medium">
                        {log.role ? log.role.replace('_', ' ') : 'User'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium">
                      {log.event_type.includes('google')
                        ? 'Google OAuth'
                        : log.registration_identifier
                        ? 'Registration ID'
                        : 'Email / Password'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatDate(log.created_at)} • {log.created_at.split('T')[1]?.slice(0, 5)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold">
                      {log.success ? (
                        <span className="text-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Login Successful
                        </span>
                      ) : (
                        <span className="text-rose-600 inline-flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
