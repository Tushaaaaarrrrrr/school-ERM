'use client';

// ============================================================================
// School Holiday Management (Indian Official Calendar, Edit & Soft Deletion)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { holidayService } from '@/lib/services/api';
import { SchoolHoliday } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils/formatters';
import { confirmDeleteTwice } from '@/lib/utils/delete-confirm';
import {
  Palmtree,
  Plus,
  Trash2,
  CalendarDays,
  Sun,
  Edit2,
  Sparkles,
  Download,
  Calendar,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { CardSkeleton } from '@/components/ui/skeleton';

export default function SchoolHolidaysPage() {
  const { currentSchool, currentYear, currentUser } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const yearId = currentYear?.id || 'ay-2026';
  const { success, error: toastError } = useToast();

  const [holidays, setHolidays] = useState<SchoolHoliday[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingHoliday, setEditingHoliday] = useState<SchoolHoliday | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadHolidays = async () => {
    setIsLoading(true);
    try {
      const list = await holidayService.getHolidays(schoolId);
      setHolidays(list);
    } catch {
      toastError('Failed to load school holidays');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, [schoolId]);

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.startDate || !formData.endDate) return;

    if (formData.endDate < formData.startDate) {
      toastError('End date cannot be before start date');
      return;
    }

    setIsSubmitting(true);
    try {
      await holidayService.createHoliday({
        school_id: schoolId,
        academic_year_id: yearId,
        name: formData.name.trim(),
        start_date: formData.startDate,
        end_date: formData.endDate,
        reason: formData.reason.trim() || undefined,
        created_by: currentUser?.id,
      });

      success(`Holiday "${formData.name}" added to calendar!`);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
      });
      loadHolidays();
    } catch {
      toastError('Failed to create holiday');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (h: SchoolHoliday) => {
    setEditingHoliday(h);
    setEditFormData({
      name: h.name,
      startDate: h.start_date,
      endDate: h.end_date,
      reason: h.reason || '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHoliday || !editFormData.name.trim() || !editFormData.startDate || !editFormData.endDate) return;

    if (editFormData.endDate < editFormData.startDate) {
      toastError('End date cannot be before start date');
      return;
    }

    setIsSavingEdit(true);
    try {
      await holidayService.updateHoliday(editingHoliday.id, {
        name: editFormData.name.trim(),
        start_date: editFormData.startDate,
        end_date: editFormData.endDate,
        reason: editFormData.reason.trim() || undefined,
      });

      success(`Holiday "${editFormData.name}" updated successfully!`);
      setEditingHoliday(null);
      loadHolidays();
    } catch {
      toastError('Failed to update holiday');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteHoliday = async (h: SchoolHoliday) => {
    if (!confirmDeleteTwice(`holiday "${h.name}"`)) return;
    try {
      await holidayService.deleteHoliday(
        h.id,
        currentUser?.name || 'School Administrator',
        'school_admin'
      );
      success(`Holiday "${h.name}" moved to 30-day Recycle Bin.`);
      loadHolidays();
    } catch {
      toastError('Failed to delete holiday');
    }
  };

  const handleLoadStandardIndianCalendar = async () => {
    setIsLoading(true);
    try {
      await holidayService.loadStandardIndianHolidays(schoolId, yearId);
      success('Official Indian Academic Holidays loaded successfully!');
      loadHolidays();
    } catch {
      toastError('Failed to load standard holidays');
      setIsLoading(false);
    }
  };

  const filteredHolidays = holidays.filter((h) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      h.name.toLowerCase().includes(q) ||
      (h.reason && h.reason.toLowerCase().includes(q)) ||
      h.start_date.includes(q)
    );
  });

  return (
    <div className="space-y-6 text-left w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white">
              <Palmtree className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              School Holidays Calendar
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadStandardIndianCalendar}
            disabled={isLoading}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-600" />}
          >
            🇮🇳 Reset to Indian Holidays
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Declare Holiday
          </Button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search holiday by name or festival..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 px-2">
          <span>Total Declared Holidays: <strong className="text-slate-900">{holidays.length}</strong></span>
          <span>•</span>
          <span className="text-emerald-700 font-medium">Auto-excluded from student absence calculations</span>
        </div>
      </div>

      {/* Holidays List */}
      {isLoading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredHolidays.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 space-y-4">
          <Palmtree className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <p className="text-sm font-bold text-slate-900 mb-1">No holidays declared</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You can declare custom school holidays or import all standard Indian National and Gazetted holidays in 1 click.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleLoadStandardIndianCalendar}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Load 2026-27 Indian Official Calendar
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHolidays.map((h) => {
            const isSingleDay = h.start_date === h.end_date;
            const isVacation = !isSingleDay;

            return (
              <div
                key={h.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      isVacation
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}
                  >
                    {isVacation ? <Sun className="w-5 h-5" /> : <Palmtree className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{h.name}</h3>
                      {isVacation && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
                          Vacation Break
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        {isSingleDay
                          ? formatDate(h.start_date)
                          : `${formatDate(h.start_date)} to ${formatDate(h.end_date)}`}
                      </span>

                      {h.reason && (
                        <span className="text-slate-500">
                          • {h.reason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleOpenEditModal(h)}
                    leftIcon={<Edit2 className="w-3 h-3 text-slate-600" />}
                  >
                    Edit
                  </Button>

                  <button
                    type="button"
                    onClick={() => handleDeleteHoliday(h)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Move to 30-Day Recycle Bin"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Holiday Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Declare Official School Holiday"
        description="Add a single day holiday or multi-day vacation date range"
      >
        <form onSubmit={handleCreateHoliday} className="space-y-4 text-left">
          <Input
            label="Holiday Title"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Republic Day or Summer Vacation"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  startDate: e.target.value,
                  endDate: formData.endDate < e.target.value ? e.target.value : formData.endDate,
                })
              }
            />
            <Input
              label="End Date"
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <Input
            label="Occasion / Classification (Optional)"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="e.g. National Gazetted Holiday / Religious Holiday"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Holiday
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Holiday Modal */}
      <Modal
        isOpen={Boolean(editingHoliday)}
        onClose={() => setEditingHoliday(null)}
        title={`Edit Holiday: ${editingHoliday?.name}`}
        description="Modify holiday date range, occasion, or classification"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-left">
          <Input
            label="Holiday Title"
            required
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            placeholder="e.g. Republic Day"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              required
              value={editFormData.startDate}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  startDate: e.target.value,
                  endDate: editFormData.endDate < e.target.value ? e.target.value : editFormData.endDate,
                })
              }
            />
            <Input
              label="End Date"
              type="date"
              required
              value={editFormData.endDate}
              onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
            />
          </div>

          <Input
            label="Occasion / Classification (Optional)"
            value={editFormData.reason}
            onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
            placeholder="e.g. National Gazetted Holiday"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingHoliday(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSavingEdit}>
              Update Holiday
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
