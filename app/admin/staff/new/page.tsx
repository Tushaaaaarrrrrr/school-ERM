'use client';

// ============================================================================
// Comprehensive Staff / Employee Registration Page
// Full-page form with Identity Proofs, Role-specific details, and Google Auth
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { staffService, schoolIdentifierService } from '@/lib/services/api';
import { StaffType } from '@/lib/types';
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
  Briefcase,
  Phone,
  ShieldCheck,
  Lock,
  IndianRupee,
  Bus,
} from 'lucide-react';

export default function RegisterStaffPage() {
  const router = useRouter();
  const { currentSchool, currentUser } = useAuth();
  const schoolId = currentSchool?.id || 'sch-001';
  const { success, error: toastError } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStaffEmailValid, setIsStaffEmailValid] = useState(true);
  const [isStaffEmailAvailable, setIsStaffEmailAvailable] = useState<boolean | null>(true);
  const [isStaffEmailChecking, setIsStaffEmailChecking] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Role
    staffType: 'accountant' as StaffType,
    customTypeName: '',
    department: 'Accounts & Finance',

    // Personal
    firstName: '',
    lastName: '',
    gender: 'male' as 'male' | 'female' | 'other',
    dateOfBirth: '',
    joiningDate: new Date().toISOString().split('T')[0],
    photoUrl: '',

    // Identification & Contact
    employeeNumber: '',
    phone: '',
    alternatePhone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',

    // Compensation & Access
    monthlySalary: '25000',
    portalAccess: true,

    // Driver Specific
    drivingLicenseNumber: '',
    drivingLicenseExpiry: '',

    // Login Credentials
    email: '',
    securityPin: '12345',
  });

  const [identityProofs, setIdentityProofs] = useState<IdentityProof[]>([]);

  useEffect(() => {
    const loadIdentifier = async () => {
      try {
        const nextId = await schoolIdentifierService.nextStaffNumber(schoolId, currentSchool?.code);
        setFormData((prev) => ({ ...prev, employeeNumber: nextId }));
      } catch {
        toastError('Failed to generate next employee sequence number');
      }
    };
    loadIdentifier();
  }, [schoolId, currentSchool]);

  const handleStaffTypeChange = (type: StaffType) => {
    let dept = 'Administration';
    if (type === 'accountant') dept = 'Accounts & Finance';
    if (type === 'librarian') dept = 'Library';
    if (type === 'driver' || type === 'transport_manager') dept = 'Transport & Logistics';
    if (type === 'receptionist') dept = 'Front Desk & Enquiries';
    if (type === 'security') dept = 'Security & Campus Safety';
    if (type === 'caretaker' || type === 'keeper' || type === 'sweeper') dept = 'Maintenance & Facilities';

    const needsPortal = !['sweeper', 'caretaker', 'keeper'].includes(type);

    setFormData((prev) => ({
      ...prev,
      staffType: type,
      department: dept,
      portalAccess: needsPortal,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.employeeNumber || !formData.phone.trim()) {
      toastError('Please fill all required fields: First Name, Employee ID, and Phone Number.');
      return;
    }

    if (formData.portalAccess) {
      if (!formData.email.trim()) {
        toastError('Google email is required for staff members with portal access.');
        return;
      }
      if (!formData.email.trim().toLowerCase().endsWith('@gmail.com')) {
        toastError('Staff email must be an official @gmail.com account for Google Sign-In.');
        return;
      }
      if (isStaffEmailAvailable === false) {
        toastError('This Google email is not available or registered to a conflicting account.');
        return;
      }
    }

    if (formData.staffType === 'driver' && !formData.drivingLicenseNumber.trim()) {
      toastError('Driving license number is required for transport drivers.');
      return;
    }

    setIsSubmitting(true);

    try {
      await staffService.createStaff(
        schoolId,
        {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          staff_type: formData.staffType,
          custom_type_name: formData.staffType === 'other' ? formData.customTypeName.trim() : undefined,
          department: formData.department.trim(),
          employee_number: formData.employeeNumber.trim().toUpperCase(),
          joining_date: formData.joiningDate,
          photo_url: formData.photoUrl || undefined,
          salary: parseInt(formData.monthlySalary, 10) || 25000,
          portal_access: formData.portalAccess,
          permissions: [],
          status: 'active',
          driving_license_number: formData.drivingLicenseNumber.trim() || undefined,
          driving_license_expiry: formData.drivingLicenseExpiry || undefined,
          security_pin: formData.securityPin || '12345',
          identity_proofs: identityProofs.length > 0 ? identityProofs : undefined,
          extra_details: {
            gender: formData.gender,
            date_of_birth: formData.dateOfBirth,
            alternate_phone: formData.alternatePhone,
            address: formData.address,
            emergency_contact_name: formData.emergencyContactName,
            emergency_contact_phone: formData.emergencyContactPhone,
          },
        } as any,
        currentSchool?.code
      );

      success(`Staff member ${formData.firstName} ${formData.lastName} registered successfully!`);
      router.push('/admin/staff');
    } catch {
      toastError('Failed to register employee. Please verify details and retry.');
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
            href="/admin/staff"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Register School Employee</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/staff">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            form="create-staff-form"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={formData.portalAccess && (isStaffEmailChecking || isStaffEmailAvailable === false)}
          >
            Create Employee Record
          </Button>
        </div>
      </div>

      <form id="create-staff-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Designation & Personal Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">1. Role &amp; Personal Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Employee Designation *
              </label>
              <select
                value={formData.staffType}
                onChange={(e) => handleStaffTypeChange(e.target.value as StaffType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="accountant">Accountant</option>
                <option value="receptionist">Receptionist / Front Desk</option>
                <option value="librarian">Librarian</option>
                <option value="office_staff">Office Staff / Clerk</option>
                <option value="transport_manager">Transport Manager</option>
                <option value="driver">Bus / Van Driver</option>
                <option value="security">Security Personnel</option>
                <option value="caretaker">Caretaker / Warden</option>
                <option value="sweeper">Cleaning Staff / Housekeeping</option>
                <option value="other">Other Designation</option>
              </select>
            </div>

            <Input
              label="First Name *"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="e.g. Ramesh"
            />

            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="e.g. Kumar (optional)"
            />
          </div>

          {formData.staffType === 'other' && (
            <Input
              label="Custom Designation Title *"
              required
              value={formData.customTypeName}
              onChange={(e) => setFormData({ ...formData, customTypeName: e.target.value })}
              placeholder="e.g. Lab Technician, IT Support"
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Select
              label="Gender *"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
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

            <Input
              label="Department *"
              required
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-100">
            <PhotoUpload
              label="Employee Photo (Optional)"
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
            title="Employee Identity Proofs (Aadhaar, PAN, Driving License, etc.)"
          />
        </div>

        {/* Section 3: Driver Specific License Details */}
        {formData.staffType === 'driver' && (
          <div className="bg-amber-50/70 p-6 rounded-2xl border border-amber-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-amber-200/80">
              <Bus className="w-5 h-5 text-amber-700" />
              <h3 className="text-sm font-bold text-amber-900">Commercial Transport License (Mandatory for Drivers)</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Commercial Driving License No. *"
                required
                value={formData.drivingLicenseNumber}
                onChange={(e) => setFormData({ ...formData, drivingLicenseNumber: e.target.value.toUpperCase() })}
                placeholder="DL-0420110012345"
                className="font-mono uppercase"
              />
              <Input
                label="License Validity Expiration Date *"
                type="date"
                required
                value={formData.drivingLicenseExpiry}
                onChange={(e) => setFormData({ ...formData, drivingLicenseExpiry: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Section 4: Contact & Emergency Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Phone className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">2. Contact &amp; Emergency Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Primary Phone Number *"
              required
              type="tel"
              inputMode="numeric"
              maxLength={15}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 15) })}
              placeholder="9876543210"
            />
            <Input
              label="Alternate Contact Phone"
              type="tel"
              inputMode="numeric"
              maxLength={15}
              value={formData.alternatePhone}
              onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value.replace(/\D/g, '').slice(0, 15) })}
              placeholder="9876500000 (optional)"
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
              onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
              placeholder="Spouse / Parent / Relative name"
            />
            <Input
              label="Emergency Contact Phone"
              type="tel"
              inputMode="numeric"
              maxLength={15}
              value={formData.emergencyContactPhone}
              onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value.replace(/\D/g, '').slice(0, 15) })}
              placeholder="Emergency phone number"
            />
          </div>
        </div>

        {/* Section 5: Employment, Compensation & Software Access */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <IndianRupee className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">3. Compensation &amp; Software Access</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Employee ID (Permanent) *"
              required
              readOnly
              value={formData.employeeNumber}
              className="bg-slate-50 font-mono"
            />
            <Input
              label="Monthly Salary (₹) *"
              required
              type="number"
              min="0"
              value={formData.monthlySalary}
              onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
              placeholder="25000"
            />
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-900 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.portalAccess}
                onChange={(e) => setFormData({ ...formData, portalAccess: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              Enable ERP Portal Software Access for this Employee
            </label>
            <p className="text-xs text-slate-500">
              When enabled, this employee will have an individual login to access student records, fee collections, or transport logs according to their role.
            </p>
          </div>
        </div>

        {/* Section 6: Portal Sign-In Account */}
        {formData.portalAccess && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Lock className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">4. Portal Credentials &amp; Authentication</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GoogleEmailInput
                label="Google Email (@gmail.com) *"
                required
                value={formData.email}
                onChange={(val) => setFormData({ ...formData, email: val })}
                targetSchoolId={schoolId}
                targetRole="staff"
                onValidationChange={(valid, available, checking) => {
                  setIsStaffEmailValid(valid);
                  setIsStaffEmailAvailable(available);
                  setIsStaffEmailChecking(checking);
                }}
                placeholder="staff.name@gmail.com"
                id="staff-register-email"
              />

              <Input
                label="5-Digit Quick Sign-In PIN"
                type="password"
                inputMode="numeric"
                maxLength={5}
                pattern="[0-9]{5}"
                value={formData.securityPin}
                onChange={(e) => setFormData({ ...formData, securityPin: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                placeholder="12345"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Link href="/admin/staff">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={formData.portalAccess && (isStaffEmailChecking || isStaffEmailAvailable === false)}
          >
            Create Employee Record
          </Button>
        </div>
      </form>
    </div>
  );
}
