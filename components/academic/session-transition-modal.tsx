'use client';

// ============================================================================
// Academic Year Transition & Move to New Session Modal
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { sessionTransitionService, academicService } from '@/lib/services/api';
import {
  AcademicYear,
  SchoolClass,
  StudentTransitionItem,
  TransitionDecisionType,
  TransitionSummaryBreakdown,
  AcademicYearTransitionBatch,
} from '@/lib/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { formatNumber } from '@/lib/utils/formatters';
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Users,
  GraduationCap,
  Sparkles,
  Search,
  Filter,
  UserCheck,
  UserX,
  Repeat,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Check,
  X,
  Clock,
  ChevronRight,
  Info,
} from 'lucide-react';

interface SessionTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransitionComplete?: (batch: AcademicYearTransitionBatch) => void;
}

type Step = 'select_session' | 'review_students' | 'preview_transition' | 'completed';
type FilterTab = 'all' | 'ready' | 'repeat' | 'leaving' | 'graduating' | 'pending';

export function SessionTransitionModal({
  isOpen,
  onClose,
  onTransitionComplete,
}: SessionTransitionModalProps) {
  const { currentSchool, currentUser, currentYear, academicYears, setCurrentYear } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [step, setStep] = useState<Step>('select_session');
  const [sourceYearId, setSourceYearId] = useState<string>(currentYear?.id || 'ay-2026');
  const [targetYearId, setTargetYearId] = useState<string>('ay-2027');

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [transitionItems, setTransitionItems] = useState<StudentTransitionItem[]>([]);
  const [summary, setSummary] = useState<TransitionSummaryBreakdown>({
    total: 0,
    promote: 0,
    repeat: 0,
    no_new_enrollment: 0,
    graduate: 0,
    pending: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [completedBatch, setCompletedBatch] = useState<AcademicYearTransitionBatch | null>(null);

  // Review step filters
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Initial source and target configuration
  useEffect(() => {
    if (academicYears.length > 0) {
      const active = academicYears.find((y) => y.is_current) || academicYears[0];
      setSourceYearId(active.id);
      const upcoming = academicYears.find((y) => y.id !== active.id && (y.name > active.name || y.status === 'draft'));
      if (upcoming) setTargetYearId(upcoming.id);
    }
  }, [academicYears]);

  // Load classes
  useEffect(() => {
    if (isOpen) {
      academicService.getClasses(schoolId).then(setClasses).catch(() => {});
    }
  }, [isOpen, schoolId]);

  // Fetch transition suggestions
  const handleCalculateSuggestions = async () => {
    setIsLoading(true);
    try {
      const res = await sessionTransitionService.getTransitionSuggestions(schoolId, sourceYearId, targetYearId);
      setTransitionItems(res.items);
      recalculateSummary(res.items);
      setStep('review_students');
    } catch {
      toastError('Failed to calculate session transition suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  // Recalculate summary counts whenever decision changes
  const recalculateSummary = (items: StudentTransitionItem[]) => {
    const s: TransitionSummaryBreakdown = {
      total: items.length,
      promote: items.filter((i) => i.selected_decision === 'promote').length,
      repeat: items.filter((i) => i.selected_decision === 'repeat').length,
      no_new_enrollment: items.filter(
        (i) => i.selected_decision === 'transfer_out' || i.selected_decision === 'left_school'
      ).length,
      graduate: items.filter((i) => i.selected_decision === 'graduate').length,
      pending: items.filter((i) => i.selected_decision === 'pending').length,
    };
    setSummary(s);
  };

  // Update a student's transition decision
  const handleDecisionChange = (studentId: string, newDecision: TransitionDecisionType) => {
    setTransitionItems((prev) => {
      const updated = prev.map((item) => {
        if (item.student_id === studentId) {
          const currentClass = classes.find((c) => c.id === item.current_class_id);

          let targetClassId: string | undefined = undefined;
          let targetClassName: string | undefined = undefined;

          if (newDecision === 'promote') {
            targetClassId = currentClass?.next_class_id || item.current_class_id;
            const nextCls = classes.find((c) => c.id === targetClassId);
            targetClassName = nextCls?.name || currentClass?.next_class_name || 'Next Class';
          } else if (newDecision === 'repeat') {
            targetClassId = item.current_class_id;
            targetClassName = item.current_class_name;
          }

          return {
            ...item,
            selected_decision: newDecision,
            target_class_id: targetClassId,
            target_class_name: targetClassName,
            requires_resolution: newDecision === 'pending',
          };
        }
        return item;
      });

      recalculateSummary(updated);
      return updated;
    });
  };

  // Filtered items in Review step
  const filteredItems = transitionItems.filter((item) => {
    // 1. Tab filter
    if (activeTab === 'ready' && item.selected_decision !== 'promote') return false;
    if (activeTab === 'repeat' && item.selected_decision !== 'repeat') return false;
    if (
      activeTab === 'leaving' &&
      item.selected_decision !== 'transfer_out' &&
      item.selected_decision !== 'left_school'
    )
      return false;
    if (activeTab === 'graduating' && item.selected_decision !== 'graduate') return false;
    if (activeTab === 'pending' && item.selected_decision !== 'pending') return false;

    // 2. Class filter
    if (selectedClassFilter !== 'all' && item.current_class_id !== selectedClassFilter) return false;

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.student_name.toLowerCase().includes(q);
      const matchReg = item.registration_number.toLowerCase().includes(q);
      const matchRoll = item.roll_number?.toLowerCase().includes(q);
      if (!matchName && !matchReg && !matchRoll) return false;
    }

    return true;
  });

  // Execute transition
  const handleExecuteTransition = async () => {
    if (summary.pending > 0) {
      toastError(`Please resolve ${summary.pending} student(s) with Pending Decision before finalizing.`);
      return;
    }

    setIsExecuting(true);
    try {
      const batch = await sessionTransitionService.executeAcademicYearTransition(schoolId, {
        sourceYearId,
        targetYearId,
        items: transitionItems,
        actorName: currentUser?.name || 'School Administrator',
        actorId: currentUser?.id,
      });

      setCompletedBatch(batch);
      setStep('completed');
      success(`Successfully transitioned ${batch.total_students} students to ${batch.target_academic_year_name}!`);
      if (onTransitionComplete) onTransitionComplete(batch);
    } catch (err: any) {
      toastError(err.message || 'Failed to complete session transition');
    } finally {
      setIsExecuting(false);
    }
  };

  const sourceYear = academicYears.find((y) => y.id === sourceYearId);
  const targetYear = academicYears.find((y) => y.id === targetYearId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Move to New Session"
      description="Manage student progression, class promotions, and enrollments across academic years"
      maxWidth="2xl"
    >
      <div className="space-y-5 text-left">
        {/* Stepper Navigation */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-semibold">
          <div
            className={`flex items-center gap-1.5 ${
              step === 'select_session' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 'select_session' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              1
            </span>
            <span>1. Select Session</span>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

          <div
            className={`flex items-center gap-1.5 ${
              step === 'review_students' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 'review_students' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              2
            </span>
            <span>2. Review Students</span>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

          <div
            className={`flex items-center gap-1.5 ${
              step === 'preview_transition' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 'preview_transition' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              3
            </span>
            <span>3. Preview Breakdown</span>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

          <div
            className={`flex items-center gap-1.5 ${
              step === 'completed' ? 'text-emerald-600 font-bold' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              4
            </span>
            <span>4. Complete</span>
          </div>
        </div>

        {/* STEP 1: SELECT SESSIONS */}
        {step === 'select_session' && (
          <div className="space-y-5">
            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Automated Progression Calculation</strong>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  The system will automatically generate suggested decisions for every student based on class mappings
                  (<code className="bg-indigo-100/80 px-1 py-0.5 rounded text-[11px]">classes.next_class_id</code>), repeat
                  flags, transfer out records, and graduation criteria. You can review and resolve exceptions in the next
                  step.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Source Academic Session (Current)
                </label>
                <select
                  value={sourceYearId}
                  onChange={(e) => setSourceYearId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                >
                  {academicYears.map((yr) => (
                    <option key={yr.id} value={yr.id}>
                      {yr.name} {yr.is_current ? '(Current Active)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">All currently active student enrollments in this session.</p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Target Academic Session (Upcoming)
                </label>
                <select
                  value={targetYearId}
                  onChange={(e) => setTargetYearId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                >
                  {academicYears
                    .filter((yr) => yr.id !== sourceYearId)
                    .map((yr) => (
                      <option key={yr.id} value={yr.id}>
                        {yr.name} ({yr.status.toUpperCase()})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-indigo-600 font-medium">
                  New student enrollments will be generated for this session.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={handleCalculateSuggestions}
              >
                Calculate Suggestions & Review Students →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: [REVIEW STUDENTS] & EXCEPTION RESOLUTION */}
        {step === 'review_students' && (
          <div className="space-y-4">
            {/* Header & Quick Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Review Students ({formatNumber(summary.total)} Total)
                </h3>
                <p className="text-xs text-slate-500">
                  {summary.promote} ready to promote • {summary.repeat} repeat • {summary.no_new_enrollment} leaving •{' '}
                  {summary.graduate} graduating •{' '}
                  <strong className={summary.pending > 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                    {summary.pending} need decision
                  </strong>
                </p>
              </div>

              {/* Class Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Class:</span>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-bold shadow-2xs"
                >
                  <option value="all">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'all' ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({summary.total})
              </button>

              <button
                onClick={() => setActiveTab('ready')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'ready'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                Ready to Promote ({summary.promote})
              </button>

              <button
                onClick={() => setActiveTab('repeat')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'repeat'
                    ? 'bg-amber-600 text-white font-bold shadow-2xs'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                Repeat ({summary.repeat})
              </button>

              <button
                onClick={() => setActiveTab('leaving')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'leaving'
                    ? 'bg-slate-800 text-white font-bold shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                Leaving / Transfer ({summary.no_new_enrollment})
              </button>

              <button
                onClick={() => setActiveTab('graduating')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'graduating'
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'text-indigo-800 hover:bg-indigo-50'
                }`}
              >
                Graduating ({summary.graduate})
              </button>

              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'pending'
                    ? 'bg-rose-600 text-white font-bold shadow-2xs'
                    : summary.pending > 0
                    ? 'bg-rose-100 text-rose-800 font-bold border border-rose-200 animate-pulse'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending Decision ({summary.pending})
              </button>
            </div>

            {/* Pending Alert Banner */}
            {summary.pending > 0 && (
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between text-xs text-rose-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Action Required:</strong> {summary.pending} student(s) remain in Pending Decision. Please
                    resolve their progression before continuing to preview.
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('pending')}
                  className="px-2.5 py-1 bg-rose-600 text-white rounded font-bold text-[11px] hover:bg-rose-700 shrink-0"
                >
                  View Pending →
                </button>
              </div>
            )}

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student name, registration no, roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>

            {/* Students Table */}
            <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Current Class</th>
                    <th className="py-2.5 px-3">System Status</th>
                    <th className="py-2.5 px-3">Transition Decision</th>
                    <th className="py-2.5 px-3">Target Destination</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        No students found for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isPending = item.selected_decision === 'pending';

                      return (
                        <tr
                          key={item.student_id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isPending ? 'bg-rose-50/40' : ''
                          }`}
                        >
                          {/* Student Info */}
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{item.student_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.registration_number} • Roll #{item.roll_number || '—'}
                            </div>
                          </td>

                          {/* Current Class */}
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {item.current_class_name} {item.current_section_name}
                          </td>

                          {/* Progression Status & Notes */}
                          <td className="py-2.5 px-3">
                            {item.progression_status === 'repeat' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                REPEAT ADVISED
                              </span>
                            ) : item.progression_status === 'left_school' || item.current_status === 'inactive' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                LEFT SCHOOL
                              </span>
                            ) : item.progression_status === 'transferred' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                                TRANSFERRED
                              </span>
                            ) : item.progression_status === 'graduated' || item.suggested_decision === 'graduate' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                                GRADUATING
                              </span>
                            ) : item.progression_status === 'pending' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                NEEDS DECISION
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                READY TO PROMOTE
                              </span>
                            )}
                            {item.notes && (
                              <p className="text-[10px] text-slate-500 italic mt-0.5 max-w-[180px] truncate" title={item.notes}>
                                {item.notes}
                              </p>
                            )}
                          </td>

                          {/* Decision Selector */}
                          <td className="py-2.5 px-3">
                            <select
                              value={item.selected_decision}
                              onChange={(e) =>
                                handleDecisionChange(item.student_id, e.target.value as TransitionDecisionType)
                              }
                              className={`px-2 py-1 rounded-lg text-xs font-bold border transition-colors ${
                                item.selected_decision === 'promote'
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                  : item.selected_decision === 'repeat'
                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                  : item.selected_decision === 'graduate'
                                  ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                                  : item.selected_decision === 'pending'
                                  ? 'bg-rose-100 text-rose-900 border-rose-300 ring-2 ring-rose-400'
                                  : 'bg-slate-100 text-slate-800 border-slate-300'
                              }`}
                            >
                              <option value="promote">Promote to Next Class</option>
                              <option value="repeat">Repeat Current Class</option>
                              <option value="transfer_out">Transfer Out</option>
                              <option value="left_school">Left School</option>
                              <option value="graduate">Graduate (Alumni)</option>
                              <option value="pending">Pending Decision</option>
                            </select>
                          </td>

                          {/* Target Destination Preview */}
                          <td className="py-2.5 px-3">
                            {item.selected_decision === 'promote' ? (
                              <span className="font-bold text-emerald-700 flex items-center gap-1">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                {item.target_class_name || 'Class 9'}
                              </span>
                            ) : item.selected_decision === 'repeat' ? (
                              <span className="font-bold text-amber-800 flex items-center gap-1">
                                <Repeat className="w-3.5 h-3.5" />
                                Repeat {item.current_class_name}
                              </span>
                            ) : item.selected_decision === 'graduate' ? (
                              <span className="font-bold text-indigo-700 flex items-center gap-1">
                                <GraduationCap className="w-3.5 h-3.5" />
                                Graduate (Alumni)
                              </span>
                            ) : item.selected_decision === 'pending' ? (
                              <span className="font-bold text-rose-700 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Unresolved
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">No New Enrollment</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setStep('select_session')}>
                ← Back to Session Setup
              </Button>

              <div className="flex items-center gap-2">
                {summary.pending > 0 && (
                  <span className="text-xs text-rose-600 font-bold">
                    Resolve {summary.pending} pending student(s) to proceed
                  </span>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  disabled={summary.pending > 0}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => setStep('preview_transition')}
                >
                  Preview Transition →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW BREAKDOWN (Exact match to specification) */}
        {step === 'preview_transition' && (
          <div className="space-y-5">
            <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-white/15 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-extrabold text-base tracking-wide">
                    {sourceYear?.name || '2026-27'} → {targetYear?.name || '2027-28'}
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready to Finalize
                </span>
              </div>

              {/* Exact Breakdown Table */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                  <span className="text-[11px] font-semibold text-emerald-400 block uppercase">Promote</span>
                  <span className="text-2xl font-bold text-white mt-1 block">{formatNumber(summary.promote)}</span>
                </div>

                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                  <span className="text-[11px] font-semibold text-amber-400 block uppercase">Repeat</span>
                  <span className="text-2xl font-bold text-white mt-1 block">{formatNumber(summary.repeat)}</span>
                </div>

                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                  <span className="text-[11px] font-semibold text-slate-300 block uppercase">No New Enrollment</span>
                  <span className="text-2xl font-bold text-white mt-1 block">{formatNumber(summary.no_new_enrollment)}</span>
                </div>

                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                  <span className="text-[11px] font-semibold text-indigo-300 block uppercase">Graduate</span>
                  <span className="text-2xl font-bold text-white mt-1 block">{formatNumber(summary.graduate)}</span>
                </div>

                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                  <span className="text-[11px] font-semibold text-emerald-300 block uppercase">Pending</span>
                  <span className="text-2xl font-bold text-white mt-1 block">{summary.pending}</span>
                </div>
              </div>
            </div>

            {/* Historical Safety & Reversibility Notes */}
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-semibold">Historical Integrity Preserved</strong>
                  <span>
                    New active enrollments will be created in {targetYear?.name || '2027-28'}. Past invoices, fee
                    receipts, attendance registers, and report cards for {sourceYear?.name || '2026-27'} remain completely
                    immutable in historical archives.
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5 text-emerald-950">
                <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-900 block font-semibold">Transition Reversibility Safeguard</strong>
                  <span>
                    This transition can be reversed while {targetYear?.name || '2027-28'} remains in draft setup state.
                    Once operational records (attendance marking, fee collections, exam results) begin in the new session,
                    further adjustments must be made individually per student.
                  </span>
                </div>
              </div>
            </div>

            {/* Confirmation Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setStep('review_students')}>
                ← Back to Review Students
              </Button>

              <Button
                variant="primary"
                size="sm"
                isLoading={isExecuting}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleExecuteTransition}
              >
                Confirm & Move to New Session
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: COMPLETED & SWITCH SESSION */}
        {step === 'completed' && completedBatch && (
          <div className="space-y-5 text-center py-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Academic Session Transition Complete!</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {completedBatch.total_students} students have been transitioned from{' '}
                <strong>{completedBatch.source_academic_year_name}</strong> to{' '}
                <strong>{completedBatch.target_academic_year_name}</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-lg mx-auto text-left text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] block">Promoted</span>
                <strong className="text-emerald-700 font-bold">{completedBatch.promoted_count} students</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Repeated</span>
                <strong className="text-amber-700 font-bold">{completedBatch.repeated_count} students</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Left / Transferred</span>
                <strong className="text-slate-700 font-bold">{completedBatch.left_count} students</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Graduated</span>
                <strong className="text-indigo-700 font-bold">{completedBatch.graduated_count} alumni</strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (targetYear) setCurrentYear(targetYear);
                  success(`Switched active academic session to ${completedBatch.target_academic_year_name}!`);
                  onClose();
                }}
              >
                Switch Active Session to {completedBatch.target_academic_year_name}
              </Button>

              <Button variant="outline" size="sm" onClick={onClose}>
                Keep Current Session & Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
