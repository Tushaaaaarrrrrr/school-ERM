'use client';

// ============================================================================
// School Admin 30-Day Mandatory Recycle Bin & Recovery Center
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { recycleBinService } from '@/lib/services/api';
import { RecycleBinItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils/formatters';
import {
  Trash2,
  RotateCcw,
  Clock,
  ShieldAlert,
  AlertTriangle,
  GraduationCap,
  Users,
  Briefcase,
  Bus,
  Building,
  Bell,
  Palmtree,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

export default function AdminRecycleBinPage() {
  const { currentSchool, currentUser } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [binItems, setBinItems] = useState<RecycleBinItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'teacher' | 'student' | 'staff' | 'transport' | 'other'>('all');
  const [isRestoring, setIsRestoring] = useState(false);

  const loadBin = async () => {
    setIsLoading(true);
    try {
      const items = await recycleBinService.getBinItems(schoolId);
      setBinItems(items);
    } catch {
      toastError('Failed to load recycle bin items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBin();
  }, [schoolId]);

  const handleRestore = async (item: RecycleBinItem) => {
    setIsRestoring(true);
    try {
      await recycleBinService.restoreItem(
        item.id,
        currentUser?.name || 'School Administrator'
      );
      success(`Successfully restored "${item.entity_name}" to active records!`);
      loadBin();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to restore item');
    } finally {
      setIsRestoring(false);
    }
  };

  const getDaysRemaining = (purgeAt: string) => {
    const diff = new Date(purgeAt).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const getEntityIcon = (type: RecycleBinItem['entity_type']) => {
    switch (type) {
      case 'teacher':
        return <Users className="w-5 h-5 text-emerald-600" />;
      case 'student':
        return <GraduationCap className="w-5 h-5 text-indigo-600" />;
      case 'staff':
        return <Briefcase className="w-5 h-5 text-amber-600" />;
      case 'vehicle':
      case 'route':
        return <Bus className="w-5 h-5 text-sky-600" />;
      case 'room':
        return <Building className="w-5 h-5 text-slate-600" />;
      case 'notice':
        return <Bell className="w-5 h-5 text-rose-600" />;
      case 'holiday':
        return <Palmtree className="w-5 h-5 text-teal-600" />;
      default:
        return <Trash2 className="w-5 h-5 text-slate-500" />;
    }
  };

  const filteredItems = binItems.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'transport') return item.entity_type === 'vehicle' || item.entity_type === 'route';
    if (activeFilter === 'other') return ['room', 'notice', 'holiday'].includes(item.entity_type);
    return item.entity_type === activeFilter;
  });

  return (
    <div className="space-y-6 text-left w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
              <Trash2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Recycle Bin (30-Day Safe Recovery)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            All deleted records for <strong>{currentSchool?.name}</strong> are safely retained for 30 days before permanent auto-purge.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadBin}
          disabled={isLoading}
        >
          Refresh Bin
        </Button>
      </div>

      {/* Mandatory Safety Notice Banner */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="text-white block font-bold">
              Mandatory 30-Day Data Retention Policy Active
            </strong>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              To protect against accidental data loss or unauthorized deletion, records cannot be force-purged. Items will be automatically purged by the system after exactly 30 days unless restored.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Items ({binItems.length})
        </button>
        <button
          onClick={() => setActiveFilter('teacher')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeFilter === 'teacher' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Teachers ({binItems.filter((i) => i.entity_type === 'teacher').length})
        </button>
        <button
          onClick={() => setActiveFilter('student')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeFilter === 'student' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Students ({binItems.filter((i) => i.entity_type === 'student').length})
        </button>
        <button
          onClick={() => setActiveFilter('staff')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeFilter === 'staff' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Staff ({binItems.filter((i) => i.entity_type === 'staff').length})
        </button>
        <button
          onClick={() => setActiveFilter('transport')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeFilter === 'transport' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Transport ({binItems.filter((i) => i.entity_type === 'vehicle' || i.entity_type === 'route').length})
        </button>
        <button
          onClick={() => setActiveFilter('other')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeFilter === 'other' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Notices & Rooms ({binItems.filter((i) => ['room', 'notice', 'holiday'].includes(i.entity_type)).length})
        </button>
      </div>

      {/* Bin Items List */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Recycle Bin is Empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No active deleted records in the 30-day retention queue. Any item deleted across your school will safely appear here for recovery.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
          {filteredItems.map((item) => {
            const daysLeft = getDaysRemaining(item.permanent_purge_at);
            return (
              <div
                key={item.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    {getEntityIcon(item.entity_type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{item.entity_name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {item.entity_type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{item.entity_details}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-0.5">
                      <span>Deleted by: <strong className="text-slate-600">{item.deleted_by_name}</strong></span>
                      <span>Deleted on: {formatDate(item.deleted_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Status & 1-Click Restore */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      <span>{daysLeft} Days Remaining</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Purges on {formatDate(item.permanent_purge_at)}
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleRestore(item)}
                    disabled={isRestoring}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Restore
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
