'use client';

// ============================================================================
// Platform Super Admin Security & Authentication Audit Logs
// ============================================================================

import React, { useEffect, useState } from 'react';
import { authLogService, schoolService } from '@/lib/services/api';
import { AuthEvent, AuthEventType, School } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/formatters';
import {
  ShieldAlert,
  ShieldCheck,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Globe,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

export default function SuperAdminSecurityLogsPage() {
  const [logs, setLogs] = useState<AuthEvent[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const [logList, schList] = await Promise.all([
        authLogService.getLogs({
          schoolId: selectedSchoolId === 'all' ? undefined : selectedSchoolId,
          eventType: selectedEventType === 'all' ? undefined : (selectedEventType as AuthEventType),
          role: selectedRole === 'all' ? undefined : selectedRole,
        }),
        schoolService.getSchools(),
      ]);
      setLogs(logList);
      setSchools(schList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedSchoolId, selectedEventType, selectedRole]);

  return (
    <div className="space-y-6 text-left max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Security & Auth Logs</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Global audit trail for authentication attempts, Google OAuth events, rate limits, and security actions
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Filter School
          </label>
          <select
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-indigo-500"
          >
            <option value="all">All Schools (Platform-wide)</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Event Type
          </label>
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-indigo-500"
          >
            <option value="all">All Event Types</option>
            <option value="login_success">login_success</option>
            <option value="login_failure">login_failure</option>
            <option value="google_login_success">google_login_success</option>
            <option value="unregistered_google_login">unregistered_google_login</option>
            <option value="rate_limited">rate_limited</option>
            <option value="password_reset">password_reset</option>
            <option value="account_suspended_login">account_suspended_login</option>
            <option value="user_deletion_attempt">user_deletion_attempt</option>
            <option value="school_suspension_attempt">school_suspension_attempt</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            User Role
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="school_admin">School Admin</option>
            <option value="teacher">Teacher</option>
            <option value="staff">Staff</option>
            <option value="student">Student</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <TableSkeleton rows={6} cols={6} />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-900 mb-1">No security events found</p>
          <p className="text-xs text-slate-400">All authentication attempts match clean criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Event Type</th>
                  <th className="px-5 py-3">Identifier / User</th>
                  <th className="px-5 py-3">School / Tenant</th>
                  <th className="px-5 py-3">Client Platform</th>
                  <th className="px-5 py-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-500">
                      {formatDate(evt.created_at)} • {evt.created_at.split('T')[1]?.slice(0, 5)}
                    </td>
                    <td className="px-5 py-3 font-mono font-semibold">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] ${
                          evt.event_type === 'unregistered_google_login'
                            ? 'bg-rose-100 text-rose-800'
                            : evt.event_type === 'rate_limited'
                            ? 'bg-amber-100 text-amber-800'
                            : evt.success
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {evt.event_type}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-semibold text-slate-900 block">
                        {evt.user_name || evt.email || evt.registration_identifier || 'Anonymous'}
                      </span>
                      {evt.role && (
                        <span className="text-[10px] text-slate-400 capitalize font-medium">
                          {evt.role.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-medium">
                      {evt.school_name || 'Platform (Global)'}
                    </td>
                    <td className="px-5 py-3 text-[11px] text-slate-500 font-mono">
                      {evt.platform || 'Web Browser'} • {evt.ip_hash || '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-bold">
                      {evt.success ? (
                        <span className="text-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Allowed
                        </span>
                      ) : (
                        <span className="text-rose-600 inline-flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Blocked
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
