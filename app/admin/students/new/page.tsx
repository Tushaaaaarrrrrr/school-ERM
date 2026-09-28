'use client';

// ============================================================================
// Create Student Registration Form
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { studentService, classService, schoolIdentifierService, transportService } from '@/lib/services/api';
import { SchoolClass, Section, TransportRoute } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { GoogleEmailInput } from '@/components/ui/google-email-input';
import { IdentityProofsInput, IdentityProof } from '@/components/ui/identity-proofs-input';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  User,
  GraduationCap,
  Users2,
  Lock,
  Sparkles,
  IndianRupee,
  Bus,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Search,
  Users,
  Link2,
  X,
} from 'lucide-react';

export default function CreateStudentPage() {
  const router = useRouter();
  const { currentSchool, currentYear } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isParentEmailValid, setIsParentEmailValid] = useState(true);
  const [isParentEmailAvailable, setIsParentEmailAvailable] = useState<boolean | null>(true);
  const [isParentEmailChecking, setIsParentEmailChecking] = useState(false);
  const [customJoiningCharges, setCustomJoiningCharges] = useState<{ definitionId: string; name: string; amount: number; selected: boolean }[]>([]);
  const [identityProofs, setIdentityProofs] = useState<IdentityProof[]>([]);

  // Sibling State
  const [hasSibling, setHasSibling] = useState(false);
  const [siblingSearchQuery, setSiblingSearchQuery] = useState('');
  const [selectedSibling, setSelectedSibling] = useState<any | null>(null);
  const [keepParentsSame, setKeepParentsSame] = useState(true);

  const nextRollNumber = async (classId: string) => {
    if (!classId) return '';
    const enrolled = await studentService.getStudents(schoolId, { classId });
    const activeStudentCount = enrolled.filter((student) => student.status === 'active').length;
    return String(activeStudentCount + 1);
  };

  const setFeeChoicesForClass = (schoolClass?: SchoolClass) => {
    setCustomJoiningCharges((schoolClass?.new_student_charges || []).filter((item) => item.status === 'active').map((item) => ({ definitionId: item.id, name: item.name, amount: item.amount, selected: false })));
  };

  // Form State
  const [formData, setFormData] = useState({
    // Basic
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    joiningDate: new Date().toISOString().split('T')[0],
    photoUrl: '',

    // Transport (Optional)
    needsTransport: false,
    transportRouteId: '',
    transportStopId: '',

    // Academic
    registrationNumber: '',
    academicYearId: currentYear?.id || 'ay-2026',
    classId: '',
    sectionId: '',
    rollNumber: '',

    // Previous school transfer
    isTransferredStudent: false,
    previousSchoolName: '',
    previousClass: '',
    previousMarksOrGrade: '',
    transferReason: '',

    // Fees
    useClassMonthlyFee: true,
    monthlyFeeOverride: '',
    applyNewStudentCharges: true,

    // Guardian
    fatherName: '',
    motherName: '',
    guardianName: '',
    primaryPhone: '',
    secondaryPhone: '',
    email: '',
    address: '',

    // Emergency / Medical
    bloodGroup: '',
    allergiesAlert: '',
    medicalConditionNote: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    doctorClinicContact: '',
    visibleToTeachers: true,
    visibleToTransport: false,

    // Account
    enableLogin: true,
    temporaryPassword: 'Student@123',
    confirmPassword: 'Student@123',
  });

  useEffect(() => {
    async function loadAcademicOptions() {
      try {
        const [clsList, secList, nextRegistrationNumber, routesList, stdList] = await Promise.all([
          classService.getClasses(schoolId),
          classService.getSections(schoolId),
          schoolIdentifierService.nextStudentNumber(schoolId, currentSchool?.code),
          transportService.getRoutes(schoolId).catch(() => []),
          studentService.getStudents(schoolId).catch(() => []),
        ]);
        setClasses(clsList);
        setSections(secList);
        setTransportRoutes(routesList);
        setAllStudents(stdList.filter((s) => s.status === 'active'));
        setFormData((prev) => ({ ...prev, registrationNumber: nextRegistrationNumber }));
        if (clsList.length > 0) {
          const initialClass = clsList[0];
          const rollNumber = await nextRollNumber(initialClass.id);
          setFeeChoicesForClass(initialClass);
          setFormData((prev) => ({
            ...prev,
            classId: initialClass.id,
            sectionId: secList.find((section) => section.class_id === initialClass.id)?.id || '',
            rollNumber,
            useClassMonthlyFee: Boolean(initialClass.common_monthly_fee),
            applyNewStudentCharges: Boolean(initialClass.new_student_charges?.some((item) => item.status === 'active')),
          }));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadAcademicOptions();
  }, [schoolId]);

  const handleToggleHasSibling = (has: boolean) => {
    setHasSibling(has);
    if (!has) {
      setSelectedSibling(null);
      setKeepParentsSame(true);
      setSiblingSearchQuery('');
    }
  };

  const handleSelectSibling = (sibling: any) => {
    setSelectedSibling(sibling);
    setSiblingSearchQuery('');
    setKeepParentsSame(true);

    if (sibling.guardian) {
      setFormData((prev) => ({
        ...prev,
        fatherName: sibling.guardian?.father_name || '',
        motherName: sibling.guardian?.mother_name || '',
        guardianName: sibling.guardian?.guardian_name || sibling.guardian?.father_name || '',
        primaryPhone: (sibling.guardian?.primary_phone || '').replace(/\D/g, '').slice(0, 15),
        secondaryPhone: (sibling.guardian?.secondary_phone || '').replace(/\D/g, '').slice(0, 15),
        email: sibling.guardian?.email || '',
        address: sibling.guardian?.address || '',
        emergencyContactName: prev.emergencyContactName || sibling.emergency_info?.emergency_contact_name || sibling.guardian?.father_name || sibling.guardian?.guardian_name || '',
        emergencyContactRelationship: prev.emergencyContactRelationship || sibling.emergency_info?.emergency_contact_relationship || 'Parent',
        emergencyContactPhone: prev.emergencyContactPhone || (sibling.emergency_info?.emergency_contact_phone || sibling.guardian?.primary_phone || '').replace(/\D/g, '').slice(0, 15),
      }));
    }
  };

  const handleKeepParentsSameChange = (keepSame: boolean) => {
    setKeepParentsSame(keepSame);
    if (!keepSame) {
      setFormData((prev) => ({
        ...prev,
        fatherName: '',
        motherName: '',
        guardianName: '',
        primaryPhone: '',
        secondaryPhone: '',
        email: '',
        address: '',
      }));
    } else if (selectedSibling?.guardian) {
      setFormData((prev) => ({
        ...prev,
        fatherName: selectedSibling.guardian?.father_name || '',
        motherName: selectedSibling.guardian?.mother_name || '',
        guardianName: selectedSibling.guardian?.guardian_name || selectedSibling.guardian?.father_name || '',
        primaryPhone: (selectedSibling.guardian?.primary_phone || '').replace(/\D/g, '').slice(0, 15),
        secondaryPhone: (selectedSibling.guardian?.secondary_phone || '').replace(/\D/g, '').slice(0, 15),
        email: selectedSibling.guardian?.email || '',
        address: selectedSibling.guardian?.address || '',
      }));
    }
  };

  const handleRemoveSibling = () => {
    setSelectedSibling(null);
    setKeepParentsSame(true);
    setSiblingSearchQuery('');
  };

  const filteredSiblingCandidates = siblingSearchQuery.trim()
    ? allStudents.filter((s) => {
        const q = siblingSearchQuery.toLowerCase();
        const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
        const reg = (s.registration_number || '').toLowerCase();
        const roll = (s.current_enrollment?.roll_number || '').toLowerCase();
        const phone = (s.guardian?.primary_phone || '').toLowerCase();
        return fullName.includes(q) || reg.includes(q) || roll.includes(q) || phone.includes(q);
      })
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.firstName.trim() ||
      !formData.dateOfBirth ||
      !formData.gender ||
      !formData.joiningDate ||
      !formData.registrationNumber.trim() ||
      !formData.classId
    ) {
      toastError('Please fill all required personal and academic fields (First Name, Date of Birth, Gender, Joining Date, Registration Number, Class).');
      return;
    }

    if (![formData.fatherName, formData.motherName, formData.guardianName].some((name) => name.trim())) {
      toastError('Please enter at least one guardian name.');
      return;
    }

    if (!/^\d{10,15}$/.test(formData.primaryPhone)) {
      toastError('Primary phone must contain 10 to 15 digits only.');
      return;
    }

    if (formData.secondaryPhone && !/^\d{10,15}$/.test(formData.secondaryPhone)) {
      toastError('Secondary phone must contain 10 to 15 digits only.');
      return;
    }

    if (!formData.address.trim()) {
      toastError('Residential address is required.');
      return;
    }

    if (formData.isTransferredStudent && ![
      formData.previousSchoolName,
      formData.previousClass,
      formData.previousMarksOrGrade,
      formData.transferReason,
    ].every((value) => value.trim())) {
      toastError('Please complete all previous-school transfer details.');
      return;
    }

    if (formData.emergencyContactPhone && !/^\d{10,15}$/.test(formData.emergencyContactPhone)) {
      toastError('Emergency contact phone must contain 10 to 15 digits only.');
      return;
    }

    if (formData.needsTransport && (!formData.transportRouteId || !formData.transportStopId)) {
      toastError('Please select both a transport route and a pickup/drop stop, or uncheck school transport.');
      return;
    }

    if (formData.enableLogin) {
      if (!formData.temporaryPassword || formData.temporaryPassword.length < 6) {
        toastError('Temporary password must be at least 6 characters long.');
        return;
      }
      if (formData.temporaryPassword !== formData.confirmPassword) {
        toastError('Passwords do not match. Please verify that both password fields match.');
        return;
      }
    }

    if (formData.email.trim()) {
      if (!formData.email.trim().toLowerCase().endsWith('@gmail.com')) {
        toastError('Parent email must be an official @gmail.com account for parent portal login.');
        return;
      }
      if (isParentEmailAvailable === false) {
        toastError('Parent Google email is not available or registered to a conflicting account.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const automaticRollNumber = await nextRollNumber(formData.classId);
      const newStudent = await studentService.createStudent({
        school_id: schoolId,
        school_code: currentSchool?.code,
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        registration_number: formData.registrationNumber,
        academic_year_id: formData.academicYearId,
        academic_year_name: currentYear?.name,
        class_id: formData.classId,
        section_id: formData.sectionId,
        roll_number: automaticRollNumber,
        joining_date: formData.joiningDate,
        photo_url: formData.photoUrl || undefined,
        use_class_monthly_fee: formData.useClassMonthlyFee,
        monthly_fee_override: formData.useClassMonthlyFee ? undefined : Number(formData.monthlyFeeOverride) || undefined,
        apply_new_student_charges: formData.applyNewStudentCharges,
        selected_new_student_charges: formData.applyNewStudentCharges ? undefined : customJoiningCharges.filter((item) => item.selected).map((item) => ({ definition_id: item.definitionId, name: item.name, amount: item.amount })),
        guardian: {
          father_name: formData.fatherName,
          mother_name: formData.motherName,
          guardian_name: formData.guardianName || formData.fatherName,
          primary_phone: formData.primaryPhone,
          secondary_phone: formData.secondaryPhone,
          email: formData.email,
          address: formData.address,
        },
        emergency_info: {
          blood_group: formData.bloodGroup || undefined,
          allergies_alert: formData.allergiesAlert.trim() || undefined,
          medical_condition_note: formData.medicalConditionNote.trim() || undefined,
          emergency_contact_name: formData.emergencyContactName.trim(),
          emergency_contact_relationship: formData.emergencyContactRelationship.trim(),
          emergency_contact_phone: formData.emergencyContactPhone,
          doctor_clinic_contact: formData.doctorClinicContact.trim() || undefined,
          visible_to_teachers: formData.visibleToTeachers,
          visible_to_transport: formData.visibleToTransport || formData.needsTransport,
          updated_at: new Date().toISOString(),
          updated_by_name: 'School Administrator',
        },
        is_transferred_student: formData.isTransferredStudent,
        transfer_info: formData.isTransferredStudent ? {
          previous_school_name: formData.previousSchoolName.trim(),
          previous_class: formData.previousClass.trim(),
          previous_marks_or_grade: formData.previousMarksOrGrade.trim(),
          transfer_reason: formData.transferReason.trim(),
        } : undefined,
        selected_sibling_id: (hasSibling && selectedSibling) ? selectedSibling.id : undefined,
        keep_parents_same: (hasSibling && selectedSibling) ? keepParentsSame : undefined,
        enable_login: formData.enableLogin,
        temporary_password: formData.temporaryPassword,
        identity_proofs: identityProofs.length > 0 ? identityProofs : undefined,
      } as any);

      // If school transport requested, assign route and stop
      if (formData.needsTransport && formData.transportRouteId && formData.transportStopId) {
        try {
          const selectedRoute = transportRoutes.find((r) => r.id === formData.transportRouteId);
          const selectedStop = selectedRoute?.stops?.find((s) => s.id === formData.transportStopId);
          await transportService.assignStudentTransport({
            school_id: schoolId,
            student_id: newStudent.id,
            route_id: formData.transportRouteId,
            stop_id: formData.transportStopId,
            vehicle_id: selectedRoute?.assigned_vehicle_id || 'veh-default',
            pickup_enabled: true,
            drop_enabled: true,
            academic_year_id: formData.academicYearId,
            status: 'active',
            route_name: selectedRoute?.route_name,
            stop_name: selectedStop?.stop_name,
            vehicle_name: selectedRoute?.assigned_vehicle_name,
            estimated_pickup_time: selectedStop?.estimated_pickup_time,
          });
        } catch (tErr) {
          console.error('Transport assignment note:', tErr);
        }
      }

      success(`Student ${formData.firstName} ${formData.lastName || ''} registered successfully!`);
      router.push('/admin/students');
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to register student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentClassSections = sections.filter((s) => s.class_id === formData.classId);

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/students"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Register New Student</h1>
        </div>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Personal Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">1. Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="e.g. Rahul"
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="e.g. Kumar (optional)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              required
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
            <Select
              label="Gender"
              required
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
            <Input
              label="Joining Date"
              type="date"
              required
              value={formData.joiningDate}
              onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
            />
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-xs font-semibold text-slate-700">Is this student transferred from another school?</p>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <input type="radio" name="isTransferredStudent" checked={!formData.isTransferredStudent} onChange={() => setFormData({ ...formData, isTransferredStudent: false, previousSchoolName: '', previousClass: '', previousMarksOrGrade: '', transferReason: '' })} />
                  No
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <input type="radio" name="isTransferredStudent" checked={formData.isTransferredStudent} onChange={() => setFormData({ ...formData, isTransferredStudent: true })} />
                  Yes
                </label>
              </div>
            </div>

            {formData.isTransferredStudent && (
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Previous School Name" required value={formData.previousSchoolName} onChange={(e) => setFormData({ ...formData, previousSchoolName: e.target.value })} />
                  <Input label="Previous Class" required value={formData.previousClass} onChange={(e) => setFormData({ ...formData, previousClass: e.target.value })} placeholder="e.g. Class 5" />
                  <Input label="Previous Marks / Grade" required value={formData.previousMarksOrGrade} onChange={(e) => setFormData({ ...formData, previousMarksOrGrade: e.target.value })} placeholder="e.g. 78% or Grade B" />
                  <Input label="Reason for Transfer" required value={formData.transferReason} onChange={(e) => setFormData({ ...formData, transferReason: e.target.value })} placeholder="e.g. Family relocation" />
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <PhotoUpload
              label="Student Photo (Optional)"
              currentPhotoUrl={formData.photoUrl}
              onPhotoChange={(url) => setFormData((prev) => ({ ...prev, photoUrl: url || '' }))}
            />
          </div>
        </div>

        {/* Section: Government Identity Proofs */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <IdentityProofsInput
            proofs={identityProofs}
            onChange={setIdentityProofs}
            title="Student Identity Proofs (Optional)"
          />
        </div>

        {/* Section 2: Academic Enrollment */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">2. Academic Enrollment</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Registration Number (Permanent)"
              required
              readOnly
              value={formData.registrationNumber}
              helperText="Automatically assigned from the school code and next student sequence"
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Academic Year
              </label>
              <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold">
                {currentYear?.name || '2026-27'} (Current Session)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Class"
              required
              value={formData.classId}
              onChange={async (e) => { const nextClassId = e.target.value; const nextClass = classes.find((item) => item.id === nextClassId); const rollNumber = await nextRollNumber(nextClassId); setFeeChoicesForClass(nextClass); setFormData({ ...formData, classId: nextClassId, sectionId: sections.find((section) => section.class_id === nextClassId)?.id || '', rollNumber, useClassMonthlyFee: Boolean(nextClass?.common_monthly_fee), monthlyFeeOverride: '', applyNewStudentCharges: Boolean(nextClass?.new_student_charges?.some((item) => item.status === 'active')) }); }}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              label="Section (Optional)"
              value={formData.sectionId}
              onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
            >
              {currentClassSections.length > 0 ? (
                currentClassSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    Section {s.name}
                  </option>
                ))
              ) : <option value="">Whole class / No section</option>}
            </Select>

            <Input
              label="Roll Number"
              readOnly
              value={formData.rollNumber}
              helperText="Automatically assigned from the next available class roll number"
            />
          </div>
        </div>

        {/* Section 3: Fee Setup */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100"><IndianRupee className="w-5 h-5 text-indigo-600"/><h3 className="text-sm font-bold text-slate-900">3. Student Fee Setup</h3></div>
          {(() => { const selectedClass = classes.find((item) => item.id === formData.classId); const commonFee = selectedClass?.common_monthly_fee; const joiningCharges = selectedClass?.new_student_charges?.filter((item) => item.status === 'active') || []; return <div className="space-y-4">
            <label className="flex items-start gap-3 rounded-xl border p-4"><input type="checkbox" className="mt-0.5" checked={formData.useClassMonthlyFee} disabled={!commonFee} onChange={(e) => setFormData({ ...formData, useClassMonthlyFee: e.target.checked })}/><span><strong className="block">Use common class monthly fee</strong><span className="text-xs text-slate-500">{commonFee ? `Charge ₹${commonFee.toLocaleString('en-IN')} per month` : 'No common monthly fee configured for this class.'}</span></span></label>
            {!formData.useClassMonthlyFee && <Input label="Custom Monthly Fee (₹)" type="number" min="0" required value={formData.monthlyFeeOverride} onChange={(e) => setFormData({ ...formData, monthlyFeeOverride: e.target.value })} helperText="This amount applies only to this student."/>}
            <label className="flex items-start gap-3 rounded-xl border p-4"><input type="checkbox" className="mt-0.5" checked={formData.applyNewStudentCharges} disabled={joiningCharges.length === 0} onChange={(e) => setFormData({ ...formData, applyNewStudentCharges: e.target.checked })}/><span><strong className="block">Apply all new-student charges</strong><span className="text-xs text-slate-500">{joiningCharges.length ? joiningCharges.map((item) => `${item.name}: ₹${item.amount.toLocaleString('en-IN')}`).join(' · ') : 'No joining charges configured for this class.'}</span></span></label>
            {!formData.applyNewStudentCharges && joiningCharges.length > 0 && <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4"><strong className="block">Choose charges for this student (optional)</strong>{customJoiningCharges.map((charge, index) => <div key={charge.definitionId} className="grid grid-cols-[auto_1fr_150px] items-center gap-3 rounded-lg bg-white p-3"><input type="checkbox" checked={charge.selected} onChange={(e) => setCustomJoiningCharges(customJoiningCharges.map((item, i) => i === index ? { ...item, selected: e.target.checked } : item))}/><span className="font-semibold">{charge.name}</span><Input aria-label={`${charge.name} amount`} type="number" min="0" disabled={!charge.selected} value={String(charge.amount)} onChange={(e) => setCustomJoiningCharges(customJoiningCharges.map((item, i) => i === index ? { ...item, amount: Number(e.target.value) || 0 } : item))}/></div>)}<p className="text-[11px] text-slate-500">Changes apply only to this student and do not modify the class defaults.</p></div>}
          </div>; })()}
        </div>

        {/* Section 4: Parent / Guardian & Sibling Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Users2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">4. Parent / Guardian & Sibling Details</h3>
          </div>

          {/* Sibling Link Question */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/75 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-indigo-600" />
                  Does this student have a sibling already studying in this school?
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Linking siblings associates their profiles bidirectionally and allows sharing parent contacts and portal login.
                </p>
              </div>
              <div className="flex gap-4 shrink-0">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="hasSiblingRadio"
                    checked={!hasSibling}
                    onChange={() => handleToggleHasSibling(false)}
                  />
                  No
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="hasSiblingRadio"
                    checked={hasSibling}
                    onChange={() => handleToggleHasSibling(true)}
                  />
                  Yes
                </label>
              </div>
            </div>

            {hasSibling && (
              <div className="space-y-4 border-t border-slate-200 pt-4">
                {!selectedSibling ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Search Sibling Student
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by student name or registration number (e.g. 'Rahul' or '2026-00101')..."
                        value={siblingSearchQuery}
                        onChange={(e) => setSiblingSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>

                    {siblingSearchQuery.trim() && (
                      <div className="bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto divide-y divide-slate-100 mt-2 z-10">
                        {filteredSiblingCandidates.length > 0 ? (
                          filteredSiblingCandidates.map((cand) => (
                            <div
                              key={cand.id}
                              onClick={() => handleSelectSibling(cand)}
                              className="p-3 hover:bg-indigo-50/60 cursor-pointer transition-colors flex items-center justify-between gap-3 text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                  {cand.photo_url ? (
                                    <img src={cand.photo_url} alt={cand.first_name} className="w-full h-full object-cover" />
                                  ) : (
                                    cand.first_name?.[0] || 'S'
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-slate-900">
                                      {cand.first_name} {cand.last_name}
                                    </span>
                                    <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                      {cand.registration_number}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {cand.current_enrollment?.class_name || 'Class'} {cand.current_enrollment?.section_name ? `(${cand.current_enrollment.section_name})` : ''} • Roll: {cand.current_enrollment?.roll_number || '—'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right text-xs shrink-0 hidden sm:block">
                                <span className="text-slate-600 block font-medium">
                                  {cand.guardian?.father_name || cand.guardian?.guardian_name || 'Parent / Guardian'}
                                </span>
                                <span className="text-slate-400 font-mono text-[11px]">
                                  {cand.guardian?.primary_phone || ''}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-500">
                            No enrolled active students found matching "{siblingSearchQuery}".
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Selected Sibling Card */}
                    <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-xs">
                          {selectedSibling.photo_url ? (
                            <img src={selectedSibling.photo_url} alt={selectedSibling.first_name} className="w-full h-full object-cover" />
                          ) : (
                            selectedSibling.first_name?.[0] || 'S'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {selectedSibling.first_name} {selectedSibling.last_name}
                            </span>
                            <span className="font-mono text-xs bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded border border-indigo-200">
                              Reg: {selectedSibling.registration_number}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {selectedSibling.current_enrollment?.class_name} {selectedSibling.current_enrollment?.section_name ? `(${selectedSibling.current_enrollment.section_name})` : ''} • Roll: {selectedSibling.current_enrollment?.roll_number} • Guardian: {selectedSibling.guardian?.father_name || selectedSibling.guardian?.guardian_name || '—'} ({selectedSibling.guardian?.primary_phone || '—'})
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveSibling}
                        className="text-xs shrink-0 text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Change Sibling
                      </Button>
                    </div>

                    {/* Keep Parents Same Question */}
                    <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-2xs space-y-2.5">
                      <p className="text-xs font-bold text-slate-900">
                        Keep parent / guardian details same as {selectedSibling.first_name}?
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                          <input
                            type="radio"
                            name="keepParentsSameRadio"
                            checked={keepParentsSame === true}
                            onChange={() => handleKeepParentsSameChange(true)}
                          />
                          Yes, auto-fill and keep {selectedSibling.first_name}'s parent details
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                          <input
                            type="radio"
                            name="keepParentsSameRadio"
                            checked={keepParentsSame === false}
                            onChange={() => handleKeepParentsSameChange(false)}
                          />
                          No, enter separate parent details
                        </label>
                      </div>

                      {keepParentsSame ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 font-medium">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>
                            Parent details auto-filled from <strong>{selectedSibling.first_name} {selectedSibling.last_name}</strong>. Both students will be linked as siblings and share the parent account.
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>
                            Sibling connection will be preserved, but separate parent/guardian details can be entered below.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Father's Name"
              value={formData.fatherName}
              onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
              placeholder="e.g. Manoj Kumar"
            />
            <Input
              label="Mother's Name"
              value={formData.motherName}
              onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
              placeholder="e.g. Sunita Devi"
            />
            <Input
              label="Guardian Name (if different)"
              value={formData.guardianName}
              onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Primary Phone"
              required
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10,15}"
              maxLength={15}
              value={formData.primaryPhone}
              onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value.replace(/\D/g, '').slice(0, 15) })}
              placeholder="9876543210"
            />
            <Input
              label="Secondary Phone"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10,15}"
              maxLength={15}
              value={formData.secondaryPhone}
              onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value.replace(/\D/g, '').slice(0, 15) })}
              placeholder="9876500000"
            />
            <GoogleEmailInput
              label="Parent Email (Parent Portal Login)"
              value={formData.email}
              onChange={(val) => setFormData({ ...formData, email: val })}
              targetSchoolId={schoolId}
              targetRole="parent"
              onValidationChange={(valid, available, checking) => {
                setIsParentEmailValid(valid);
                setIsParentEmailAvailable(available);
                setIsParentEmailChecking(checking);
              }}
              placeholder="parent.name@gmail.com"
              id="parent-google-email-input"
            />
          </div>

          <Input
            label="Residential Address"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="House number, Street, Sector / Area, City, PIN"
          />
        </div>

        {/* Section 5: Emergency / Medical */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Users2 className="w-5 h-5 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">5. Emergency / Medical Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Blood Group" value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}>
              <option value="">Not specified</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => <option key={group} value={group}>{group}</option>)}
            </Select>
            <Input label="Doctor / Clinic Contact" value={formData.doctorClinicContact} onChange={(e) => setFormData({ ...formData, doctorClinicContact: e.target.value })} placeholder="Doctor, clinic and contact number" />
          </div>

          <Input label="Critical Allergies / Safety Alerts" value={formData.allergiesAlert} onChange={(e) => setFormData({ ...formData, allergiesAlert: e.target.value })} placeholder="Leave blank if none or unknown" />
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Medical Condition / Medication Notes</label>
            <textarea rows={3} value={formData.medicalConditionNote} onChange={(e) => setFormData({ ...formData, medicalConditionNote: e.target.value })} placeholder="Leave blank if none or unknown" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Emergency Contact Name" value={formData.emergencyContactName} onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })} />
            <Input label="Relationship" value={formData.emergencyContactRelationship} onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })} placeholder="Mother, father, uncle…" />
            <Input label="Emergency Contact Phone" type="tel" inputMode="numeric" pattern="[0-9]{10,15}" maxLength={15} value={formData.emergencyContactPhone} onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value.replace(/\D/g, '').slice(0, 15) })} placeholder="9876543210" />
          </div>

          <div className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <p className="text-xs font-bold text-indigo-900">Visibility permissions</p>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800"><input type="checkbox" checked={formData.visibleToTeachers} onChange={(e) => setFormData({ ...formData, visibleToTeachers: e.target.checked })} /> Visible to assigned teachers</label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800"><input type="checkbox" checked={formData.visibleToTransport} onChange={(e) => setFormData({ ...formData, visibleToTransport: e.target.checked })} /> Visible to transport staff</label>
          </div>
        </div>

        {/* Section 6: School Transport Service (Optional) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bus className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">6. School Transport Service (Optional)</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Daily Bus / Van Pickup</span>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-700">Does this student require daily school transport?</p>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="needsTransport"
                  checked={!formData.needsTransport}
                  onChange={() =>
                    setFormData((prev) => ({
                      ...prev,
                      needsTransport: false,
                      transportRouteId: '',
                      transportStopId: '',
                    }))
                  }
                />
                No Transport Needed
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="needsTransport"
                  checked={formData.needsTransport}
                  onChange={() => {
                    const firstRoute = transportRoutes[0];
                    const firstStop = firstRoute?.stops?.[0];
                    setFormData((prev) => ({
                      ...prev,
                      needsTransport: true,
                      transportRouteId: firstRoute?.id || '',
                      transportStopId: firstStop?.id || '',
                    }));
                  }}
                />
                Yes, Assign School Transport
              </label>
            </div>
          </div>

          {formData.needsTransport && (
            <div className="space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              {transportRoutes.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No transport routes configured yet for this school. You can manage transport routes in the Transport menu.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Transport Route"
                    required={formData.needsTransport}
                    value={formData.transportRouteId}
                    onChange={(e) => {
                      const routeId = e.target.value;
                      const route = transportRoutes.find((r) => r.id === routeId);
                      setFormData((prev) => ({
                        ...prev,
                        transportRouteId: routeId,
                        transportStopId: route?.stops?.[0]?.id || '',
                      }));
                    }}
                  >
                    <option value="">Select Route</option>
                    {transportRoutes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.route_name} ({r.route_code || 'Route'})
                      </option>
                    ))}
                  </Select>

                  <Select
                    label="Pickup / Drop Stop"
                    required={formData.needsTransport}
                    value={formData.transportStopId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, transportStopId: e.target.value }))}
                  >
                    <option value="">Select Stop</option>
                    {transportRoutes
                      .find((r) => r.id === formData.transportRouteId)
                      ?.stops?.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.stop_name} {s.estimated_pickup_time ? `(${s.estimated_pickup_time})` : ''}
                        </option>
                      ))}
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 7: Account & Login Access */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">7. Student Portal Login Account</h3>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-indigo-600">
              <input
                type="checkbox"
                checked={formData.enableLogin}
                onChange={(e) => setFormData({ ...formData, enableLogin: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span>Enable Student Login</span>
            </label>
          </div>

          {formData.enableLogin ? (
            <div className="space-y-4 pt-1">
              <p className="text-xs text-slate-500">
                Student will be able to log in using School Code (<strong>{currentSchool?.code || 'JDPS0123Q'}</strong>) +
                Registration Number (<strong>{formData.registrationNumber}</strong>).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Temporary Password"
                  type={showPassword ? 'text' : 'password'}
                  required={formData.enableLogin}
                  value={formData.temporaryPassword}
                  onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                  placeholder="Enter initial password"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg focus:outline-none transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  helperText="At least 6 characters (Student can change upon login)"
                />

                <div>
                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required={formData.enableLogin}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter password to confirm"
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg focus:outline-none transition-colors"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  {formData.confirmPassword && (
                    <div className="mt-1.5 text-xs flex items-center gap-1.5">
                      {formData.temporaryPassword === formData.confirmPassword ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                        </span>
                      ) : (
                        <span className="text-rose-600 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Student will exist only as an ERP administrative record without portal login access.
            </p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/students">
            <Button type="button" variant="outline" size="md">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            disabled={isSubmitting || isParentEmailChecking || (Boolean(formData.email.trim()) && isParentEmailAvailable === false)}
          >
            Register Student{formData.useClassMonthlyFee || formData.applyNewStudentCharges || Number(formData.monthlyFeeOverride) > 0 ? ' & Apply Fees' : ''}
          </Button>
        </div>
      </form>
    </div>
  );
}
