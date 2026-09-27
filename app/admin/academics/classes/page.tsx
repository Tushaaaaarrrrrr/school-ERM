'use client';

// ============================================================================
// Classes & Sections Management (With Room, Class Teacher & Academic Insights)
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { academicService, roomService, teacherService, insightService, studentService, examService, attendanceService } from '@/lib/services/api';
import {
  SchoolClass,
  Section,
  SchoolRoom,
  Teacher,
  ClassAcademicInsights,
  ClassAttendanceInsights,
  Student,
  Exam,
  StudentAttendance,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { SessionTransitionModal } from '@/components/academic/session-transition-modal';
import {
  Layers,
  Plus,
  Building,
  GraduationCap,
  Edit3,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { CardSkeleton } from '@/components/ui/skeleton';

export default function ClassesPage() {
  const router = useRouter();
  const { currentSchool } = useAuth();
  const schoolId = currentSchool?.id || '';
  const { success, error: toastError } = useToast();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [rooms, setRooms] = useState<SchoolRoom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [feeClass, setFeeClass] = useState<SchoolClass | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const [className, setClassName] = useState('');
  const [sortOrder, setSortOrder] = useState('1');
  const [classMonthlyFee, setClassMonthlyFee] = useState('');
  const [classFeeGenerationDay, setClassFeeGenerationDay] = useState('1');
  const [classFeeDueDay, setClassFeeDueDay] = useState('10');
  const [feeDraft, setFeeDraft] = useState({ monthlyFee: '', generationDay: '1', dueDay: '10', charges: [] as { id: string; name: string; amount: number; status: 'active' | 'inactive' }[] });
  const [sectionName, setSectionName] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedClassTeacherId, setSelectedClassTeacherId] = useState('');

  // Class Insights Modal State
  const [selectedInsightClass, setSelectedInsightClass] = useState<SchoolClass | null>(null);
  const [academicInsights, setAcademicInsights] = useState<ClassAcademicInsights | null>(null);
  const [attendanceInsights, setAttendanceInsights] = useState<ClassAttendanceInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [classExams, setClassExams] = useState<Exam[]>([]);
  const [classAttendance, setClassAttendance] = useState<StudentAttendance[]>([]);
  const [detailClassName, setDetailClassName] = useState('');
  const [detailSortOrder, setDetailSortOrder] = useState('');

  const loadClasses = async () => {
    setIsLoading(true);
    try {
      const [data, rList, tList] = await Promise.all([
        academicService.getClasses(schoolId),
        roomService.getRooms(schoolId),
        teacherService.getTeachers(schoolId),
      ]);
      setClasses(data);
      setRooms(rList);
      setTeachers(tList);
    } catch {
      toastError('Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [schoolId]);

  const handleOpenInsights = async (cls: SchoolClass) => {
    setSelectedInsightClass(cls);
    setDetailClassName(cls.name);
    setDetailSortOrder(String(cls.sort_order));
    setIsLoadingInsights(true);
    try {
      const [acad, att, students, exams, attendance] = await Promise.all([
        insightService.getClassAcademicInsights(schoolId, cls.id),
        insightService.getClassAttendanceInsights(schoolId, cls.id),
        studentService.getStudents(schoolId, { classId: cls.id }),
        examService.getExams(schoolId, { classId: cls.id }),
        attendanceService.getAttendance(schoolId, { classId: cls.id }),
      ]);
      setAcademicInsights(acad);
      setAttendanceInsights(att);
      setClassStudents(students);
      setClassExams(exams);
      setClassAttendance(attendance);
    } catch {
      toastError('Failed to load class insights');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleUpdateClassDetails = async () => {
    if (!selectedInsightClass || !detailClassName.trim()) return;
    try {
      const updated = await academicService.updateClass(selectedInsightClass.id, {
        name: detailClassName.trim(),
        sort_order: Number(detailSortOrder) || 0,
      });
      setSelectedInsightClass({ ...selectedInsightClass, ...updated });
      success('Class information updated');
      await loadClasses();
    } catch {
      toastError('Failed to update class information');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    try {
      await academicService.createClass(schoolId, className.trim(), parseInt(sortOrder, 10) || 0, Number(classMonthlyFee) || undefined, Number(classFeeGenerationDay) || 1, Number(classFeeDueDay) || 10);
      success(`Class "${className}" created!`);
      setIsClassModalOpen(false);
      setClassName('');
      setClassMonthlyFee('');
      setClassFeeGenerationDay('1');
      setClassFeeDueDay('10');
      loadClasses();
    } catch {
      toastError('Failed to create class');
    }
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;

    try {
      if (editingSection) {
        await academicService.updateSection(editingSection.id, {
          name: sectionName.trim(),
          room_id: selectedRoomId || undefined,
          class_teacher_id: selectedClassTeacherId || undefined,
        });
        success(`Section "${sectionName}" updated!`);
      } else if (sectionName.trim()) {
        await academicService.createSection(
          schoolId,
          selectedClassId,
          sectionName.trim(),
          selectedRoomId || undefined,
          selectedClassTeacherId || undefined
        );
        success(`Section "${sectionName.toUpperCase()}" added!`);
      } else {
        await academicService.updateClass(selectedClassId, {
          room_id: selectedRoomId || undefined,
          class_teacher_id: selectedClassTeacherId || undefined,
        });
        success('Whole-class room and Class Teacher saved!');
      }
      setIsSectionModalOpen(false);
      setEditingSection(null);
      setSectionName('');
      setSelectedRoomId('');
      setSelectedClassTeacherId('');
      loadClasses();
    } catch {
      toastError('Failed to save section');
    }
  };

  const handleOpenEditSection = (clsId: string, sec: Section) => {
    setSelectedClassId(clsId);
    setEditingSection(sec);
    setSectionName(sec.name);
    setSelectedRoomId(sec.room_id || '');
    setSelectedClassTeacherId(sec.class_teacher_id || '');
    setIsSectionModalOpen(true);
  };

  return (
    <div className="space-y-6 text-left p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-600" /> Academic Classes & Sections
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5"
            onClick={() => setIsTransitionModalOpen(true)}
          >
            <ArrowRight className="w-4 h-4 text-indigo-600" />
            <span>Move to New Session</span>
          </Button>

          <Link href="/admin/academics/rooms">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>Classrooms & Labs</span>
            </Button>
          </Link>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsClassModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </Button>
        </div>
      </div>

      {/* Grid of Classes */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-4">No classes created yet.</p>
          <Button variant="primary" size="sm" onClick={() => setIsClassModalOpen(true)}>
            Add First Class
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/admin/academics/classes/${c.id}`)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') router.push(`/admin/academics/classes/${c.id}`); }}
                className="cursor-pointer rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                title={`View ${c.name} details`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-100">
                      {c.sort_order || c.name.replace(/\D/g, '') || '#'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                      <p className="text-[11px] text-slate-400">Order: {c.sort_order}</p>
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                <div className="mt-4 space-y-2.5">
                  {(c.default_room_number || c.class_teacher_name) && (
                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs">
                      <strong className="text-indigo-950">Whole class</strong>
                      <span className="block text-[11px] text-slate-600 mt-0.5">
                        Room: {c.default_room_number || 'Not assigned'} · Class Teacher: {c.class_teacher_name || 'Not assigned'}
                      </span>
                    </div>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Sections & Room Assignments:
                  </span>
                  <div className="space-y-2">
                    {c.sections && c.sections.length > 0 ? (
                      c.sections.map((sec) => (
                        <div
                          key={sec.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs group"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="text-slate-900 font-semibold">
                                Section {sec.name}
                              </strong>
                              <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                {sec.room_number ? `Room ${sec.room_number}` : 'Not assigned'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              Class Teacher: <strong>{sec.class_teacher_name || 'Not assigned'}</strong>
                            </span>
                          </div>

                          <button
                            onClick={(event) => { event.stopPropagation(); handleOpenEditSection(c.id, sec); }}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Edit Section & Room"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No sections created yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button variant="outline" size="xs" onClick={() => { setFeeClass(c); setFeeDraft({ monthlyFee: c.common_monthly_fee?.toString() || '', generationDay: String(c.monthly_fee_generation_day || 1), dueDay: String(c.monthly_fee_due_day || 10), charges: c.new_student_charges || [] }); }}>
                  Class Fees
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleOpenInsights(c)}
                  leftIcon={<Trophy className="w-3 h-3 text-amber-600" />}
                >
                  Insights & Topper
                </Button>

                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setSelectedClassId(c.id);
                    setEditingSection(null);
                    setSectionName('');
                    setSelectedRoomId('');
                    setSelectedClassTeacherId('');
                    setIsSectionModalOpen(true);
                  }}
                  leftIcon={<Plus className="w-3 h-3 text-indigo-600" />}
                >
                  Add Section
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Class Insights Modal */}
      {selectedInsightClass && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedInsightClass(null)}
          title={`${selectedInsightClass.name} Academic & Attendance Insights`}
          description="Normalized topper analysis, class averages, and attendance attention breakdown"
        >
          {isLoadingInsights ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading insights...</div>
          ) : (
            <div className="space-y-5 text-xs text-left max-h-[75vh] overflow-y-auto">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-3 items-end">
                  <Input label="Class Name" value={detailClassName} onChange={(event) => setDetailClassName(event.target.value)} />
                  <Input label="Display Order" type="number" value={detailSortOrder} onChange={(event) => setDetailSortOrder(event.target.value)} />
                  <Button size="sm" onClick={handleUpdateClassDetails}>Save Class Info</Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div><span className="text-slate-400 block">Status</span><strong>{selectedInsightClass.status}</strong></div>
                  <div><span className="text-slate-400 block">Students</span><strong>{classStudents.length}</strong></div>
                  <div><span className="text-slate-400 block">Sections</span><strong>{selectedInsightClass.sections?.length || 0}</strong></div>
                  <div><span className="text-slate-400 block">Class Teacher</span><strong>{selectedInsightClass.class_teacher_name || 'Not assigned'}</strong></div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b"><strong>Enrolled Students</strong></div>
                {classStudents.length === 0 ? <p className="p-6 text-center text-slate-500">No students enrolled in this class.</p> : (
                  <div className="divide-y divide-slate-100">
                    {classStudents.map((student) => {
                      const attendance = classAttendance.filter((record) => record.student_id === student.id);
                      const present = attendance.filter((record) => record.status === 'present').length;
                      const attendanceRate = attendance.length ? `${((present / attendance.length) * 100).toFixed(1)}%` : 'Not taken';
                      return <Link key={student.id} href={`/admin/students/${student.id}`} className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 hover:bg-slate-50">
                        <span><strong className="block text-slate-900">{student.first_name} {student.last_name}</strong><span className="text-slate-400">{student.registration_number} · Roll {student.current_enrollment?.roll_number || 'Not assigned'} · {student.current_enrollment?.section_name ? `Section ${student.current_enrollment.section_name}` : 'No section'}</span></span>
                        <span className="text-right"><span className="text-slate-400 block">Attendance</span><strong>{attendanceRate}</strong></span>
                        <span className="self-center text-indigo-600 font-semibold">View / Edit</span>
                      </Link>;
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b"><strong>Tests & Exams</strong></div>
                {classExams.length === 0 ? <p className="p-6 text-center text-slate-500">No tests or exams created for this class.</p> : (
                  <div className="divide-y divide-slate-100">
                    {classExams.map((exam) => <div key={exam.id} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3">
                      <span><strong className="block text-slate-900">{exam.name}</strong><span className="text-slate-400">{exam.subject_name || 'Subject not recorded'} · {exam.section_name ? `Section ${exam.section_name}` : 'All sections'} · {exam.exam_date}</span></span>
                      <span className="text-right"><strong className="block capitalize">{exam.status}</strong><span className="text-slate-400">Maximum {exam.max_marks} marks</span></span>
                    </div>)}
                  </div>
                )}
              </div>

              {/* Topper Card */}
              {academicInsights && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-3">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-600" /> Class Topper (Normalized Published Exams)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {academicInsights.toppers.map((tp) => (
                      <div key={tp.student_id} className="bg-white p-3 rounded-lg border border-amber-200 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500 text-white font-bold flex items-center justify-center text-sm">
                          {tp.student_name[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{tp.student_name}</h4>
                          <span className="text-amber-700 font-extrabold">{tp.average_percentage}% Average</span>
                          <span className="text-[10px] text-slate-400 block font-mono">Roll #{tp.roll_number || 'Not assigned'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Class Average & Subject Breakdown */}
              {academicInsights && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Class Average</span>
                    <span className="text-2xl font-extrabold text-indigo-900 mt-1 block">
                      {academicInsights.class_average_pct}%
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Subjects Evaluated</span>
                    <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                      {academicInsights.subject_averages.length} Subjects
                    </span>
                  </div>
                </div>
              )}

              {/* Attendance Breakdown */}
              {attendanceInsights && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Perfect Attendance */}
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200 space-y-2">
                    <span className="font-bold text-emerald-950 text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Perfect Attendance (100%)
                    </span>
                    <div className="space-y-1">
                      {attendanceInsights.perfect_attendance_students.slice(0, 3).map((st) => (
                        <div key={st.student_id} className="bg-white p-1.5 rounded border border-emerald-100 font-semibold text-slate-800 text-[11px]">
                          {st.student_name} (Roll #{st.roll_number || '—'})
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Needs Attention */}
                  <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-200 space-y-2">
                    <span className="font-bold text-rose-950 text-[11px] flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Needs Attention
                    </span>
                    <div className="space-y-1">
                      {attendanceInsights.needs_attention_students.slice(0, 3).map((st) => (
                        <div key={st.student_id} className="bg-white p-1.5 rounded border border-rose-100 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-900">{st.student_name}</span>
                          <span className="font-bold text-rose-700">{st.consecutive_absent_days}d absent</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Add Class Modal */}
      <Modal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title="Add Academic Class"
        description="Create a new standard or grade level in this school"
      >
        <form onSubmit={handleCreateClass} className="space-y-4 text-left text-xs">
          <Input
            label="Class Name *"
            required
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g. Class 9, Nursery, Grade 12"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Generate Invoice On Day" type="number" min="1" max="28" value={classFeeGenerationDay} onChange={(e) => setClassFeeGenerationDay(e.target.value)} helperText="Day of each month, 1–28" />
            <Input label="Payment Due On Day" type="number" min="1" max="28" value={classFeeDueDay} onChange={(e) => setClassFeeDueDay(e.target.value)} helperText="Day of each month, 1–28" />
          </div>

          <Input
            label="Display Sort Order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            helperText="Lower numbers appear first in lists"
          />

          <Input
            label="Common Monthly Class Fee (₹)"
            type="number"
            min="0"
            value={classMonthlyFee}
            onChange={(e) => setClassMonthlyFee(e.target.value)}
            helperText="Optional. This becomes the default monthly fee for students enrolled in this class."
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsClassModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Class
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(feeClass)} onClose={() => setFeeClass(null)} title={`Class Fees: ${feeClass?.name || ''}`} description="Configure the common monthly tuition and one-time charges for new students in this class.">
        <div className="space-y-4 text-left text-xs">
          <Input label="Common Monthly Fee (₹)" type="number" min="0" value={feeDraft.monthlyFee} onChange={(e) => setFeeDraft({ ...feeDraft, monthlyFee: e.target.value })} />
          <div className="grid grid-cols-2 gap-3"><Input label="Generate Invoice On Day" type="number" min="1" max="28" value={feeDraft.generationDay} onChange={(e) => setFeeDraft({ ...feeDraft, generationDay: e.target.value })}/><Input label="Payment Due On Day" type="number" min="1" max="28" value={feeDraft.dueDay} onChange={(e) => setFeeDraft({ ...feeDraft, dueDay: e.target.value })}/></div>
          <div className="space-y-2"><div className="flex items-center justify-between"><strong>New Student Charges</strong><Button type="button" size="xs" variant="outline" onClick={() => setFeeDraft({ ...feeDraft, charges: [...feeDraft.charges, { id: `cfi-${Date.now()}`, name: '', amount: 0, status: 'active' }] })}>+ Add Charge</Button></div>
            {feeDraft.charges.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-slate-500">No joining or admission charges configured.</p>}
            {feeDraft.charges.map((item, index) => <div key={item.id} className="grid grid-cols-[1fr_140px_auto] gap-2"><input className="rounded-lg border px-3 py-2" placeholder="e.g. Admission Fee" value={item.name} onChange={(e) => setFeeDraft({ ...feeDraft, charges: feeDraft.charges.map((row, i) => i === index ? { ...row, name: e.target.value } : row) })}/><input className="rounded-lg border px-3 py-2" type="number" min="0" placeholder="Amount" value={item.amount || ''} onChange={(e) => setFeeDraft({ ...feeDraft, charges: feeDraft.charges.map((row, i) => i === index ? { ...row, amount: Number(e.target.value) || 0 } : row) })}/><Button type="button" variant="danger" size="xs" onClick={() => setFeeDraft({ ...feeDraft, charges: feeDraft.charges.filter((_, i) => i !== index) })}>Remove</Button></div>)}
          </div>
          <div className="flex justify-end gap-2 border-t pt-3"><Button variant="outline" onClick={() => setFeeClass(null)}>Cancel</Button><Button onClick={async () => { if (!feeClass) return; const generationDay = Number(feeDraft.generationDay); const dueDay = Number(feeDraft.dueDay); if (generationDay < 1 || generationDay > 28 || dueDay < 1 || dueDay > 28) { toastError('Invoice and due days must be between 1 and 28'); return; } const validCharges = feeDraft.charges.filter((item) => item.name.trim() && item.amount > 0); await academicService.updateClass(feeClass.id, { common_monthly_fee: Number(feeDraft.monthlyFee) || undefined, monthly_fee_generation_day: generationDay, monthly_fee_due_day: dueDay, new_student_charges: validCharges }); success('Class fee configuration saved'); setFeeClass(null); loadClasses(); }}>Save Class Fees</Button></div>
        </div>
      </Modal>

      {/* Section Create / Edit Modal */}
      <Modal
        isOpen={isSectionModalOpen}
        onClose={() => {
          setIsSectionModalOpen(false);
          setEditingSection(null);
        }}
        title={editingSection ? `Edit Section: ${editingSection.name}` : 'Configure Class or Section'}
        description="Leave the section blank to assign the classroom and Class Teacher to the whole class"
      >
        <form onSubmit={handleSaveSection} className="space-y-4 text-left text-xs">
          <Input
            label={editingSection ? 'Section Name *' : 'Section Name (Optional)'}
            required={Boolean(editingSection)}
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value.toUpperCase())}
            placeholder="Leave blank for whole class, or enter A, B, C..."
          />

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assigned Classroom / Lab</label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
            >
              <option value="">No Room Assigned</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_number} - {r.name} ({r.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Class Teacher</label>
            <select
              value={selectedClassTeacherId}
              onChange={(e) => setSelectedClassTeacherId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
            >
              <option value="">No Class Teacher Assigned</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.first_name} {t.last_name} ({t.employee_number})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsSectionModalOpen(false);
                setEditingSection(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Section
            </Button>
          </div>
        </form>
      </Modal>

      {/* Move to New Session Modal */}
      <SessionTransitionModal
        isOpen={isTransitionModalOpen}
        onClose={() => setIsTransitionModalOpen(false)}
        onTransitionComplete={() => {
          loadClasses();
        }}
      />
    </div>
  );
}
