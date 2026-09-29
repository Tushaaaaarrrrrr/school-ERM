'use client';

// ============================================================================
// Student Directory (Responsive Table / Mobile Cards with Search & Filters)
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { studentService, classService } from '@/lib/services/api';
import { Student, SchoolClass, Section } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { StatusBadge, InvoiceStatusBadge } from '@/components/ui/badge';
import { SearchFilterBar } from '@/components/ui/search-filter-bar';
import { useToast } from '@/components/ui/toast';
import {
  GraduationCap,
  Plus,
  Phone,
  Eye,
  UserCheck,
  UserX,
  FileText,
} from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton';

import { exportStudentsToCsv } from '@/lib/utils/export';
import { Download } from 'lucide-react';

export default function StudentsDirectoryPage() {
  const { currentSchool, currentUser } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stdList, clsList, secList] = await Promise.all([
        studentService.getStudents(schoolId),
        classService.getClasses(schoolId),
        classService.getSections(schoolId),
      ]);

      const healedList = stdList.map((st) => {
        if (!st.current_enrollment?.class_name) {
          const targetCls = clsList.find((c) => c.id === st.current_enrollment?.class_id) || (clsList.length === 1 ? clsList[0] : undefined);
          const targetSec = secList.find((s) => s.id === st.current_enrollment?.section_id) || (targetCls ? secList.find((s) => s.class_id === targetCls.id) : undefined);
          if (targetCls) {
            return {
              ...st,
              current_enrollment: {
                id: st.current_enrollment?.id || `enr-${st.id}`,
                school_id: st.school_id,
                student_id: st.id,
                academic_year_id: st.current_enrollment?.academic_year_id || 'ay-2026',
                academic_year_name: st.current_enrollment?.academic_year_name || '2026-27',
                class_id: targetCls.id,
                class_name: targetCls.name,
                section_id: targetSec?.id,
                section_name: targetSec?.name,
                roll_number: st.current_enrollment?.roll_number || '01',
                joined_at: st.current_enrollment?.joined_at || st.joining_date,
                status: 'active',
                created_at: st.current_enrollment?.created_at || st.created_at,
              },
            };
          }
        }
        return st;
      });

      setStudents(healedList);
      setClasses(clsList);
      setSections(secList);
    } catch {
      toastError('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const handleToggleStatus = async (student: Student) => {
    const nextStatus = student.status === 'active' ? 'inactive' : 'active';
    try {
      await studentService.updateStudentStatus(student.id, nextStatus);
      success(`Student marked as ${nextStatus}`);
      loadData();
    } catch {
      toastError('Unable to update student status');
    }
  };

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const query = search.toLowerCase();
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const regNo = s.registration_number.toLowerCase();
    const rollNo = s.current_enrollment?.roll_number?.toLowerCase() || '';
    const phone = s.guardian?.primary_phone || '';

    const matchSearch =
      fullName.includes(query) ||
      regNo.includes(query) ||
      rollNo.includes(query) ||
      phone.includes(query);

    const matchClass = classFilter ? s.current_enrollment?.class_id === classFilter : true;
    const matchSection = sectionFilter ? s.current_enrollment?.section_id === sectionFilter : true;
    const matchStatus = statusFilter ? s.status === statusFilter : true;

    return matchSearch && matchClass && matchSection && matchStatus;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Students</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            >
              Export
            </Button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20 text-xs font-semibold">
                <button
                  onClick={() => {
                    exportStudentsToCsv(filteredStudents, currentUser?.name, schoolId, 'filtered');
                    setIsExportMenuOpen(false);
                    success(`Exported ${filteredStudents.length} filtered students`);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 block"
                >
                  Export Current Results ({filteredStudents.length})
                </button>
                <button
                  onClick={() => {
                    exportStudentsToCsv(students, currentUser?.name, schoolId, 'all');
                    setIsExportMenuOpen(false);
                    success(`Exported all ${students.length} students`);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 border-t border-slate-100 block"
                >
                  Export All Students ({students.length})
                </button>
              </div>
            )}
          </div>

          <Link href="/admin/students/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Add Student
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, reg no, roll no or parent phone..."
        filters={[
          {
            id: 'class',
            label: 'Class',
            value: classFilter,
            onChange: setClassFilter,
            options: classes.map((c) => ({ label: c.name, value: c.id })),
          },
          {
            id: 'section',
            label: 'Section',
            value: sectionFilter,
            onChange: setSectionFilter,
            options: [
              { label: 'Section A', value: 'sec-8a' },
              { label: 'Section B', value: 'sec-8b' },
            ],
          },
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Graduated', value: 'graduated' },
            ],
          },
        ]}
        onClearAll={() => {
          setSearch('');
          setClassFilter('');
          setSectionFilter('');
          setStatusFilter('');
        }}
      />

      {/* Student List View */}
      {isLoading ? (
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <TableSkeleton rows={5} cols={8} />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-900 mb-1">No students found</h4>
          <p className="text-xs text-slate-500 mb-4">
            Try adjusting your search criteria or register a new student.
          </p>
          <Link href="/admin/students/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Add First Student
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Registration No.</th>
                  <th className="px-5 py-3.5">Class</th>
                  <th className="px-5 py-3.5">Section</th>
                  <th className="px-5 py-3.5">Roll No.</th>
                  <th className="px-5 py-3.5">Parent Contact</th>
                  <th className="px-5 py-3.5">Fee Status</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.map((student) => {
                  const latestInvoice = student.fee_invoices?.[0];
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/students/${student.id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600"
                        >
                          {student.first_name} {student.last_name}
                        </Link>
                        <div className="text-[11px] text-slate-400 capitalize">
                          {student.gender || 'student'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-indigo-600 font-semibold">
                        {student.registration_number}
                      </td>
                      <td className="px-5 py-3.5 font-medium">
                        {student.current_enrollment?.class_name || '—'}
                      </td>
                      <td className="px-5 py-3.5 font-medium">
                        {student.current_enrollment?.section_name || '—'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {student.current_enrollment?.roll_number || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-slate-900 font-medium">
                          {student.guardian?.guardian_name || student.guardian?.father_name || '—'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {student.guardian?.primary_phone || '—'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {latestInvoice ? (
                          <InvoiceStatusBadge status={latestInvoice.status} />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={student.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/students/${student.id}`}>
                            <button className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleToggleStatus(student)}
                            title={student.status === 'active' ? 'Deactivate Student' : 'Activate Student'}
                            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          >
                            {student.status === 'active' ? (
                              <UserX className="w-4 h-4 text-rose-500" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-emerald-500" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (Zero Horizontal Scroll) */}
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {filteredStudents.map((student) => {
              const latestInvoice = student.fee_invoices?.[0];
              return (
                <div key={student.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="text-sm font-bold text-slate-900 hover:text-indigo-600"
                      >
                        {student.first_name} {student.last_name}
                      </Link>
                      <p className="font-mono text-xs text-indigo-600 font-semibold">
                        Reg: {student.registration_number}
                      </p>
                    </div>
                    <StatusBadge status={student.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg text-xs text-center border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Class</span>
                      <p className="font-bold text-slate-800">{student.current_enrollment?.class_name || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Section</span>
                      <p className="font-bold text-slate-800">{student.current_enrollment?.section_name || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Roll No</span>
                      <p className="font-bold text-indigo-600">{student.current_enrollment?.roll_number || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{student.guardian?.primary_phone || 'No phone'}</span>
                    </div>
                    {latestInvoice && <InvoiceStatusBadge status={latestInvoice.status} />}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/students/${student.id}`}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      View Profile →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
