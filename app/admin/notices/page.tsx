'use client';

// ============================================================================
// School Admin Notices Management
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { noticeService } from '@/lib/services/api';
import { Notice, NoticeAudience } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils/formatters';
import { confirmDeleteTwice } from '@/lib/utils/delete-confirm';
import { Bell, Plus, Trash2, Calendar, Users, Eye } from 'lucide-react';
import { CardSkeleton } from '@/components/ui/skeleton';

export default function SchoolNoticesPage() {
  const { currentSchool, currentUser } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [audienceFilter, setAudienceFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Create Notice Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    message: string;
    audience: NoticeAudience;
    startsAt: string;
    expiresAt: string;
  }>({
    title: '',
    message: '',
    audience: 'everyone',
    startsAt: new Date().toISOString().split('T')[0],
    expiresAt: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadNotices = async () => {
    setIsLoading(true);
    try {
      const list = await noticeService.getNotices(schoolId, { includeExpired: true });
      setNotices(list);
    } catch {
      toastError('Failed to load school notices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, [schoolId]);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) return;

    setIsSubmitting(true);
    try {
      await noticeService.createNotice({
        school_id: schoolId,
        title: formData.title.trim(),
        message: formData.message.trim(),
        audience: formData.audience,
        starts_at: formData.startsAt,
        expires_at: formData.expiresAt || undefined,
        created_by: currentUser?.id,
        created_by_name: currentUser?.name,
      });

      success('Notice published successfully!');
      setIsModalOpen(false);
      setFormData({
        title: '',
        message: '',
        audience: 'everyone',
        startsAt: new Date().toISOString().split('T')[0],
        expiresAt: '',
      });
      loadNotices();
    } catch {
      toastError('Error publishing notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirmDeleteTwice('this notice')) return;
    try {
      await noticeService.deleteNotice(id);
      success('Notice deleted');
      loadNotices();
    } catch {
      toastError('Failed to delete notice');
    }
  };

  const filteredNotices = notices.filter((n) => {
    if (audienceFilter === 'all') return true;
    return n.audience === audienceFilter;
  });

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 text-left w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">School Notice Board</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Create Notice
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {['all', 'everyone', 'students', 'teachers'].map((tab) => (
          <button
            key={tab}
            onClick={() => setAudienceFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              audienceFilter === tab
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab === 'all' ? 'All Notices' : tab}
          </button>
        ))}
      </div>

      {/* Notices Feed */}
      {isLoading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-900 mb-1">No notices published</p>
          <p className="text-xs text-slate-400">Click "Create Notice" to post your first announcement.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredNotices.map((n) => {
            const isExpired = n.expires_at && n.expires_at < todayStr;

            return (
              <div
                key={n.id}
                className={`bg-white p-5 rounded-xl border transition-all ${
                  isExpired
                    ? 'border-slate-200 opacity-60 bg-slate-50/50'
                    : 'border-slate-200 shadow-xs hover:border-indigo-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Audience: {n.audience}
                      </span>
                      {isExpired ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                          Expired
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{n.message}</p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span>Published: {formatDate(n.starts_at)}</span>
                      {n.expires_at && <span>Expires: {formatDate(n.expires_at)}</span>}
                      {n.created_by_name && <span>By: {n.created_by_name}</span>}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteNotice(n.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                    title="Delete notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Notice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create School Notice"
        description="Publish a school announcement with targeted audience"
      >
        <form onSubmit={handleCreateNotice} className="space-y-4 text-left">
          <Input
            label="Notice Title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. School Closed Tomorrow"
          />

          <Select
            label="Target Audience"
            value={formData.audience}
            onChange={(e) => setFormData({ ...formData, audience: e.target.value as NoticeAudience })}
          >
            <option value="everyone">Everyone (All Students & Teachers)</option>
            <option value="students">Students Only</option>
            <option value="teachers">Teachers Only</option>
          </Select>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notice Content / Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Write the notice details..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Publish Date"
              type="date"
              required
              value={formData.startsAt}
              onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
            />
            <Input
              label="Expiry Date (Optional)"
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              helperText="Auto-hides from dashboard after expiry"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Publish Notice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
