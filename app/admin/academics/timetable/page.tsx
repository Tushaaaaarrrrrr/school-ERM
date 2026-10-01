'use client';

// ============================================================================
// Academic Timetable Management with Conflict Prevention & Special Slots
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import {
  timetableService,
  classService,
  subjectService,
  teacherService,
} from '@/lib/services/api';
import {
  TimetableEntry,
  SchoolClass,
  Section,
  Subject,
  Teacher,
  TimetableSlotType,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatTime, getDayName } from '@/lib/utils/formatters';
import { confirmDeleteTwice } from '@/lib/utils/delete-confirm';
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  UtensilsCrossed,
  Trophy,
  Volume2,
  BookOpen,
  Sparkles,
  Edit2,
  Trash2,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

const DAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

export default function TimetablePage() {
  const { currentSchool, currentYear } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const yearId = currentYear?.id || 'ay-2026';
  const { success, error: toastError } = useToast();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Class & Section Selection
  const [selectedClassId, setSelectedClassId] = useState('cls-08');
  const [selectedSectionId, setSelectedSectionId] = useState('sec-8a');
  const [dayFilter, setDayFilter] = useState<'today' | 'all' | number>('today');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form State
  const [slotData, setSlotData] = useState<{
    dayOfWeek: number;
    periodNumber: number;
    periodName: string;
    slotType: TimetableSlotType;
    startTime: string;
    endTime: string;
    subjectId: string;
    teacherId: string;
    room: string;
  }>({
    dayOfWeek: 1,
    periodNumber: 1,
    periodName: 'Period 1',
    slotType: 'subject',
    startTime: '08:30',
    endTime: '09:15',
    subjectId: '',
    teacherId: '',
    room: 'Room 204',
  });

  const getTodayDayOfWeek = (): number => {
    const d = new Date().getDay();
    return d === 0 ? 1 : d;
  };

  const todayDayNum = getTodayDayOfWeek();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [clsList, secList, subList, tchList, ttList] = await Promise.all([
        classService.getClasses(schoolId),
        classService.getSections(schoolId),
        subjectService.getSubjects(schoolId),
        teacherService.getTeachers(schoolId),
        timetableService.getTimetable(schoolId, {
          classId: selectedClassId,
          sectionId: selectedSectionId,
        }),
      ]);

      setClasses(clsList);
      setSections(secList);
      setSubjects(subList);
      setTeachers(tchList);
      setEntries(ttList);

      if (clsList.length > 0 && !selectedClassId) {
        setSelectedClassId(clsList[0].id);
      }

      if (subList.length > 0 && !slotData.subjectId) {
        setSlotData((prev) => ({
          ...prev,
          subjectId: subList[0].id,
          teacherId: tchList[0]?.id || '',
        }));
      }
    } catch {
      toastError('Failed to load timetable');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId, selectedClassId, selectedSectionId]);

  const handleOpenAddSlot = (dayNum?: number) => {
    const targetDay =
      dayNum ||
      (dayFilter === 'today' ? todayDayNum : typeof dayFilter === 'number' ? dayFilter : 1);
    const existingDaySlots = entries.filter((t) => t.day_of_week === targetDay);
    const nextPeriodNum = existingDaySlots.length + 1;

    setEditingSlotId(null);
    setSlotData({
      dayOfWeek: targetDay,
      periodNumber: nextPeriodNum,
      periodName: `Period ${nextPeriodNum}`,
      slotType: 'subject',
      startTime: '08:30',
      endTime: '09:15',
      subjectId: subjects[0]?.id || '',
      teacherId: teachers[0]?.id || '',
      room: 'Classroom',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditSlot = (slot: TimetableEntry) => {
    setEditingSlotId(slot.id);
    setSlotData({
      dayOfWeek: slot.day_of_week,
      periodNumber: slot.period_number || 1,
      periodName: slot.period_name || slot.subject_name || 'Period',
      slotType: slot.slot_type || 'subject',
      startTime: slot.start_time,
      endTime: slot.end_time,
      subjectId: slot.subject_id || '',
      teacherId: slot.teacher_id || '',
      room: slot.room || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotData.startTime || !slotData.endTime) {
      toastError('Please enter start and end time');
      return;
    }
    if (slotData.endTime <= slotData.startTime) {
      toastError('End time must be after start time');
      return;
    }

    setIsSubmitting(true);
    const selectedSub = subjects.find((s) => s.id === slotData.subjectId);
    const selectedTch = teachers.find((t) => t.id === slotData.teacherId);
    const currentClass = classes.find((c) => c.id === selectedClassId);
    const currentSec = sections.find((s) => s.id === selectedSectionId);

    let finalSubjectName = selectedSub?.name || 'Academic Subject';
    if (slotData.slotType === 'break') finalSubjectName = 'Lunch Break';
    else if (slotData.slotType === 'games') finalSubjectName = 'Games & Sports Period';
    else if (slotData.slotType === 'library') finalSubjectName = 'Library Period';
    else if (slotData.slotType === 'assembly') finalSubjectName = 'Morning Assembly';
    else if (slotData.slotType === 'activity') finalSubjectName = 'Activity / Club';

    try {
      if (editingSlotId) {
        await timetableService.updateTimetableEntry(editingSlotId, {
          day_of_week: Number(slotData.dayOfWeek),
          period_number: Number(slotData.periodNumber),
          period_name: slotData.periodName || `Period ${slotData.periodNumber}`,
          slot_type: slotData.slotType,
          subject_id: slotData.slotType === 'subject' ? slotData.subjectId : undefined,
          subject_name: finalSubjectName,
          teacher_id: slotData.slotType !== 'break' ? slotData.teacherId : undefined,
          teacher_name:
            slotData.slotType !== 'break'
              ? selectedTch
                ? `${selectedTch.first_name} ${selectedTch.last_name}`
                : undefined
              : undefined,
          start_time: slotData.startTime,
          end_time: slotData.endTime,
          room: slotData.room,
        });
        success('Schedule slot updated successfully!');
      } else {
        await timetableService.createTimetableEntry({
          school_id: schoolId,
          academic_year_id: yearId,
          class_id: selectedClassId,
          class_name: currentClass?.name || 'Class',
          section_id: selectedSectionId,
          section_name: currentSec?.name || 'A',
          subject_id: slotData.slotType === 'subject' ? slotData.subjectId : undefined,
          subject_name: finalSubjectName,
          teacher_id: slotData.slotType !== 'break' ? slotData.teacherId : undefined,
          teacher_name:
            slotData.slotType !== 'break'
              ? selectedTch
                ? `${selectedTch.first_name} ${selectedTch.last_name}`
                : undefined
              : undefined,
          day_of_week: Number(slotData.dayOfWeek),
          period_number: Number(slotData.periodNumber),
          period_name: slotData.periodName || `Period ${slotData.periodNumber}`,
          slot_type: slotData.slotType,
          start_time: slotData.startTime,
          end_time: slotData.endTime,
          room: slotData.room,
        });
        success('Class period scheduled successfully!');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Error saving slot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirmDeleteTwice('this timetable slot')) return;
    try {
      await timetableService.deleteTimetableEntry(id);
      success('Period removed from schedule');
      loadData();
    } catch {
      toastError('Failed to remove period');
    }
  };

  const handleAutoGenerate = async () => {
    const currentClass = classes.find((c) => c.id === selectedClassId);
    const currentSec = sections.find((s) => s.id === selectedSectionId);
    if (!currentClass || !currentSec) {
      toastError('Please select a class and section first');
      return;
    }
    if (!confirm(`Auto-generate standard schedule (6 periods + lunch + games) for ${currentClass.name} (Section ${currentSec.name})?`))
      return;

    setIsGenerating(true);
    try {
      await timetableService.generateDefaultClassSchedule({
        schoolId,
        academicYearId: yearId,
        classId: selectedClassId,
        className: currentClass.name,
        sectionId: selectedSectionId,
        sectionName: currentSec.name,
        teachers: teachers.map((t) => ({ id: t.id, name: `${t.first_name} ${t.last_name}` })),
        subjects: subjects.map((s) => ({ id: s.id, name: s.name })),
      });
      success('Standard schedule generated successfully!');
      loadData();
    } catch (err: any) {
      toastError(err?.message || 'Failed to generate schedule');
    } finally {
      setIsGenerating(false);
    }
  };

  const classSections = sections.filter((s) => s.class_id === selectedClassId);

  return (
    <div className="space-y-6 text-left">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Class Schedule & Timetable</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Sparkles className="w-4 h-4 text-amber-600" />}
            onClick={handleAutoGenerate}
            isLoading={isGenerating}
          >
            Auto-Fill Schedule
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => handleOpenAddSlot()}
          >
            Add Period
          </Button>
        </div>
      </div>

      {/* Class, Section & Day Filter Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                const matchingSec = sections.find((s) => s.class_id === e.target.value);
                if (matchingSec) setSelectedSectionId(matchingSec.id);
              }}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:ring-indigo-500"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Section:</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:ring-indigo-500"
            >
              {classSections.map((s) => (
                <option key={s.id} value={s.id}>
                  Section {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Day Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setDayFilter('today')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              dayFilter === 'today'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Today ({getDayName(todayDayNum).slice(0, 3)})</span>
          </button>

          <button
            onClick={() => setDayFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              dayFilter === 'all'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Full Week
          </button>

          {DAYS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDayFilter(d.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                dayFilter === d.id
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {d.short}
            </button>
          ))}
        </div>
      </div>

      {/* Timetable Grid by Days */}
      {isLoading ? (
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <TableSkeleton rows={4} cols={5} />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No periods scheduled for this section</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add periods manually or auto-fill a standard 6-period schedule with lunch and games.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={handleAutoGenerate}
              isLoading={isGenerating}
            >
              Auto-Fill Schedule
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {DAYS.filter((d) => {
            if (dayFilter === 'today') return d.id === todayDayNum;
            if (dayFilter === 'all') return true;
            return d.id === dayFilter;
          }).map((d) => {
            const dayEntries = entries.filter((e) => e.day_of_week === d.id);
            const isToday = d.id === todayDayNum;

            return (
              <div
                key={d.id}
                className={`bg-white rounded-xl border shadow-xs overflow-hidden flex flex-col ${
                  isToday ? 'border-indigo-300 ring-2 ring-indigo-50' : 'border-slate-200'
                }`}
              >
                <div
                  className={`p-3.5 flex items-center justify-between ${
                    isToday ? 'bg-indigo-900 text-white' : 'bg-slate-900 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider">{d.name}</h3>
                    {isToday && (
                      <span className="bg-emerald-500 text-white font-bold text-[9px] uppercase px-1.5 py-0.5 rounded">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold bg-slate-800 text-indigo-300 px-2 py-0.5 rounded">
                    {dayEntries.length} Periods
                  </span>
                </div>

                <div className="p-3.5 flex-1 space-y-2.5">
                  {dayEntries.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center italic">No periods scheduled</p>
                  ) : (
                    dayEntries.map((slot) => {
                      const isBreak = slot.slot_type === 'break';
                      const isGames = slot.slot_type === 'games';
                      const isLibrary = slot.slot_type === 'library';

                      return (
                        <div
                          key={slot.id}
                          className={`p-3 rounded-lg border transition-colors space-y-1 ${
                            isBreak
                              ? 'bg-amber-50/70 border-amber-200'
                              : isGames
                              ? 'bg-emerald-50/70 border-emerald-200'
                              : isLibrary
                              ? 'bg-purple-50/70 border-purple-200'
                              : 'bg-slate-50 border-slate-200/80 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              {isBreak ? (
                                <UtensilsCrossed className="w-3 h-3 text-amber-700" />
                              ) : isGames ? (
                                <Trophy className="w-3 h-3 text-emerald-700" />
                              ) : null}
                              {slot.subject_name || slot.period_name}
                            </span>
                            <span className="font-mono text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </span>
                          </div>

                          {slot.teacher_name && (
                            <p className="text-[11px] text-slate-600 font-medium">👨‍🏫 {slot.teacher_name}</p>
                          )}

                          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{slot.room || 'Classroom'}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditSlot(slot)}
                                className="p-0.5 rounded hover:text-indigo-600"
                                title="Edit slot"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="p-0.5 rounded hover:text-rose-600"
                                title="Delete slot"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Slot Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSlotId ? 'Edit Schedule Slot' : 'Schedule Class Period'}
        description="Assign a subject or break, teacher, and time slot to this class"
      >
        <form onSubmit={handleSaveSlot} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Day of Week"
              value={slotData.dayOfWeek}
              onChange={(e) => setSlotData({ ...slotData, dayOfWeek: Number(e.target.value) })}
            >
              {DAYS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select
              label="Slot Type"
              value={slotData.slotType}
              onChange={(e) => {
                const newType = e.target.value as TimetableSlotType;
                let defaultName = slotData.periodName;
                if (newType === 'break') defaultName = 'Lunch Break';
                else if (newType === 'games') defaultName = 'Games Period';
                else if (newType === 'library') defaultName = 'Library Period';
                else if (newType === 'assembly') defaultName = 'Morning Assembly';
                else if (newType === 'subject' && defaultName.includes('Break'))
                  defaultName = `Period ${slotData.periodNumber}`;
                setSlotData({ ...slotData, slotType: newType, periodName: defaultName });
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
              value={slotData.periodNumber}
              onChange={(e) => setSlotData({ ...slotData, periodNumber: Number(e.target.value) || 1 })}
            />

            <Input
              label="Period Label"
              placeholder="e.g. Period 1, Lunch Break"
              value={slotData.periodName}
              onChange={(e) => setSlotData({ ...slotData, periodName: e.target.value })}
            />
          </div>

          {slotData.slotType === 'subject' && (
            <Select
              label="Subject"
              required
              value={slotData.subjectId}
              onChange={(e) => setSlotData({ ...slotData, subjectId: e.target.value })}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code || 'SUB'})
                </option>
              ))}
            </Select>
          )}

          {slotData.slotType !== 'break' && (
            <Select
              label="Faculty / Teacher"
              value={slotData.teacherId}
              onChange={(e) => setSlotData({ ...slotData, teacherId: e.target.value })}
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
              value={slotData.startTime}
              onChange={(e) => setSlotData({ ...slotData, startTime: e.target.value })}
            />
            <Input
              label="End Time"
              type="time"
              required
              value={slotData.endTime}
              onChange={(e) => setSlotData({ ...slotData, endTime: e.target.value })}
            />
          </div>

          <Input
            label="Room / Hall / Venue"
            value={slotData.room}
            onChange={(e) => setSlotData({ ...slotData, room: e.target.value })}
            placeholder="e.g. Room 204 or Sports Ground"
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
              {editingSlotId ? 'Save Changes' : 'Schedule Period'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
