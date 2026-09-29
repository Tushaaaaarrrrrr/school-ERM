'use client';

// ============================================================================
// Receptionist Front-Desk & Admission Enquiry Hub
// ============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { receptionService, enquiryService, classService, schoolIdentifierService } from '@/lib/services/api';
import { Student, AdmissionEnquiry, EnquiryStatus, SchoolClass } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatDate, sanitizePersonName, isValidPersonName, sanitizeIndianMobile, isValidIndianMobile } from '@/lib/utils/formatters';
import {
  Search,
  User,
  GraduationCap,
  Building,
  Phone,
  Bus,
  ArrowRight,
  ExternalLink,
  Users,
  ShieldCheck,
  UserCheck,
  UserPlus,
  PhoneCall,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { FeatureGuard } from '@/components/layout/feature-guard';
import { CardSkeleton, TableSkeleton } from '@/components/ui/skeleton';

export default function ReceptionLookupPage() {
  const { currentSchool, currentUser } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  // Tab: 'search' | 'enquiries'
  const [activeTab, setActiveTab] = useState<'search' | 'enquiries'>('search');

  // Search Tab State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<
    {
      student: Student;
      roomNumber?: string;
      roomFloor?: string;
      classTeacherName?: string;
      classTeacherPhone?: string;
    }[]
  >([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Enquiries Tab State
  const [enquiries, setEnquiries] = useState<AdmissionEnquiry[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState<string>('all');
  const [enquirySearch, setEnquirySearch] = useState('');
  const [isEnquiriesLoading, setIsEnquiriesLoading] = useState(false);

  // New Enquiry Modal State
  const [isNewEnquiryOpen, setIsNewEnquiryOpen] = useState(false);
  const [newEnquiryData, setNewEnquiryData] = useState({
    student_name: '',
    parent_name: '',
    primary_phone: '',
    secondary_phone: '',
    email: '',
    interested_class: 'Class 1',
    source: 'walk_in' as 'phone' | 'walk_in' | 'website' | 'referral' | 'other',
    notes: '',
    status: 'interested' as EnquiryStatus,
    next_follow_up_at: new Date().toISOString().split('T')[0],
  });

  // Follow-up / Outcome Modal State
  const [activeEnquiryForFollowUp, setActiveEnquiryForFollowUp] = useState<AdmissionEnquiry | null>(null);
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState<EnquiryStatus>('interested');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  // Convert to Admission Modal State
  const [activeEnquiryForConvert, setActiveEnquiryForConvert] = useState<AdmissionEnquiry | null>(null);
  const [convertData, setConvertData] = useState({
    first_name: '',
    last_name: '',
    class_id: 'cls-08',
    section_id: 'sec-8a',
    registration_number: '',
  });
  const [isConverting, setIsConverting] = useState(false);

  // Load Enquiries & Classes
  const loadEnquiryData = async () => {
    setIsEnquiriesLoading(true);
    try {
      const [enqList, clsList] = await Promise.all([
        enquiryService.getEnquiries(schoolId, {
          status: enquiryStatusFilter !== 'all' ? (enquiryStatusFilter as EnquiryStatus) : undefined,
          search: enquirySearch || undefined,
        }),
        classService.getClasses(schoolId),
      ]);
      setEnquiries(enqList);
      setClasses(clsList);
    } catch {
      toastError('Failed to load enquiries');
    } finally {
      setIsEnquiriesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'enquiries') {
      loadEnquiryData();
    }
  }, [activeTab, schoolId, enquiryStatusFilter, enquirySearch]);

  // Initial load of students for search tab
  useEffect(() => {
    const fetchInitial = async () => {
      setIsSearchLoading(true);
      try {
        const res = await receptionService.searchStudentForVisitor(schoolId, query || 'a');
        setResults(res);
      } finally {
        setIsSearchLoading(false);
      }
    };
    fetchInitial();
  }, [schoolId]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      const res = await receptionService.searchStudentForVisitor(schoolId, 'a');
      setResults(res);
      return;
    }

    setIsSearchLoading(true);
    try {
      const res = await receptionService.searchStudentForVisitor(schoolId, val);
      setResults(res);
    } finally {
      setIsSearchLoading(false);
    }
  };

  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPersonName(newEnquiryData.student_name)) {
      toastError('Student name must contain letters only.');
      return;
    }
    if (!isValidPersonName(newEnquiryData.parent_name)) {
      toastError('Parent / Guardian name must contain letters only.');
      return;
    }
    if (!isValidIndianMobile(newEnquiryData.primary_phone)) {
      toastError('Primary phone must be a 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    if (newEnquiryData.secondary_phone && !isValidIndianMobile(newEnquiryData.secondary_phone)) {
      toastError('Secondary phone must be a 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    try {
      await enquiryService.createEnquiry({
        school_id: schoolId,
        student_name: newEnquiryData.student_name,
        parent_name: newEnquiryData.parent_name,
        primary_phone: newEnquiryData.primary_phone,
        secondary_phone: newEnquiryData.secondary_phone || undefined,
        email: newEnquiryData.email || undefined,
        interested_class: newEnquiryData.interested_class,
        source: newEnquiryData.source,
        notes: newEnquiryData.notes,
        status: newEnquiryData.status,
        next_follow_up_at: newEnquiryData.next_follow_up_at || undefined,
        created_by: currentUser?.id || 'stf-003',
        created_by_name: `${currentUser?.name || 'Receptionist'} (${currentUser?.role || 'Staff'})`,
      });

      success('Admission enquiry lead created successfully');
      setIsNewEnquiryOpen(false);
      setNewEnquiryData({
        student_name: '',
        parent_name: '',
        primary_phone: '',
        secondary_phone: '',
        email: '',
        interested_class: 'Class 1',
        source: 'walk_in',
        notes: '',
        status: 'interested',
        next_follow_up_at: new Date().toISOString().split('T')[0],
      });
      loadEnquiryData();
    } catch {
      toastError('Error creating enquiry');
    }
  };

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEnquiryForFollowUp) return;

    try {
      const updatedNotes = followUpNote
        ? `${activeEnquiryForFollowUp.notes || ''}\n[${new Date().toLocaleDateString()}] ${followUpNote}`
        : activeEnquiryForFollowUp.notes;

      await enquiryService.updateEnquiry(
        activeEnquiryForFollowUp.id,
        {
          status: followUpStatus,
          notes: updatedNotes,
          next_follow_up_at: nextFollowUpDate || undefined,
          last_contacted_at: new Date().toISOString().split('T')[0],
        },
        currentUser?.name || 'Receptionist'
      );

      success('Follow-up outcome logged successfully');
      setActiveEnquiryForFollowUp(null);
      setFollowUpNote('');
      loadEnquiryData();
    } catch {
      toastError('Error updating follow-up');
    }
  };

  const openConvertModal = async (enquiry: AdmissionEnquiry) => {
    setActiveEnquiryForConvert(enquiry);
    const parts = enquiry.student_name.split(' ');
    const nextRegistrationNumber = await schoolIdentifierService.nextStudentNumber(schoolId, currentSchool?.code);
    setConvertData({
      first_name: parts[0] || '',
      last_name: parts.slice(1).join(' ') || 'Kumar',
      class_id: classes[0]?.id || 'cls-08',
      section_id: 'sec-8a',
      registration_number: nextRegistrationNumber,
    });
  };

  const handleConvertStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEnquiryForConvert) return;

    setIsConverting(true);
    try {
      const res = await enquiryService.convertEnquiryToStudent(
        activeEnquiryForConvert.id,
        {
          first_name: convertData.first_name,
          last_name: convertData.last_name,
          class_id: convertData.class_id,
          section_id: convertData.section_id,
          registration_number: convertData.registration_number,
          school_code: currentSchool?.code,
        },
        currentUser?.name || 'Receptionist'
      );

      success(`Enquiry converted to Student: ${res.student.first_name} ${res.student.last_name} (${res.student.registration_number})!`);
      setActiveEnquiryForConvert(null);
      loadEnquiryData();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Error converting enquiry');
    } finally {
      setIsConverting(false);
    }
  };

  const getStatusBadge = (status: EnquiryStatus) => {
    switch (status) {
      case 'new':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">NEW</span>;
      case 'interested':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">POTENTIAL / INTERESTED</span>;
      case 'contacted':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">CONTACTED</span>;
      case 'follow_up':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">FOLLOW UP</span>;
      case 'admitted':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">ADMITTED</span>;
      case 'not_interested':
      case 'closed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">CLOSED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <FeatureGuard feature="reception">
      <div className="space-y-6 text-left w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building className="w-6 h-6 text-indigo-600" /> Front Office & Reception
          </h1>
        </div>

        {activeTab === 'enquiries' && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsNewEnquiryOpen(true)}
          >
            + New Admission Enquiry
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold w-fit">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
            activeTab === 'search'
              ? 'bg-white text-indigo-700 font-bold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Student & Visitor Lookup</span>
        </button>

        <button
          onClick={() => setActiveTab('enquiries')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
            activeTab === 'enquiries'
              ? 'bg-white text-indigo-700 font-bold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Admission Enquiries ({enquiries.length})</span>
        </button>
      </div>

      {/* TAB 1: VISITOR / PARENT STUDENT LOOKUP */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Instant Search Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Type student name, registration number, roll number or parent phone..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Results List */}
          {isSearchLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
              <User className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">No students found matching &quot;{query}&quot;</p>
              <p className="text-xs">Check spelling or search by parent mobile number</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map(({ student, roomNumber, roomFloor, classTeacherName, classTeacherPhone }) => {
                const enrollment = student.current_enrollment;
                return (
                  <div
                    key={student.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-indigo-200 transition-all space-y-4 text-left"
                  >
                    {/* Header: Photo + Name + Reg No */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          {student.photo_url ? (
                            <img
                              src={student.photo_url}
                              alt={student.first_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-indigo-600 text-sm">
                              {student.first_name?.[0] || 'S'}
                              {student.last_name?.[0] || ''}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base leading-tight">
                            {student.first_name} {student.last_name}
                          </h3>
                          <span className="text-xs font-mono font-semibold text-indigo-600 block mt-0.5">
                            Reg: {student.registration_number}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {enrollment?.class_name || 'Enrolled'} {enrollment?.section_name ? `(${enrollment.section_name})` : ''}
                      </span>
                    </div>

                    {/* Room & Teacher Direction Card */}
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400 font-semibold block uppercase tracking-wider">
                          Current Room
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-bold text-slate-900">
                            Room {roomNumber || enrollment?.room_number || '204'}
                          </span>
                          {roomFloor && (
                            <span className="text-[10px] text-slate-500 font-medium">({roomFloor})</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 font-semibold block uppercase tracking-wider">
                          Class Teacher
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-bold text-slate-900 truncate">
                            {classTeacherName || enrollment?.class_teacher_name || 'Faculty Staff'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact & Transport Quick Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        {student.guardian?.primary_phone && (
                          <a
                            href={`tel:${student.guardian.primary_phone}`}
                            className="inline-flex items-center gap-1 text-slate-600 font-semibold hover:text-indigo-600 bg-slate-100 px-2.5 py-1 rounded-lg"
                          >
                            <Phone className="w-3 h-3 text-indigo-600" />
                            <span>Call Parent</span>
                          </a>
                        )}
                        {student.transport_assignment && (
                          <span className="inline-flex items-center gap-1 text-slate-600 text-[11px] bg-slate-100 px-2 py-1 rounded-lg">
                            <Bus className="w-3 h-3 text-amber-600" />
                            <span>{student.transport_assignment.vehicle_name}</span>
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/admin/students/${student.id}`}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        Full Profile <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADMISSION ENQUIRIES & LEADS */}
      {activeTab === 'enquiries' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search enquiry by student, parent, phone, class..."
                value={enquirySearch}
                onChange={(e) => setEnquirySearch(e.target.value)}
                className="w-full text-xs outline-none bg-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">Status:</span>
              <select
                value={enquiryStatusFilter}
                onChange={(e) => setEnquiryStatusFilter(e.target.value)}
                className="text-xs font-bold bg-white border border-slate-300 rounded-xl px-2.5 py-1.5"
              >
                <option value="all">All Enquiries</option>
                <option value="interested">Potential / Interested</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="follow_up">Follow Up</option>
                <option value="admitted">Admitted</option>
                <option value="closed">Closed / Not Interested</option>
              </select>
            </div>
          </div>

          {/* Enquiries Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Student & Parent</th>
                    <th className="py-3 px-4">Interested Class</th>
                    <th className="py-3 px-4">Phone / Contact</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Follow-Up Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {isEnquiriesLoading ? (
                    <tr>
                      <td colSpan={7} className="p-4">
                        <TableSkeleton rows={5} />
                      </td>
                    </tr>
                  ) : enquiries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No admission enquiry records found.
                      </td>
                    </tr>
                  ) : (
                    enquiries.map((enq) => (
                      <tr key={enq.id} className="hover:bg-slate-50/75 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 text-sm block">{enq.student_name}</span>
                          <span className="text-[11px] text-slate-500">Parent: {enq.parent_name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {enq.interested_class}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-900 font-semibold">{enq.primary_phone}</span>
                            <a
                              href={`tel:${enq.primary_phone}`}
                              className="p-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Call Phone"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          {enq.email && <span className="text-[10px] text-slate-400 block">{enq.email}</span>}
                        </td>
                        <td className="py-3 px-4 capitalize text-slate-600">{enq.source.replace('_', ' ')}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {enq.next_follow_up_at ? (
                            <span className="font-semibold">{formatDate(enq.next_follow_up_at)}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">{getStatusBadge(enq.status)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => {
                                setActiveEnquiryForFollowUp(enq);
                                setFollowUpStatus(enq.status);
                                setNextFollowUpDate(enq.next_follow_up_at || '');
                              }}
                            >
                              Follow-Up
                            </Button>

                            {enq.status !== 'admitted' && (
                              <Button
                                variant="primary"
                                size="xs"
                                onClick={() => openConvertModal(enq)}
                              >
                                Convert
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NEW ENQUIRY MODAL */}
      <Modal
        isOpen={isNewEnquiryOpen}
        onClose={() => setIsNewEnquiryOpen(false)}
        title="Record New Admission Enquiry"
        description="Add a prospective student lead from phone, walk-in or website"
      >
        <form onSubmit={handleCreateEnquiry} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Student Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Amit Sharma (letters only)"
                value={newEnquiryData.student_name}
                onChange={(e) => setNewEnquiryData((prev) => ({ ...prev, student_name: sanitizePersonName(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Parent / Guardian Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rajesh Sharma (letters only)"
                value={newEnquiryData.parent_name}
                onChange={(e) => setNewEnquiryData((prev) => ({ ...prev, parent_name: sanitizePersonName(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Phone Number *</label>
              <input
                type="tel"
                required
                inputMode="numeric"
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                placeholder="9876543210 (10 digits, starts 6-9)"
                value={newEnquiryData.primary_phone}
                onChange={(e) => setNewEnquiryData((prev) => ({ ...prev, primary_phone: sanitizeIndianMobile(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Secondary Phone (Optional)</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                placeholder="9876500000 (10 digits, starts 6-9)"
                value={newEnquiryData.secondary_phone}
                onChange={(e) => setNewEnquiryData((prev) => ({ ...prev, secondary_phone: sanitizeIndianMobile(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Interested Class *</label>
              <select
                value={newEnquiryData.interested_class}
                onChange={(e) => setNewEnquiryData((prev) => ({ ...prev, interested_class: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold text-indigo-700"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
                <option value="Nursery">Nursery</option>
                <option value="KG">Kindergarten</option>
                <option value="Class 1">Class 1</option>
                <option value="Class 6">Class 6</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 11">Class 11</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Enquiry Source *</label>
              <select
                value={newEnquiryData.source}
                onChange={(e) =>
                  setNewEnquiryData((prev) => ({
                    ...prev,
                    source: e.target.value as 'phone' | 'walk_in' | 'website' | 'referral' | 'other',
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="walk_in">Walk-in Campus Visitor</option>
                <option value="phone">Inbound Phone Call</option>
                <option value="website">Website Enquiry Form</option>
                <option value="referral">Parent / Staff Referral</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={newEnquiryData.status}
                onChange={(e) =>
                  setNewEnquiryData((prev) => ({ ...prev, status: e.target.value as EnquiryStatus }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-semibold"
              >
                <option value="interested">Potential / Interested</option>
                <option value="new">New Enquiry</option>
                <option value="contacted">Contacted</option>
                <option value="follow_up">Follow Up</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scheduled Next Follow-Up</label>
              <input
                type="date"
                value={newEnquiryData.next_follow_up_at}
                onChange={(e) => setNewEnquiryData((prev) => ({ ...prev, next_follow_up_at: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes & Questions</label>
            <textarea
              rows={3}
              placeholder="e.g. Inquired about school bus route, transport fee, and science curriculum..."
              value={newEnquiryData.notes}
              onChange={(e) => setNewEnquiryData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewEnquiryOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Admission Lead
            </Button>
          </div>
        </form>
      </Modal>

      {/* FOLLOW-UP OUTCOME MODAL */}
      {activeEnquiryForFollowUp && (
        <Modal
          isOpen={true}
          onClose={() => setActiveEnquiryForFollowUp(null)}
          title={`Follow-Up: ${activeEnquiryForFollowUp.student_name}`}
          description={`Parent: ${activeEnquiryForFollowUp.parent_name} • ${activeEnquiryForFollowUp.primary_phone}`}
        >
          <form onSubmit={handleSaveFollowUp} className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                <span>Class Interested:</span>
                <span className="text-indigo-700 font-bold">{activeEnquiryForFollowUp.interested_class}</span>
              </div>
              <div className="flex justify-between items-center text-xs mt-1 text-slate-500">
                <span>Phone:</span>
                <a href={`tel:${activeEnquiryForFollowUp.primary_phone}`} className="text-emerald-700 font-bold flex items-center gap-1">
                  <PhoneCall className="w-3 h-3" /> {activeEnquiryForFollowUp.primary_phone}
                </a>
              </div>
              {activeEnquiryForFollowUp.notes && (
                <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600 whitespace-pre-line">
                  {activeEnquiryForFollowUp.notes}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Updated Outcome / Status *</label>
                <select
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value as EnquiryStatus)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold text-indigo-700"
                >
                  <option value="interested">Interested / Potential</option>
                  <option value="contacted">Called / Contacted</option>
                  <option value="follow_up">Scheduled for Next Follow-Up</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Next Follow-Up Date</label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Call Note / Remarks</label>
              <textarea
                rows={3}
                placeholder="e.g. Spoke with father. Parent requested fee breakdown brochure sent via WhatsApp..."
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveEnquiryForFollowUp(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Follow-Up
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* CONVERT TO ADMISSION MODAL */}
      {activeEnquiryForConvert && (
        <Modal
          isOpen={true}
          onClose={() => setActiveEnquiryForConvert(null)}
          title="Convert Enquiry to Admitted Student"
          description={`Pre-populates student profile from enquiry lead ${activeEnquiryForConvert.student_name}`}
        >
          <form onSubmit={handleConvertStudent} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={convertData.first_name}
                  onChange={(e) => setConvertData((prev) => ({ ...prev, first_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={convertData.last_name}
                  onChange={(e) => setConvertData((prev) => ({ ...prev, last_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registration Number *</label>
                <input
                  type="text"
                  required
                  readOnly
                  value={convertData.registration_number}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Class *</label>
                <select
                  value={convertData.class_id}
                  onChange={(e) => setConvertData((prev) => ({ ...prev, class_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold text-indigo-700"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block">Guardian Info (Auto-Linked):</span>
              <div className="text-slate-600 text-xs">
                Parent: <strong>{activeEnquiryForConvert.parent_name}</strong> • Phone:{' '}
                <strong>{activeEnquiryForConvert.primary_phone}</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveEnquiryForConvert(null)}
                disabled={isConverting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isConverting}>
                Confirm Admission & Create Student
              </Button>
            </div>
          </form>
        </Modal>
      )}
      </div>
    </FeatureGuard>
  );
}
