'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import {
  academicService,
  attendanceService,
  examService,
  studentService,
  timetableService,
  teacherService,
  subjectService,
} from '@/lib/services/api';
import {
  Exam,
  ExamResult,
  SchoolClass,
  Student,
  StudentAttendance,
  TimetableEntry,
  Teacher,
  Subject,
  TimetableSlotType,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { formatTime, getDayName } from '@/lib/utils/formatters';
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Clock,
  Edit2,
  IndianRupee,
  Layers,
  MapPin,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  UtensilsCrossed,
  Volume2,
} from 'lucide-react';

type ClassTab = 'overview' | 'students' | 'schedule' | 'attendance' | 'tests' | 'fees';

const DAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

export default function ClassDetailsPage() {
  const params = useParams<{ id: string }>();
  const { currentSchool, currentYear } = useAuth();
  const schoolId = currentSchool?.id || '';
  const yearId = currentYear?.id || 'ay-2026';
  const classId = params.id;
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<ClassTab>('overview');
  const [schoolClass, setSchoolClass] = useState<SchoolClass | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Record<string, ExamResult[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('');

  // Schedule & Timetable State
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [scheduleDayFilter, setScheduleDayFilter] = useState<'today' | 'all' | number>('today');
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);

  // Add / Edit Slot Form State
  const [slotForm, setSlotForm] = useState<{
    dayOfWeek: number;
    periodNumber: number;
    periodName: string;
    slotType: TimetableSlotType;
    subjectId: string;
    teacherId: string;
    startTime: string;
    endTime: string;
    room: string;
  }>({
    dayOfWeek: 1,
    periodNumber: 1,
    periodName: 'Period 1',
    slotType: 'subject',
    subjectId: '',
    teacherId: '',
    startTime: '08:30',
    endTime: '09:15',
    room: '',
  });

  const getTodayDayOfWeek = (): number => {
    const d = new Date().getDay();
    return d === 0 ? 1 : d; // If Sunday, default to Monday
  };

  const loadData = async () => {
    if (!schoolId || !classId) return;
    setIsLoading(true);
    try {
      const [classes, studentList, attendanceList, examList, timetableList, teacherList, subjectList] =
        await Promise.all([
          academicService.getClasses(schoolId),
          studentService.getStudents(schoolId, { classId }),
          attendanceService.getAttendance(schoolId, { classId }),
          examService.getExams(schoolId, { classId }),
          timetableService.getTimetable(schoolId, { classId }),
          teacherService.getTeachers(schoolId),
          subjectService.getSubjects(schoolId),
        ]);
      const selected = classes.find((item) => item.id === classId) || null;
      setSchoolClass(selected);
      setStudents(studentList);
      setAttendance(attendanceList);
      setExams(examList);
      setTimetable(timetableList);
      setTeachers(teacherList);
      setSubjects(subjectList);
      setName(selected?.name || '');
      setSortOrder(selected ? String(selected.sort_order) : '');

      if (selected?.sections && selected.sections.length > 0 && !selectedSectionId) {
        setSelectedSectionId(selected.sections[0].id);
      }

      if (subjectList.length > 0 && !slotForm.subjectId) {
        setSlotForm((prev) => ({
          ...prev,
          subjectId: subjectList[0].id,
          teacherId: teacherList[0]?.id || '',
        }));
      }

      const resultEntries = await Promise.all(
        examList.map(async (exam) => [exam.id, await examService.getExamResults(exam.id)] as const)
      );
      setResults(Object.fromEntries(resultEntries));
    } catch {
      toastError('Failed to load class information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId, classId]);

  const attendanceByStudent = useMemo(
    () =>
      new Map(
        students.map((student) => {
          const records = attendance.filter((item) => item.student_id === student.id);
          const present = records.filter((item) => item.status === 'present').length;
          return [
            student.id,
            {
              records: records.length,
              present,
              absent: records.filter((item) => item.status === 'absent').length,
              rate: records.length ? (present / records.length) * 100 : null,
            },
          ];
        })
      ),
    [students, attendance]
  );

  const saveClass = async () => {
    if (!schoolClass || !name.trim()) return;
    try {
      const updated = await academicService.updateClass(schoolClass.id, {
        name: name.trim(),
        sort_order: Number(sortOrder) || 0,
      });
      setSchoolClass({ ...schoolClass, ...updated });
      success('Class information updated');
    } catch {
      toastError('Failed to update class');
    }
  };

  // Filter timetable by section
  const sectionTimetable = useMemo(() => {
    if (!selectedSectionId) return timetable;
    return timetable.filter((t) => t.section_id === selectedSectionId || !t.section_id);
  }, [timetable, selectedSectionId]);

  // Handle open modal for new slot
  const handleOpenAddSlot = (dayNum?: number) => {
    const targetDay =
      dayNum ||
      (scheduleDayFilter === 'today'
        ? getTodayDayOfWeek()
        : typeof scheduleDayFilter === 'number'
        ? scheduleDayFilter
        : 1);
    const existingDaySlots = sectionTimetable.filter((t) => t.day_of_week === targetDay);
    const nextPeriodNum = existingDaySlots.length + 1;

    setEditingSlotId(null);
    setSlotForm({
      dayOfWeek: targetDay,
      periodNumber: nextPeriodNum,
      periodName: `Period ${nextPeriodNum}`,
      slotType: 'subject',
      subjectId: subjects[0]?.id || '',
      teacherId: teachers[0]?.id || '',
      startTime: '08:30',
      endTime: '09:15',
      room: schoolClass?.name ? `Room ${schoolClass.name}` : 'Classroom',
    });
    setIsSlotModalOpen(true);
  };

  // Handle edit slot
  const handleOpenEditSlot = (slot: TimetableEntry) => {
    setEditingSlotId(slot.id);
    setSlotForm({
      dayOfWeek: slot.day_of_week,
      periodNumber: slot.period_number || 1,
      periodName: slot.period_name || slot.subject_name || 'Period',
      slotType: slot.slot_type || 'subject',
      subjectId: slot.subject_id || '',
      teacherId: slot.teacher_id || '',
      startTime: slot.start_time,
      endTime: slot.end_time,
      room: slot.room || '',
    });
    setIsSlotModalOpen(true);
  };

  // Save slot (create or update)
  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotForm.startTime || !slotForm.endTime) {
      toastError('Please specify start and end time');
      return;
    }
    if (slotForm.endTime <= slotForm.startTime) {
      toastError('Closing time must be after start time');
      return;
    }

    const currentSection =
      schoolClass?.sections?.find((s) => s.id === selectedSectionId) || schoolClass?.sections?.[0];
    const selectedSub = subjects.find((s) => s.id === slotForm.subjectId);
    const selectedTch = teachers.find((t) => t.id === slotForm.teacherId);

    let finalSubjectName = selectedSub?.name || 'Class Subject';
    if (slotForm.slotType === 'break') finalSubjectName = 'Lunch Break';
    else if (slotForm.slotType === 'games') finalSubjectName = 'Games & Sports Period';
    else if (slotForm.slotType === 'library') finalSubjectName = 'Library Period';
    else if (slotForm.slotType === 'assembly') finalSubjectName = 'Morning Assembly';
    else if (slotForm.slotType === 'activity') finalSubjectName = 'Activity & Club Period';

    try {
      if (editingSlotId) {
        await timetableService.updateTimetableEntry(editingSlotId, {
          day_of_week: Number(slotForm.dayOfWeek),
          period_number: Number(slotForm.periodNumber),
          period_name: slotForm.periodName || `Period ${slotForm.periodNumber}`,
          slot_type: slotForm.slotType,
          subject_id: slotForm.slotType === 'subject' ? slotForm.subjectId : undefined,
          subject_name: finalSubjectName,
          teacher_id: slotForm.slotType !== 'break' ? slotForm.teacherId : undefined,
          teacher_name:
            slotForm.slotType !== 'break'
              ? selectedTch
                ? `${selectedTch.first_name} ${selectedTch.last_name}`
                : undefined
              : undefined,
          start_time: slotForm.startTime,
          end_time: slotForm.endTime,
          room: slotForm.room,
        });
        success('Schedule period updated successfully');
      } else {
        await timetableService.createTimetableEntry({
          school_id: schoolId,
          academic_year_id: yearId,
          class_id: classId,
          class_name: schoolClass?.name || 'Class',
          section_id: selectedSectionId || currentSection?.id || 'sec-default',
          section_name: currentSection?.name || 'A',
          day_of_week: Number(slotForm.dayOfWeek),
          period_number: Number(slotForm.periodNumber),
          period_name: slotForm.periodName || `Period ${slotForm.periodNumber}`,
          slot_type: slotForm.slotType,
          subject_id: slotForm.slotType === 'subject' ? slotForm.subjectId : undefined,
          subject_name: finalSubjectName,
          teacher_id: slotForm.slotType !== 'break' ? slotForm.teacherId : undefined,
          teacher_name:
            slotForm.slotType !== 'break'
              ? selectedTch
                ? `${selectedTch.first_name} ${selectedTch.last_name}`
                : undefined
              : undefined,
          start_time: slotForm.startTime,
          end_time: slotForm.endTime,
          room: slotForm.room,
        });
        success('Schedule period added successfully');
      }

      setIsSlotModalOpen(false);
      const updatedList = await timetableService.getTimetable(schoolId, { classId });
      setTimetable(updatedList);
    } catch (err: any) {
      toastError(err?.message || 'Failed to save schedule period');
    }
  };

  // Delete slot
  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to remove this period from the schedule?')) return;
    try {
      await timetableService.deleteTimetableEntry(slotId);
      success('Period removed from schedule');
      const updatedList = await timetableService.getTimetable(schoolId, { classId });
      setTimetable(updatedList);
    } catch {
      toastError('Failed to remove period');
    }
  };

  // Auto-generate standard schedule (6 periods + lunch + games for Mon-Sat)
  const handleAutoGenerate = async () => {
    const currentSection =
      schoolClass?.sections?.find((s) => s.id === selectedSectionId) || schoolClass?.sections?.[0];
    if (!currentSection) {
      toastError('Please create a section first before generating timetable');
      return;
    }
    if (
      !confirm(
        `Generate standard 6-period + Lunch Break + Games schedule for ${schoolClass?.name} (Section ${currentSection.name})?`
      )
    )
      return;

    setIsGeneratingSchedule(true);
    try {
      await timetableService.generateDefaultClassSchedule({
        schoolId,
        academicYearId: yearId,
        classId,
        className: schoolClass?.name || 'Class',
        sectionId: currentSection.id,
        sectionName: currentSection.name,
        teachers: teachers.map((t) => ({ id: t.id, name: `${t.first_name} ${t.last_name}` })),
        subjects: subjects.map((s) => ({ id: s.id, name: s.name })),
      });
      success('Standard weekly schedule generated successfully!');
      const updatedList = await timetableService.getTimetable(schoolId, { classId });
      setTimetable(updatedList);
    } catch (err: any) {
      toastError(err?.message || 'Failed to generate schedule');
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center text-sm text-slate-500">Loading class information…</div>;
  if (!schoolClass)
    return (
      <div className="max-w-xl mx-auto mt-12 rounded-2xl border bg-white p-10 text-center">
        <h1 className="font-bold">Class not found</h1>
        <Link href="/admin/academics/classes" className="text-sm text-indigo-600">
          Return to classes
        </Link>
      </div>
    );

  const tabs: { id: ClassTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview & Sections', icon: Layers },
    { id: 'students', label: `Students (${students.length})`, icon: Users },
    { id: 'schedule', label: `Class Schedule (${sectionTimetable.length})`, icon: CalendarDays },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'tests', label: `Tests & Results (${exams.length})`, icon: BookOpen },
    { id: 'fees', label: 'Class Fees', icon: IndianRupee },
  ];

  const todayDayNum = getTodayDayOfWeek();

  return (
    <div className="space-y-6 text-left w-full">
      {/* Page Header */}
      <div className="flex items-start gap-3">
        <Link href="/admin/academics/classes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{schoolClass.name}</h1>
            <StatusBadge status={schoolClass.status} />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold ${
                activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & SECTIONS */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="font-bold">Class Information</h2>
            <Input label="Class Name" value={name} onChange={(event) => setName(event.target.value)} />
            <Input
              label="Display Order"
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            />
            <Button onClick={saveClass} leftIcon={<Save className="w-4 h-4" />}>
              Save Class Information
            </Button>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="p-5 border-b">
              <h2 className="font-bold">Sections, Rooms & Class Teachers</h2>
            </div>
            {!schoolClass.sections?.length ? (
              <p className="p-8 text-center text-sm text-slate-500">No sections created.</p>
            ) : (
              <div className="divide-y">
                {schoolClass.sections.map((section) => (
                  <div key={section.id} className="p-5 grid sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-xs text-slate-400 block">Section</span>
                      <strong>{section.name}</strong>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Room</span>
                      <strong>{section.room_number || 'Not assigned'}</strong>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Class Teacher</span>
                      <strong>{section.class_teacher_name || 'Not assigned'}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: STUDENTS */}
      {activeTab === 'students' && (
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="font-bold">Enrolled Students</h2>
          </div>
          {students.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">No students enrolled.</p>
          ) : (
            <div className="divide-y">
              {students.map((student) => (
                <Link
                  href={`/admin/students/${student.id}`}
                  key={student.id}
                  className="grid grid-cols-[1fr_auto] gap-4 p-4 hover:bg-slate-50"
                >
                  <div>
                    <strong className="block">
                      {student.first_name} {student.last_name}
                    </strong>
                    <span className="text-xs text-slate-500">
                      {student.registration_number} · Roll{' '}
                      {student.current_enrollment?.roll_number || 'Not assigned'} ·{' '}
                      {student.current_enrollment?.section_name
                        ? `Section ${student.current_enrollment.section_name}`
                        : 'No section'}
                    </span>
                  </div>
                  <span className="self-center text-xs font-semibold text-indigo-600">View full profile</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: CLASS SCHEDULE / TIMETABLE (NEW) */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Controls Bar: Section Selector, View Filter & Add Slot Action */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Section Selector */}
              <div className="flex flex-wrap items-center gap-3">
                {schoolClass.sections && schoolClass.sections.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Section:</span>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      {schoolClass.sections.map((sec) => (
                        <button
                          key={sec.id}
                          onClick={() => setSelectedSectionId(sec.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            selectedSectionId === sec.id
                              ? 'bg-white text-indigo-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Section {sec.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <span className="text-xs font-medium text-slate-400 hidden sm:inline">|</span>

                {/* Day Filter Pills */}
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setScheduleDayFilter('today')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      scheduleDayFilter === 'today'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Today ({getDayName(todayDayNum).slice(0, 3)})</span>
                  </button>

                  <button
                    onClick={() => setScheduleDayFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      scheduleDayFilter === 'all'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Full Week
                  </button>

                  {DAYS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setScheduleDayFilter(d.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        scheduleDayFilter === d.id
                          ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {d.short}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                  onClick={handleAutoGenerate}
                  isLoading={isGeneratingSchedule}
                  title="Auto-fill 6 periods, lunch, and games across the week"
                >
                  Auto-Fill Schedule
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => handleOpenAddSlot()}
                >
                  Add Period
                </Button>
              </div>
            </div>
          </div>

          {/* Schedule Display */}
          {sectionTimetable.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <CalendarDays className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">No schedule periods configured</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Create daily class periods, lunch breaks, and sports/games slots, or auto-generate a complete weekly timetable in one click.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  onClick={handleAutoGenerate}
                  isLoading={isGeneratingSchedule}
                >
                  Auto-Fill Standard Schedule
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => handleOpenAddSlot()}
                >
                  Add Single Period
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {DAYS.filter((d) => {
                if (scheduleDayFilter === 'today') return d.id === todayDayNum;
                if (scheduleDayFilter === 'all') return true;
                return d.id === scheduleDayFilter;
              }).map((day) => {
                const daySlots = sectionTimetable
                  .filter((t) => t.day_of_week === day.id)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time));
                const isToday = day.id === todayDayNum;

                return (
                  <div
                    key={day.id}
                    className={`bg-white rounded-2xl border shadow-xs overflow-hidden ${
                      isToday ? 'border-indigo-300 ring-2 ring-indigo-50' : 'border-slate-200'
                    }`}
                  >
                    {/* Day Header */}
                    <div
                      className={`p-4 flex items-center justify-between border-b ${
                        isToday ? 'bg-indigo-900 text-white' : 'bg-slate-900 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold uppercase tracking-wider">{day.name}</span>
                        {isToday && (
                          <span className="bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs">
                            Today's Schedule
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-300 font-medium">
                          {daySlots.length} Slots ({daySlots.filter((s) => s.slot_type === 'subject').length} Subject Periods)
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenAddSlot(day.id)}
                          className="text-white hover:bg-white/10 text-xs py-1 px-2.5 h-auto"
                          leftIcon={<Plus className="w-3.5 h-3.5" />}
                        >
                          Add Slot
                        </Button>
                      </div>
                    </div>

                    {/* Day Slots Grid */}
                    <div className="p-4 sm:p-5">
                      {daySlots.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 italic">
                          No periods or breaks scheduled for {day.name}.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                          {daySlots.map((slot) => {
                            const isBreak = slot.slot_type === 'break';
                            const isGames = slot.slot_type === 'games';
                            const isLibrary = slot.slot_type === 'library';
                            const isAssembly = slot.slot_type === 'assembly';
                            const isActivity = slot.slot_type === 'activity';

                            return (
                              <div
                                key={slot.id}
                                className={`rounded-xl border p-3.5 flex flex-col justify-between gap-3 transition-all hover:shadow-sm ${
                                  isBreak
                                    ? 'bg-amber-50/70 border-amber-200'
                                    : isGames
                                    ? 'bg-emerald-50/70 border-emerald-200'
                                    : isLibrary
                                    ? 'bg-purple-50/70 border-purple-200'
                                    : isAssembly
                                    ? 'bg-blue-50/70 border-blue-200'
                                    : isActivity
                                    ? 'bg-rose-50/70 border-rose-200'
                                    : 'bg-white border-slate-200 hover:border-indigo-300'
                                }`}
                              >
                                <div className="space-y-2">
                                  {/* Period Badge & Time */}
                                  <div className="flex items-center justify-between gap-2">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                        isBreak
                                          ? 'bg-amber-200 text-amber-900'
                                          : isGames
                                          ? 'bg-emerald-200 text-emerald-900'
                                          : isLibrary
                                          ? 'bg-purple-200 text-purple-900'
                                          : isAssembly
                                          ? 'bg-blue-200 text-blue-900'
                                          : 'bg-indigo-100 text-indigo-800'
                                      }`}
                                    >
                                      {isBreak ? (
                                        <UtensilsCrossed className="w-3 h-3" />
                                      ) : isGames ? (
                                        <Trophy className="w-3 h-3" />
                                      ) : isAssembly ? (
                                        <Volume2 className="w-3 h-3" />
                                      ) : (
                                        <BookOpen className="w-3 h-3" />
                                      )}
                                      {slot.period_name || `Period ${slot.period_number || 1}`}
                                    </span>

                                    <span className="font-mono text-[11px] font-bold text-slate-700 bg-white/80 px-2 py-0.5 rounded border border-slate-200/60 shadow-2xs">
                                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                    </span>
                                  </div>

                                  {/* Subject / Activity Title */}
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                      {slot.subject_name ||
                                        (isBreak
                                          ? 'Lunch Break'
                                          : isGames
                                          ? 'Games & Sports'
                                          : 'Class Period')}
                                    </h4>
                                    {slot.teacher_name && (
                                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                                        👨‍🏫 {slot.teacher_name}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Room / Location & Quick Actions */}
                                <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px]">
                                  <div className="flex items-center gap-1 text-slate-500 font-medium truncate">
                                    <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                                    <span className="truncate">{slot.room || 'Classroom'}</span>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => handleOpenEditSlot(slot)}
                                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                                      title="Edit slot"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSlot(slot.id)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                      title="Delete slot"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add / Edit Period Modal */}
          <Modal
            isOpen={isSlotModalOpen}
            onClose={() => setIsSlotModalOpen(false)}
            title={editingSlotId ? 'Edit Schedule Slot' : 'Add Period / Schedule Slot'}
            description="Configure subject, timing, faculty, and room for this period"
          >
            <form onSubmit={handleSaveSlot} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Day of the Week"
                  value={slotForm.dayOfWeek}
                  onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: Number(e.target.value) })}
                >
                  {DAYS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Slot Type"
                  value={slotForm.slotType}
                  onChange={(e) => {
                    const newType = e.target.value as TimetableSlotType;
                    let defaultName = slotForm.periodName;
                    if (newType === 'break') defaultName = 'Lunch Break';
                    else if (newType === 'games') defaultName = 'Games Period';
                    else if (newType === 'library') defaultName = 'Library Period';
                    else if (newType === 'assembly') defaultName = 'Morning Assembly';
                    else if (newType === 'subject' && defaultName.includes('Break'))
                      defaultName = `Period ${slotForm.periodNumber}`;
                    setSlotForm({ ...slotForm, slotType: newType, periodName: defaultName });
                  }}
                >
                  <option value="subject">Subject Class</option>
                  <option value="break">Lunch / Mid-Day Break 🥪</option>
                  <option value="games">Games / Sports Period ⚽</option>
                  <option value="library">Library / Reading 📚</option>
                  <option value="activity">Club / Activity Period 🎨</option>
                  <option value="assembly">Morning Assembly 📢</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Period Sequence Number"
                  type="number"
                  min={1}
                  max={12}
                  value={slotForm.periodNumber}
                  onChange={(e) => setSlotForm({ ...slotForm, periodNumber: Number(e.target.value) || 1 })}
                />

                <Input
                  label="Period Label"
                  placeholder="e.g. Period 1, Lunch Break, Games"
                  value={slotForm.periodName}
                  onChange={(e) => setSlotForm({ ...slotForm, periodName: e.target.value })}
                />
              </div>

              {slotForm.slotType === 'subject' && (
                <Select
                  label="Academic Subject"
                  required
                  value={slotForm.subjectId}
                  onChange={(e) => setSlotForm({ ...slotForm, subjectId: e.target.value })}
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || 'SUB'})
                    </option>
                  ))}
                </Select>
              )}

              {slotForm.slotType !== 'break' && (
                <Select
                  label="Assigned Teacher / Instructor"
                  value={slotForm.teacherId}
                  onChange={(e) => setSlotForm({ ...slotForm, teacherId: e.target.value })}
                >
                  <option value="">No teacher assigned / Self study</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.first_name} {t.last_name} ({t.employee_number || 'Faculty'})
                    </option>
                  ))}
                </Select>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  type="time"
                  required
                  value={slotForm.startTime}
                  onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                />

                <Input
                  label="End Time"
                  type="time"
                  required
                  value={slotForm.endTime}
                  onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                />
              </div>

              <Input
                label="Room / Hall / Venue"
                placeholder="e.g. Room 101, Sports Ground, Computer Lab"
                value={slotForm.room}
                onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
              />

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsSlotModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingSlotId ? 'Save Changes' : 'Add to Schedule'}
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* TAB 4: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="font-bold">Student Attendance</h2>
          </div>
          {attendance.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">No attendance has been taken for this class.</p>
          ) : (
            <div className="divide-y">
              {students.map((student) => {
                const stats = attendanceByStudent.get(student.id);
                return (
                  <div key={student.id} className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4">
                    <strong>
                      {student.first_name} {student.last_name}
                    </strong>
                    <span>Marked: {stats?.records || 0}</span>
                    <span>Present: {stats?.present || 0}</span>
                    <span>Absent: {stats?.absent || 0}</span>
                    <strong>{stats?.rate === null ? 'No data' : `${stats?.rate.toFixed(1)}%`}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 5: TESTS & RESULTS */}
      {activeTab === 'tests' && (
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="font-bold">Tests, Exams & Results</h2>
          </div>
          {exams.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">No tests or exams created.</p>
          ) : (
            <div className="divide-y">
              {exams.map((exam) => (
                <div key={exam.id} className="p-5 space-y-3">
                  <div className="flex justify-between gap-4">
                    <div>
                      <strong className="block">{exam.name}</strong>
                      <span className="text-xs text-slate-500">
                        {exam.subject_name || 'Subject not recorded'} · {exam.exam_date} · Maximum {exam.max_marks}
                      </span>
                    </div>
                    <span className="capitalize text-xs font-semibold">{exam.status}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    {results[exam.id]?.length
                      ? `${results[exam.id].length} student result(s) recorded`
                      : 'No results recorded'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 6: FEES */}
      {activeTab === 'fees' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5">
          <h2 className="font-bold">Class Fee Configuration</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-slate-400 block">Common Monthly Fee</span>
              <strong className="text-lg">
                {schoolClass.common_monthly_fee
                  ? `₹${schoolClass.common_monthly_fee.toLocaleString('en-IN')}`
                  : 'Not configured'}
              </strong>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Invoice Generation Day</span>
              <strong>{schoolClass.monthly_fee_generation_day || 'Not configured'}</strong>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Payment Due Day</span>
              <strong>{schoolClass.monthly_fee_due_day || 'Not configured'}</strong>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">New Student Charges</h3>
            {!schoolClass.new_student_charges?.length ? (
              <p className="text-sm text-slate-500">No charges configured.</p>
            ) : (
              <div className="divide-y rounded-xl border">
                {schoolClass.new_student_charges.map((charge) => (
                  <div key={charge.id} className="flex justify-between p-3">
                    <span>{charge.name}</span>
                    <strong>₹{charge.amount.toLocaleString('en-IN')}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
