'use client';

// ============================================================================
// Comprehensive Faculty / Teacher Registration Page
// Full-page form with Identity Proofs, Academic Profile, and Google Auth
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { teacherService, subjectService, schoolIdentifierService } from '@/lib/services/api';
import { Subject } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { GoogleEmailInput } from '@/components/ui/google-email-input';
import { IdentityProofsInput, IdentityProof } from '@/components/ui/identity-proofs-input';
import { useToast } from '@/components/ui/toast';
import { sanitizePersonName, isValidPersonName, sanitizeIndianMobile, isValidIndianMobile } from '@/lib/utils/formatters';
import { generateSecurePin } from '@/lib/utils/security';
import {
  ArrowLeft,
  User,
  GraduationCap,
  Briefcase,
  Phone,
  ShieldCheck,
  Lock,
  IndianRupee,
  Calendar,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export default function RegisterTeacherPage() {
  const router = useRouter();
  const { currentSchool, currentUser } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState<boolean | null>(null);
  const [isEmailChecking, setIsEmailChecking] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Personal
    firstName: '',
    lastName: '',
    gender: 'female' as 'male' | 'female' | 'other',
    dateOfBirth: '',
    joiningDate: new Date().toISOString().split('T')[0],
    bloodGroup: '',
    maritalStatus: '',
    photoUrl: '',

    // Contact & Emergency
    phone: '',
    alternatePhone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',

    // Professional / Academic
    employeeNumber: '',
    department: '',
    primarySubject: '',
    secondarySubjects: '',
    qualification: '',
    experienceYears: '',
    previousSchool: '',
    monthlySalary: '30000',

    // Account & Credentials
    email: '',
    securityPin: '',
  });

  const [identityProofs, setIdentityProofs] = useState<IdentityProof[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [subList, nextEmpNo] = await Promise.all([
          subjectService.getSubjects(schoolId),
          schoolIdentifierService.nextTeacherNumber(schoolId, currentSchool?.code),
        ]);
        setSubjects(subList);
        setFormData((prev) => ({
          ...prev,
          employeeNumber: nextEmpNo,
          primarySubject: subList[0]?.name || '',
        }));
      } catch {
        toastError('Failed to initialize teacher form sequence');
      }
    };
    loadInitialData();
  }, [schoolId, currentSchool]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.employeeNumber || !formData.email.trim() || !formData.phone.trim()) {
      toastError('Please fill all required fields: First Name, Employee ID, Phone, and Google Email.');
      return;
    }

    if (!isValidPersonName(formData.firstName)) {
      toastError('First Name must contain letters only (no numbers or symbols).');
      return;
    }

    if (formData.lastName && !isValidPersonName(formData.lastName)) {
      toastError('Last Name must contain letters only (no numbers or symbols).');
      return;
    }

    if (!isValidIndianMobile(formData.phone)) {
      toastError('Primary phone must be a 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (formData.alternatePhone && !isValidIndianMobile(formData.alternatePhone)) {
      toastError('Alternate contact phone must be a 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (formData.emergencyContactName && !isValidPersonName(formData.emergencyContactName)) {
      toastError('Emergency contact person must contain letters only (no numbers or symbols).');
      return;
    }

    if (formData.emergencyContactPhone && !isValidIndianMobile(formData.emergencyContactPhone)) {
      toastError('Emergency contact phone must be a 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (!formData.email.trim().toLowerCase().endsWith('@gmail.com')) {
      toastError('Teacher email must be an official @gmail.com account for Google sign-in.');
      return;
    }

    if (isEmailAvailable === false) {
      toastError('This Google email is not available or registered to a conflicting account.');
      return;
    }

    setIsSubmitting(true);

    try {
      const subjectArray = [
        formData.primarySubject,
        ...formData.secondarySubjects.split(',').map((s) => s.trim()).filter(Boolean),
      ].filter(Boolean);

      await teacherService.createTeacher(
        schoolId,
        {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          employee_number: formData.employeeNumber.trim().toUpperCase(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          photo_url: formData.photoUrl || undefined,
          joining_date: formData.joiningDate,
          designation: formData.qualification ? `Teacher (${formData.qualification})` : 'Teacher',
          subjects: subjectArray,
          monthly_salary: parseInt(formData.monthlySalary, 10) || 30000,
          salary: parseInt(formData.monthlySalary, 10) || 30000,
          security_pin: formData.securityPin || generateSecurePin(),
          status: 'active',
          identity_proofs: identityProofs.length > 0 ? identityProofs : undefined,
          extra_details: {
            gender: formData.gender,
            date_of_birth: formData.dateOfBirth,
            blood_group: formData.bloodGroup,
            marital_status: formData.maritalStatus,
            alternate_phone: formData.alternatePhone,
            address: formData.address,
            emergency_contact_name: formData.emergencyContactName,
            emergency_contact_phone: formData.emergencyContactPhone,
            department: formData.department,
            qualification: formData.qualification,
            experience_years: formData.experienceYears,
            previous_school: formData.previousSchool,
          },
        } as any,
        currentSchool?.code
      );

      success(`Faculty member ${formData.firstName} ${formData.lastName} registered successfully!`);
      router.push('/admin/teachers');
    } catch {
      toastError('Failed to register faculty member. Please verify all fields and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/teachers"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Register Faculty Member</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/teachers">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            form="create-teacher-form"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={isEmailChecking || isEmailAvailable === false}
          >
            Create Faculty Record
          </Button>
        </div>
      </div>

      <form id="create-teacher-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">1. Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name *"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: sanitizePersonName(e.target.value) })}
              placeholder="e.g. Rajesh"
              helperText="Letters only"
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: sanitizePersonName(e.target.value) })}
              placeholder="e.g. Sharma (optional)"
              helperText="Letters only"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Select
              label="Gender *"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </Select>

            <Input
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />

            <Input
              label="Joining Date *"
              type="date"
              required
              value={formData.joiningDate}
              onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
            />

            <Select
              label="Blood Group"
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
            >
              <option value="">Not Specified</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </Select>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <PhotoUpload
              label="Faculty Photo (Optional)"
              currentPhotoUrl={formData.photoUrl}
              onPhotoChange={(url) => setFormData((prev) => ({ ...prev, photoUrl: url || '' }))}
            />
          </div>
        </div>

        {/* Section 2: Identity Proofs */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <IdentityProofsInput
            proofs={identityProofs}
            onChange={setIdentityProofs}
            title="Faculty Identity Proofs (Aadhaar, PAN, Passport, etc.)"
          />
        </div>

        {/* Section 3: Professional & Academic Qualifications */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">3. Academic & Professional Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Employee ID (Permanent) *"
              required
              readOnly
              value={formData.employeeNumber}
              className="bg-slate-50 font-mono"
            />

            <Input
              label="Department / Faculty Division"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g. Science, Mathematics, Humanities"
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Primary Subject Specialization
              </label>
              <select
                value={formData.primarySubject}
                onChange={(e) => setFormData({ ...formData, primarySubject: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select subject</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.name}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Highest Qualification / Degree"
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              placeholder="e.g. M.Sc, B.Ed, Ph.D"
            />

            <Input
              label="Teaching Experience (Years)"
              type="number"
              min="0"
              max="50"
              value={formData.experienceYears}
              onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
              placeholder="e.g. 5"
            />

            <Input
              label="Previous School / Institute"
              value={formData.previousSchool}
              onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
              placeholder="Previous organization"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Secondary Subjects / Skills (Comma-separated)"
              value={formData.secondarySubjects}
              onChange={(e) => setFormData({ ...formData, secondarySubjects: e.target.value })}
              placeholder="e.g. Physics, Chemistry, Robotics"
            />

            <Input
              label="Monthly Salary (₹) *"
              required
              type="number"
              min="0"
              value={formData.monthlySalary}
              onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
              placeholder="30000"
            />
          </div>
        </div>

        {/* Section 4: Contact & Emergency Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Phone className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">4. Contact & Emergency Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Primary Phone Number *"
              required
              type="tel"
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: sanitizeIndianMobile(e.target.value) })}
              placeholder="9876543210"
              helperText="10 digits only, starts with 6-9"
            />

            <Input
              label="Alternate Contact Phone"
              type="tel"
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              value={formData.alternatePhone}
              onChange={(e) => setFormData({ ...formData, alternatePhone: sanitizeIndianMobile(e.target.value) })}
              placeholder="9876500000 (optional)"
              helperText="10 digits only, starts with 6-9"
            />
          </div>

          <Input
            label="Residential Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="House number, Street, City, State, PIN"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <Input
              label="Emergency Contact Person"
              value={formData.emergencyContactName}
              onChange={(e) => setFormData({ ...formData, emergencyContactName: sanitizePersonName(e.target.value) })}
              placeholder="Spouse / Parent / Relative name"
              helperText="Letters only"
            />

            <Input
              label="Emergency Contact Phone"
              type="tel"
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              value={formData.emergencyContactPhone}
              onChange={(e) => setFormData({ ...formData, emergencyContactPhone: sanitizeIndianMobile(e.target.value) })}
              placeholder="9876543210"
              helperText="10 digits only, starts with 6-9"
            />
          </div>
        </div>

        {/* Section 5: Platform & Sign-In Account */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">5. Platform Access & Credentials</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GoogleEmailInput
              label="Teacher Google Email (For Sign-In) *"
              required
              value={formData.email}
              onChange={(val) => setFormData({ ...formData, email: val })}
              targetSchoolId={schoolId}
              targetRole="teacher"
              onValidationChange={(valid, available, checking) => {
                setIsEmailValid(valid);
                setIsEmailAvailable(available);
                setIsEmailChecking(checking);
              }}
              placeholder="teacher.name@gmail.com"
              id="teacher-register-email"
            />

            <Input
              label="5-Digit Quick Sign-In PIN"
              type="password"
              inputMode="numeric"
              maxLength={5}
              pattern="[0-9]{5}"
              value={formData.securityPin}
              onChange={(e) => setFormData({ ...formData, securityPin: e.target.value.replace(/\D/g, '').slice(0, 5) })}
              placeholder="Leave blank to auto-generate"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link href="/admin/teachers">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={isEmailChecking || isEmailAvailable === false}
          >
            Create Faculty Record
          </Button>
        </div>
      </form>
    </div>
  );
}
