'use client';

// ============================================================================
// Exams Scheduling & Management
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { examService, classService, subjectService } from '@/lib/services/api';
import { Exam, SchoolClass, Section, Subject } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils/formatters';
import { Award, Plus, Calendar, FileCheck2, ArrowRight } from 'lucide-react';
import { FeatureGuard } from '@/components/layout/feature-guard';
import { TableSkeleton } from '@/components/ui/skeleton';

export default function AdminExamsPage() {
  const { currentSchool, currentYear } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const yearId = currentYear?.id || 'ay-2026';
  const { success, error: toastError } = useToast();

  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: 'Unit Test 2',
    classId: 'cls-08',
    sectionId: 'sec-8a',
    subjectId: '',
    maxMarks: '20',
    examDate: new Date().toISOString().split('T')[0],
  });

  const loadExams = async () => {
    setIsLoading(true);
    try {
      const [exList, clsList, secList, subList] = await Promise.all([
        examService.getExams(schoolId),
        classService.getClasses(schoolId),
        classService.getSections(schoolId),
        subjectService.getSubjects(schoolId),
      ]);
      setExams(exList);
      setClasses(clsList);
      setSections(secList);
      setSubjects(subList);

      if (subList.length > 0 && !formData.subjectId) {
        setFormData((prev) => ({ ...prev, subjectId: subList[0].id }));
      }
    } catch {
      toastError('Failed to load exams');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [schoolId]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || Number(formData.maxMarks) <= 0) return;

    setIsSubmitting(true);
    try {
      await examService.createExam({
        school_id: schoolId,
        academic_year_id: yearId,
        class_id: formData.classId,
        section_id: formData.sectionId,
        subject_id: formData.subjectId,
        name: formData.name.trim(),
        max_marks: Number(formData.maxMarks),
        exam_date: formData.examDate,
      });

      success(`Exam "${formData.name}" created in Draft!`);
      setIsModalOpen(false);
      loadExams();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to create exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  const classSections = sections.filter((s) => s.class_id === formData.classId);

  return (
    <FeatureGuard feature="exams">
      <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Exams Schedule</h1>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Exam
        </Button>
      </div>

      {/* Exams List */}
      {isLoading ? (
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <TableSkeleton rows={4} cols={7} />
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-4">No exams created yet.</p>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            Schedule First Exam
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Exam Name</th>
                  <th className="px-5 py-3.5">Class & Section</th>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5">Max Marks</th>
                  <th className="px-5 py-3.5">Exam Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Marks Sheet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {exams.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{ex.name}</td>
                    <td className="px-5 py-3.5 font-medium">
                      {ex.class_name} ({ex.section_name})
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{ex.subject_name}</td>
                    <td className="px-5 py-3.5 font-bold text-indigo-600">{ex.max_marks} Marks</td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDate(ex.exam_date)}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={ex.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/admin/results?examId=${ex.id}`}>
                        <Button variant={ex.status === 'published' ? 'outline' : 'primary'} size="sm">
                          {ex.status === 'published' ? 'View Marks' : 'Enter Marks'}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {exams.map((ex) => (
              <div key={ex.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{ex.name}</h4>
                    <p className="text-xs text-slate-500">
                      {ex.class_name} ({ex.section_name}) • {ex.subject_name}
                    </p>
                  </div>
                  <StatusBadge status={ex.status} />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-bold text-indigo-600">Max: {ex.max_marks} Marks</span>
                  <span className="text-slate-400">Date: {formatDate(ex.exam_date)}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <Link href={`/admin/results?examId=${ex.id}`} className="w-full">
                    <Button variant={ex.status === 'published' ? 'outline' : 'primary'} size="sm" className="w-full">
                      {ex.status === 'published' ? 'View Marks Sheet' : 'Enter Marks'}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Exam Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule New Examination"
        description="Configure exam name, targeted class, maximum marks, and date"
      >
        <form onSubmit={handleCreateExam} className="space-y-4 text-left">
          <Input
            label="Exam Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Unit Test 1 or Mid-Term Exam"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Class"
              required
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              label="Section"
              required
              value={formData.sectionId}
              onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
            >
              {classSections.length > 0 ? (
                classSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    Section {s.name}
                  </option>
                ))
              ) : (
                <option value="sec-8a">Section A</option>
              )}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Subject"
              required
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code || 'SUB'})
                </option>
              ))}
            </Select>

            <Input
              label="Maximum Marks"
              type="number"
              required
              value={formData.maxMarks}
              onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
              min={1}
              max={1000}
            />
          </div>

          <Input
            label="Exam Date"
            type="date"
            required
            value={formData.examDate}
            onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Schedule Exam
            </Button>
          </div>
        </form>
      </Modal>
      </div>
    </FeatureGuard>
  );
}
