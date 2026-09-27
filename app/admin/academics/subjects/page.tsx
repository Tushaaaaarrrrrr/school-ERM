'use client';

// ============================================================================
// Subjects Catalog
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { subjectService } from '@/lib/services/api';
import { Subject } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { BookOpen, Plus, Sparkles } from 'lucide-react';
import { CardSkeleton } from '@/components/ui/skeleton';

export default function SubjectsPage() {
  const { currentSchool } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const loadSubjects = async () => {
    setIsLoading(true);
    try {
      const data = await subjectService.getSubjects(schoolId);
      setSubjects(data);
    } catch {
      toastError('Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, [schoolId]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await subjectService.createSubject(schoolId, name.trim(), code.trim() || undefined);
      success(`Subject "${name}" added!`);
      setIsModalOpen(false);
      setName('');
      setCode('');
      loadSubjects();
    } catch {
      toastError('Failed to create subject');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subjects</h1>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Subject
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : subjects.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-4">No subjects registered yet.</p>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            Add First Subject
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{sub.name}</h3>
                  <p className="font-mono text-xs text-indigo-600 font-semibold">{sub.code || 'CODE-N/A'}</p>
                </div>
              </div>
              <StatusBadge status={sub.status} />
            </div>
          ))}
        </div>
      )}

      {/* Add Subject Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Subject to Catalog"
        description="e.g. Mathematics, Sanskrit, Environmental Science, Physics"
      >
        <form onSubmit={handleCreateSubject} className="space-y-4 text-left">
          <Input
            label="Subject Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Computer Science"
          />

          <Input
            label="Subject Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. CS-08"
            helperText="Short alphanumeric code"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Subject
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
