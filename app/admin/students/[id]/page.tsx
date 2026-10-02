'use client';

// ============================================================================
// Comprehensive Student Profile Page (Full Details, Edit, Attendance & Transport)
// ============================================================================

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  studentService,
  feeService,
  chargeService,
  receiptService,
  examService,
  attendanceService,
  holidayService,
  leaveService,
  transportService,
  academicService,
  authLogService,
  parentService,
  followUpService,
} from '@/lib/services/api';
import {
  Student,
  LeaveType,
  StudentFeeInvoice,
  StudentCharge,
  PaymentReceipt,
  PaymentMethod,
  ExamResult,
  Exam,
  StudentAttendance,
  SchoolHoliday,
  StudentLeave,
  StudentTransportAssignment,
  StudentTransportEvent,
  SchoolClass,
  Section,
  Vehicle,
  TransportRoute,
  AuthEvent,
  ParentProfile,
  ParentStudentLink,
  StudentEmergencyInfo,
  StudentFollowUp,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { StatusBadge, InvoiceStatusBadge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/modal';
import { ResetPasswordModal } from '@/components/auth/reset-password-modal';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { FeeReceipt } from '@/components/receipt/fee-receipt';
import { DateInput } from '@/components/ui/date-input';
import { GoogleEmailInput } from '@/components/ui/google-email-input';
import { formatCurrency, formatDate, formatPercentage, sanitizePersonName, isValidPersonName, sanitizeIndianMobile, isValidIndianMobile } from '@/lib/utils/formatters';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/context/auth-context';
import {
  ArrowLeft,
  GraduationCap,
  IndianRupee,
  Award,
  CalendarCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  KeyRound,
  UserCheck,
  UserX,
  History,
  Clock,
  CheckCircle2,
  XCircle,
  Palmtree,
  Bus,
  Edit3,
  CreditCard,
  FileText,
  User,
  ShieldCheck,
  HelpCircle,
  AlertCircle,
  TrendingUp,
  Receipt,
  Printer,
  Plus,
  RotateCcw,
  Tag,
  Users,
} from 'lucide-react';
import { CardSkeleton } from '@/components/ui/skeleton';

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { currentUser, currentSchool } = useAuth();
  const { success, error: toastError } = useToast();

  const [student, setStudent] = useState<Student | null>(null);
  const [siblings, setSiblings] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<StudentFeeInvoice[]>([]);
  const [charges, setCharges] = useState<StudentCharge[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [results, setResults] = useState<{ exam: Exam; result: ExamResult }[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [activeLeave, setActiveLeave] = useState<StudentLeave | null>(null);
  const [allLeaves, setAllLeaves] = useState<StudentLeave[]>([]);
  const [holidays, setHolidays] = useState<SchoolHoliday[]>([]);
  const [transportAssignment, setTransportAssignment] = useState<StudentTransportAssignment | null>(null);
  const [todayTransportEvent, setTodayTransportEvent] = useState<StudentTransportEvent | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuthEvent[]>([]);

  // Metadata for editing
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'attendance' | 'academics' | 'fees' | 'transport' | 'leave' | 'emergency' | 'account' | 'history'
  >('overview');
  const [attendanceRange, setAttendanceRange] = useState<'month' | 'three_months' | 'year' | 'custom'>('month');

  // Parent Links & Emergency state
  const [parentLinks, setParentLinks] = useState<ParentStudentLink[]>([]);
  const [studentFollowUps, setStudentFollowUps] = useState<StudentFollowUp[]>([]);
  const [isSavingEmergency, setIsSavingEmergency] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState<StudentEmergencyInfo>({
    blood_group: '',
    allergies_alert: '',
    medical_condition_note: '',
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
    doctor_clinic_contact: '',
    visible_to_teachers: true,
    visible_to_transport: false,
  });

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isGrantLeaveModalOpen, setIsGrantLeaveModalOpen] = useState(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState<StudentAttendance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fee & Receipt Modals
  const [activeReceiptForModal, setActiveReceiptForModal] = useState<PaymentReceipt | null>(null);
  const [isAddChargeModalOpen, setIsAddChargeModalOpen] = useState(false);
  const [isComprehensivePaymentModalOpen, setIsComprehensivePaymentModalOpen] = useState(false);
  const [isReversePaymentModalOpen, setIsReversePaymentModalOpen] = useState(false);

  // Charge Creation Form State
  const [newChargeForm, setNewChargeForm] = useState({
    chargeName: 'Exam Fee',
    customName: '',
    amount: 300,
    dueDate: '',
    description: '',
  });

  // Multi-Item Payment Form State
  const [paymentSelection, setPaymentSelection] = useState<{
    includeInvoice: boolean;
    invoiceId?: string;
    selectedChargeIds: string[];
    discountAmount: number;
    discountReason: string;
    amountToPay: number;
    paymentMethod: PaymentMethod;
    referenceNumber: string;
    notes: string;
  }>({
    includeInvoice: true,
    invoiceId: undefined,
    selectedChargeIds: [],
    discountAmount: 0,
    discountReason: '',
    amountToPay: 0,
    paymentMethod: 'cash',
    referenceNumber: '',
    notes: 'Collected at school counter',
  });

  // Reversal Form State
  const [paymentToReverse, setPaymentToReverse] = useState<{
    paymentId: string;
    receiptId: string;
    receiptNumber: string;
    amount: number;
  } | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isSubmittingReversal, setIsSubmittingReversal] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    registrationNumber: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    joiningDate: '',
    photoUrl: '',
    classId: '',
    sectionId: '',
    rollNumber: '',
    status: 'active' as Student['status'],
    fatherName: '',
    motherName: '',
    guardianName: '',
    primaryPhone: '',
    secondaryPhone: '',
    email: '',
    address: '',
    vehicleId: '',
  routeId: '',
    stopId: '',
    pickupEnabled: true,
  });
  const [isParentEmailAvailable, setIsParentEmailAvailable] = useState<boolean | null>(true);
  const [isParentEmailChecking, setIsParentEmailChecking] = useState(false);

  const [isDeactivating, setIsDeactivating] = useState(false);
  const todayIso = new Date().toISOString().split('T')[0];
  const [grantLeaveForm, setGrantLeaveForm] = useState({
    leaveType: 'full_day' as LeaveType,
    startDate: todayIso,
    endDate: todayIso,
    reason: '',
  });
  const [isGrantingLeave, setIsGrantingLeave] = useState(false);

  const handleToggleStudentStatus = async () => {
    if (!student || isDeactivating) return;
    const nextStatus = student.status === 'active' ? 'inactive' : 'active';
    setIsDeactivating(true);
    try {
      await studentService.updateStudentStatus(student.id, nextStatus, currentUser?.name);
      setStudent({ ...student, status: nextStatus });
      success(
        nextStatus === 'inactive'
          ? `Student "${student.first_name} ${student.last_name}" deactivated. Login and active attendance are suspended while academic & fee history remain safe.`
          : `Student "${student.first_name} ${student.last_name}" restored to Active status.`
      );
    } catch (err) {
      toastError(errorMessage(err, 'Failed to update student status'));
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleGrantLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || isGrantingLeave) return;
    if (grantLeaveForm.endDate < grantLeaveForm.startDate) {
      toastError('End date cannot be before start date');
      return;
    }
    setIsGrantingLeave(true);
    try {
      const granted = await leaveService.grantDirectLeave({
        school_id: student.school_id,
        student_id: student.id,
        leave_type: grantLeaveForm.leaveType,
        start_date: grantLeaveForm.startDate,
        end_date: grantLeaveForm.endDate,
        reason: grantLeaveForm.reason,
        granterId: currentUser?.id || 'usr-admin',
        granterName: currentUser?.name || 'School Admin',
        granterRole: currentUser?.role === 'teacher' ? 'teacher' : 'school_admin',
        student_name: `${student.first_name} ${student.last_name}`,
        class_name: student.current_enrollment?.class_name,
        section_name: student.current_enrollment?.section_name,
      });
      setAllLeaves((prev) => [granted, ...prev]);
      const today = new Date().toISOString().split('T')[0];
      if (granted.start_date <= today && granted.end_date >= today) setActiveLeave(granted);
      setGrantLeaveForm({ leaveType: 'full_day', startDate: today, endDate: today, reason: '' });
      setIsGrantLeaveModalOpen(false);
      success('Leave granted and approved.');
    } catch (err) {
      toastError(errorMessage(err, 'Failed to grant leave'));
    } finally {
      setIsGrantingLeave(false);
    }
  };

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const s = await studentService.getStudentById(resolvedParams.id);
      if (s) {
        setStudent(s);
        const [
          invs,
          resList,
          attList,
          hols,
          activeLv,
          leavesList,
          transStatus,
          clsList,
          secList,
          vehList,
          rtList,
          logs,
          chgList,
          rcpList,
          linksList,
          followUps,
          sibsList,
        ] = await Promise.all([
          feeService.getInvoices(s.school_id, { studentId: s.id }),
          examService.getPublishedResultsForStudent(s.id),
          attendanceService.getAttendance(s.school_id, { studentId: s.id }),
          holidayService.getHolidays(s.school_id).catch(() => []),
          leaveService.getActiveLeaveForStudent(s.id, todayStr),
          leaveService.getLeaves(s.school_id, { studentId: s.id }),
          transportService.getStudentTodayTransportStatus(s.id, todayStr),
          academicService.getClasses(s.school_id),
          academicService.getSections(s.school_id),
          transportService.getVehicles(s.school_id),
          transportService.getRoutes(s.school_id),
          authLogService.getEvents({ schoolId: s.school_id, limit: 100 }),
          chargeService.getStudentCharges(s.school_id, { studentId: s.id }),
          receiptService.getReceipts(s.school_id, { studentId: s.id }),
          parentService.getParentStudentLinks(s.school_id, { studentId: s.id }),
          followUpService.getStudentFollowUps(s.school_id, s.id),
          studentService.getStudentSiblings(s.id, s.school_id).catch(() => []),
        ]);

        setInvoices(invs);
        setResults(resList);
        setAttendance(attList);
        setHolidays(hols);
        setActiveLeave(activeLv || s.active_leave || null);
        setAllLeaves(leavesList);
        setTransportAssignment(transStatus.assignment || s.transport_assignment || null);
        setTodayTransportEvent(transStatus.todayEvent);
        setClasses(clsList);
        setSections(secList);
        setVehicles(vehList);
        setRoutes(rtList);
        setAuditLogs(logs.filter((l) => l.user_id === s.id || l.details?.studentName?.toString().includes(s.first_name)));
        setCharges(chgList || []);
        setReceipts(rcpList || []);
        setParentLinks(linksList || []);
        setStudentFollowUps(followUps || []);
        setSiblings(sibsList || []);

        // Auto-heal missing current_enrollment if school has classes
        if (!s.current_enrollment?.class_name) {
          const matchedClass = clsList.find((c) => c.id === s.current_enrollment?.class_id) || (clsList.length === 1 ? clsList[0] : undefined);
          const matchedSection = secList.find((sec) => sec.id === s.current_enrollment?.section_id) || (matchedClass ? secList.find((sec) => sec.class_id === matchedClass.id) : undefined);
          if (matchedClass) {
            s.current_enrollment = {
              id: s.current_enrollment?.id || `enr-${s.id}`,
              school_id: s.school_id,
              student_id: s.id,
              academic_year_id: s.current_enrollment?.academic_year_id || 'ay-2026',
              academic_year_name: s.current_enrollment?.academic_year_name || '2026-27',
              class_id: matchedClass.id,
              class_name: matchedClass.name,
              section_id: matchedSection?.id || '',
              section_name: matchedSection?.name,
              roll_number: s.current_enrollment?.roll_number || '01',
              joined_at: s.current_enrollment?.joined_at || s.joining_date,
              status: 'active',
              created_at: s.current_enrollment?.created_at || s.created_at,
            };
            setStudent({ ...s });
            studentService.updateStudent(s.id, { current_enrollment: s.current_enrollment }).catch(() => {});
          }
        }

        // Pre-fill emergency info
        if (s.emergency_info) {
          setEmergencyForm({
            blood_group: s.emergency_info.blood_group || '',
            allergies_alert: s.emergency_info.allergies_alert || '',
            medical_condition_note: s.emergency_info.medical_condition_note || '',
            emergency_contact_name: s.emergency_info.emergency_contact_name || s.guardian?.father_name || s.guardian?.guardian_name || '',
            emergency_contact_relationship: s.emergency_info.emergency_contact_relationship || '',
            emergency_contact_phone: s.emergency_info.emergency_contact_phone || s.guardian?.primary_phone || '',
            doctor_clinic_contact: s.emergency_info.doctor_clinic_contact || '',
            visible_to_teachers: s.emergency_info.visible_to_teachers ?? true,
            visible_to_transport: s.emergency_info.visible_to_transport ?? false,
          });
        }

        // Pre-fill edit form
        setEditForm({
          firstName: s.first_name,
          lastName: s.last_name,
          registrationNumber: s.registration_number,
          dateOfBirth: s.date_of_birth || '',
          gender: s.gender || 'male',
          joiningDate: s.joining_date,
          photoUrl: s.photo_url || '',
          classId: s.current_enrollment?.class_id || '',
          sectionId: s.current_enrollment?.section_id || '',
          rollNumber: s.current_enrollment?.roll_number || '',
          status: s.status,
          fatherName: s.guardian?.father_name || '',
          motherName: s.guardian?.mother_name || '',
          guardianName: s.guardian?.guardian_name || '',
          primaryPhone: s.guardian?.primary_phone || '',
          secondaryPhone: s.guardian?.secondary_phone || '',
          email: s.guardian?.email || '',
          address: s.guardian?.address || '',
          vehicleId: transStatus.assignment?.vehicle_id || '',
          routeId: transStatus.assignment?.route_id || '',
          stopId: transStatus.assignment?.stop_id || '',
          pickupEnabled: transStatus.assignment?.pickup_enabled ?? true,
        });
      }
    } catch (err) {
      toastError(errorMessage(err, 'Failed to load student profile'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [resolvedParams.id]);

  const handleSaveStudentEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    if (!isValidPersonName(editForm.firstName)) {
      toastError('First Name must contain letters only (no numbers or symbols).');
      return;
    }

    if (editForm.lastName && !isValidPersonName(editForm.lastName)) {
      toastError('Last Name must contain letters only (no numbers or symbols).');
      return;
    }

    if (![editForm.fatherName, editForm.motherName, editForm.guardianName].some((name) => name.trim())) {
      toastError('Please enter at least one guardian name.');
      return;
    }

    if (editForm.fatherName && !isValidPersonName(editForm.fatherName)) {
      toastError("Father's Name must contain letters only (no numbers or symbols).");
      return;
    }

    if (editForm.motherName && !isValidPersonName(editForm.motherName)) {
      toastError("Mother's Name must contain letters only (no numbers or symbols).");
      return;
    }

    if (editForm.guardianName && !isValidPersonName(editForm.guardianName)) {
      toastError('Guardian Name must contain letters only (no numbers or symbols).');
      return;
    }

    if (!isValidIndianMobile(editForm.primaryPhone)) {
      toastError('Primary phone must be a 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (editForm.secondaryPhone && !isValidIndianMobile(editForm.secondaryPhone)) {
      toastError('Secondary phone must be a 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (!editForm.address.trim()) {
      toastError('Residential address is required.');
      return;
    }

    if (editForm.email.trim() && isParentEmailAvailable === false) {
      toastError('Parent email is not available for portal login.');
      return;
    }

    if (isParentEmailChecking) {
      toastError('Checking parent email availability...');
      return;
    }

    try {
      const targetClass = classes.find((c) => c.id === editForm.classId);
      const targetSection = sections.find((s) => s.id === editForm.sectionId);

      let newTransport: Partial<StudentTransportAssignment> | undefined;
      if (editForm.vehicleId && editForm.routeId && editForm.stopId) {
        const v = vehicles.find((veh) => veh.id === editForm.vehicleId);
        const r = routes.find((rt) => rt.id === editForm.routeId);
        const stp = r?.stops?.find((s) => s.id === editForm.stopId);

        newTransport = {
          vehicle_id: editForm.vehicleId,
          vehicle_name: v?.vehicle_name,
          vehicle_number: v?.vehicle_number,
          route_id: editForm.routeId,
          route_name: r?.route_name,
          stop_id: editForm.stopId,
          stop_name: stp?.stop_name,
          estimated_pickup_time: stp?.estimated_pickup_time,
          pickup_enabled: editForm.pickupEnabled,
          drop_enabled: true,
          status: 'active',
        };
      }

      await studentService.updateStudent(
        student.id,
        {
          first_name: editForm.firstName,
          last_name: editForm.lastName,
          registration_number: editForm.registrationNumber,
          date_of_birth: editForm.dateOfBirth,
          gender: editForm.gender,
          joining_date: editForm.joiningDate,
          photo_url: editForm.photoUrl,
          status: editForm.status,
          guardian: {
            father_name: editForm.fatherName,
            mother_name: editForm.motherName,
            guardian_name: editForm.guardianName || editForm.fatherName,
            primary_phone: editForm.primaryPhone,
            secondary_phone: editForm.secondaryPhone,
            email: editForm.email,
            address: editForm.address,
          },
          current_enrollment: {
            id: student.current_enrollment?.id || `enr-${student.id}`,
            school_id: student.school_id,
            student_id: student.id,
            academic_year_id: student.current_enrollment?.academic_year_id || 'ay-2026',
            academic_year_name: student.current_enrollment?.academic_year_name || '2026-27',
            joined_at: student.current_enrollment?.joined_at || student.joining_date || new Date().toISOString().split('T')[0],
            status: 'active',
            created_at: student.current_enrollment?.created_at || new Date().toISOString(),
            ...student.current_enrollment,
            class_id: editForm.classId,
            class_name: targetClass?.name || student.current_enrollment?.class_name,
            section_id: editForm.sectionId,
            section_name: targetSection?.name || student.current_enrollment?.section_name,
            roll_number: editForm.rollNumber,
          },
          transport_assignment: newTransport as StudentTransportAssignment,
        },
        currentUser?.id,
        currentUser?.name
      );

      success('Student details updated successfully');
      setIsEditModalOpen(false);
      loadProfile();
    } catch (err) {
      toastError(errorMessage(err, 'Failed to update student profile'));
    }
  };

  const handleSaveEmergencyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    if (emergencyForm.emergency_contact_phone && !/^\d{10}$/.test(emergencyForm.emergency_contact_phone)) {
      toastError('Emergency contact phone must contain exactly 10 digits.');
      return;
    }

    setIsSavingEmergency(true);
    try {
      await studentService.updateStudent(
        student.id,
        {
          emergency_info: {
            ...emergencyForm,
            updated_at: new Date().toISOString(),
            updated_by_name: currentUser?.name || 'School Admin',
          },
        },
        currentUser?.id,
        currentUser?.name
      );
      success('Emergency & medical information saved successfully');
      loadProfile();
    } catch (err) {
      toastError(errorMessage(err, 'Failed to update emergency information'));
    } finally {
      setIsSavingEmergency(false);
    }
  };

  const handleAddChargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    const chargeName =
      newChargeForm.chargeName === 'Other'
        ? newChargeForm.customName.trim()
        : newChargeForm.chargeName;

    if (!chargeName) {
      toastError('Please provide a valid charge name');
      return;
    }

    try {
      await chargeService.createStudentCharge({
        school_id: student.school_id,
        student_id: student.id,
        academic_year_id: student.current_enrollment?.academic_year_id || 'ay-2026',
        charge_name: chargeName,
        amount: Number(newChargeForm.amount),
        due_date: newChargeForm.dueDate || undefined,
        description: newChargeForm.description?.trim() || undefined,
        created_by: currentUser?.id,
        created_by_name: currentUser?.name || 'School Admin',
        student_name: `${student.first_name} ${student.last_name}`,
        registration_number: student.registration_number,
      });

      success(`Charge "${chargeName}" added successfully`);
      setIsAddChargeModalOpen(false);
      setNewChargeForm({
        chargeName: 'Exam Fee',
        customName: '',
        amount: 300,
        dueDate: '',
        description: '',
      });
      loadProfile();
    } catch (err) {
      toastError(errorMessage(err, 'Failed to add charge'));
    }
  };

  const handleOpenComprehensivePayment = (preferredInvoiceId?: string) => {
    const pendingInv = preferredInvoiceId
      ? invoices.find((i) => i.id === preferredInvoiceId)
      : invoices.find((i) => i.status !== 'paid');

    const pendingCharges = charges.filter((c) => c.status === 'pending' || c.status === 'partial');
    const pendingChargeIds = pendingCharges.map((c) => c.id);

    const tuitionDue = pendingInv ? pendingInv.remaining_amount || pendingInv.final_amount : 0;
    const chargesDue = pendingCharges.reduce((sum, c) => sum + c.remaining_amount, 0);
    const totalDue = tuitionDue + chargesDue;

    setPaymentSelection({
      includeInvoice: !!pendingInv,
      invoiceId: pendingInv?.id,
      selectedChargeIds: pendingChargeIds,
      discountAmount: 0,
      discountReason: '',
      amountToPay: totalDue,
      paymentMethod: 'cash',
      referenceNumber: '',
      notes: 'Fee collected at counter',
    });

    setIsComprehensivePaymentModalOpen(true);
  };

  const handleComprehensivePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    if (paymentSelection.amountToPay <= 0) {
      toastError('Please enter a valid amount to pay');
      return;
    }

    try {
      const result = await feeService.recordComprehensivePayment({
        schoolId: student.school_id,
        studentId: student.id,
        invoiceId: paymentSelection.includeInvoice ? paymentSelection.invoiceId : undefined,
        chargeIds: paymentSelection.selectedChargeIds,
        discountAmount: Number(paymentSelection.discountAmount || 0),
        discountReason: paymentSelection.discountReason,
        amountPaid: Number(paymentSelection.amountToPay),
        paymentMethod: paymentSelection.paymentMethod,
        referenceNumber: paymentSelection.referenceNumber.trim() || undefined,
        receivedByName: currentUser?.name || 'School Accountant',
        receivedById: currentUser?.id,
        notes: paymentSelection.notes,
      });

      success(`Payment of ${formatCurrency(paymentSelection.amountToPay)} recorded! Receipt generated.`);
      setIsComprehensivePaymentModalOpen(false);
      setActiveReceiptForModal(result.receipt);
      loadProfile();
    } catch (err: any) {
      toastError(err?.message || 'Failed to record payment');
    }
  };

  const handleReversePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentToReverse || !reversalReason.trim()) {
      toastError('Please enter a reason for reversing this payment');
      return;
    }

    setIsSubmittingReversal(true);
    try {
      await receiptService.reversePayment(
        paymentToReverse.paymentId,
        paymentToReverse.receiptId,
        reversalReason.trim(),
        currentUser?.id || 'admin',
        currentUser?.name || 'School Admin'
      );

      success(`Payment ${paymentToReverse.receiptNumber} reversed and marked VOID`);
      setIsReversePaymentModalOpen(false);
      setPaymentToReverse(null);
      setReversalReason('');
      loadProfile();
    } catch (err) {
      toastError(errorMessage(err, 'Failed to reverse payment'));
    } finally {
      setIsSubmittingReversal(false);
    }
  };

  const handleWaiveCharge = async (chargeId: string, action: 'waived' | 'cancelled') => {
    const reason = window.prompt(`Reason for ${action === 'waived' ? 'waiving' : 'cancelling'} this charge:`);
    if (!reason || !reason.trim()) return;

    try {
      await chargeService.waiveOrCancelCharge(
        chargeId,
        action,
        reason.trim(),
        currentUser?.id || 'admin',
        currentUser?.name || 'School Admin'
      );
      success(`Charge ${action} successfully`);
      loadProfile();
    } catch (err) {
      toastError(errorMessage(err, `Failed to ${action} charge`));
    }
  };

  if (isLoading || !student) {
    return (
      <div className="p-6 space-y-6">
        <CardSkeleton />
      </div>
    );
  }

  // Attendance Metrics
  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;
  const leaveCount = attendance.filter((a) => a.status === 'leave').length;
  const partialCount = attendance.filter((a) => a.status === 'partial').length;
  const totalMarked = attendance.length;
  const attendanceRate = totalMarked > 0 ? (presentCount / totalMarked) * 100 : null;
  const gradedResults = results.filter(({ exam, result }) => !result.absent && result.marks_obtained != null && exam.max_marks > 0);
  const academicAverage = gradedResults.length > 0
    ? gradedResults.reduce((sum, { exam, result }) => sum + ((result.marks_obtained || 0) / exam.max_marks) * 100, 0) / gradedResults.length
    : null;

  // Today's Attendance Record
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendance.find((a) => a.attendance_date === todayDateStr);
  const isTodayHoliday = holidays.some((h) => h.start_date <= todayDateStr && h.end_date >= todayDateStr);

  return (
    <div className="space-y-6 text-left w-full">
      {/* Back Link */}
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Student Directory
      </Link>

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 w-full overflow-hidden">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative group shrink-0">
            {student.photo_url ? (
              <img
                src={student.photo_url}
                alt={`${student.first_name} ${student.last_name}`}
                className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl font-bold shadow-2xs">
                {student.first_name?.[0] || 'S'}
                {student.last_name?.[0] || ''}
              </div>
            )}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute -bottom-1 -right-1 p-1 sm:p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 shadow-xs transition-colors"
              title="Change Photo"
            >
              <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                {student.first_name} {student.last_name}
              </h1>
              <StatusBadge status={student.status} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                Reg ID: {student.registration_number}
              </span>
              <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                {student.current_enrollment?.class_name || 'Class not assigned'}
                {student.current_enrollment?.section_name ? ` (${student.current_enrollment.section_name})` : ''}
              </span>
              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                Roll: {student.current_enrollment?.roll_number || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar (2-Column Grid on Mobile, Row on Desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="w-full sm:w-auto justify-center text-xs font-semibold"
            leftIcon={<Edit3 className="w-3.5 h-3.5 text-slate-500" />}
          >
            Edit Student
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenComprehensivePayment()}
            className="w-full sm:w-auto justify-center text-xs font-semibold"
            leftIcon={<IndianRupee className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Record Payment
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('attendance')}
            className="w-full sm:w-auto justify-center text-xs font-semibold"
            leftIcon={<CalendarCheck className="w-3.5 h-3.5 text-indigo-600" />}
          >
            Attendance
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsResetPasswordOpen(true)}
            className="w-full sm:w-auto justify-center text-xs font-semibold"
            leftIcon={<KeyRound className="w-3.5 h-3.5 text-amber-600" />}
          >
            Account
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStudentStatus}
            disabled={isDeactivating}
            className={`w-full sm:w-auto justify-center text-xs font-semibold ${
              student.status === 'active'
                ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200'
                : 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200'
            }`}
            leftIcon={
              student.status === 'active' ? (
                <UserX className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              )
            }
          >
            {student.status === 'active' ? 'Deactivate Student' : 'Activate Student'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'attendance', label: 'Attendance' },
          { id: 'academics', label: 'Academics' },
          { id: 'fees', label: 'Fees & Invoices' },
          { id: 'transport', label: 'Transport' },
          { id: 'leave', label: 'Leave' },
          { id: 'emergency', label: 'Emergency / Medical' },
          { id: 'account', label: 'Account Access' },
          { id: 'history', label: 'Audit History' },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
      />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block">Attendance Rate</span>
              <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
                {attendanceRate == null ? 'No data' : formatPercentage(attendanceRate)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block">Academic Average</span>
              <span className="text-xl font-extrabold text-indigo-700 mt-1 block">
                {academicAverage == null ? 'No data' : formatPercentage(academicAverage)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block">Fee Status</span>
              <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
                {invoices.length === 0 ? 'No invoices' : invoices.some((i) => i.status !== 'paid') ? 'Pending' : 'Paid'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block">Transport</span>
              <span className="text-sm font-extrabold text-slate-900 mt-1.5 truncate block">
                {student.transport_assignment?.pickup_enabled
                  ? student.transport_assignment.vehicle_name || 'Assigned'
                  : 'Not Assigned'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
                <User className="w-4 h-4" /> Personal Information
              </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Full Name</span>
                <span className="font-semibold text-slate-800">{student.first_name} {student.last_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Registration Number</span>
                <span className="font-mono font-semibold text-slate-800">{student.registration_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Date of Birth</span>
                <span className="font-semibold text-slate-800">{student.date_of_birth ? formatDate(student.date_of_birth) : 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Gender</span>
                <span className="font-semibold text-slate-800 capitalize">{student.gender || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Admission Date</span>
                <span className="font-semibold text-slate-800">{formatDate(student.joining_date)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Current Status</span>
                <span className="font-semibold text-slate-800 capitalize">{student.status}</span>
              </div>
            </div>
          </div>

          {/* Academic Placement */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Academic Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Academic Year</span>
                <span className="font-semibold text-slate-800">{student.current_enrollment?.academic_year_name || 'Not assigned'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Class & Section</span>
                <span className="font-semibold text-slate-800">
                  {student.current_enrollment?.class_name || 'Not assigned'}
                  {student.current_enrollment?.section_name ? ` • Section ${student.current_enrollment.section_name}` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Roll Number</span>
                <span className="font-mono font-semibold text-slate-800">{student.current_enrollment?.roll_number || 'Not assigned'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Classroom Location</span>
                <span className="font-semibold text-slate-800">{student.current_enrollment?.room_number ? `Room ${student.current_enrollment.room_number}` : 'Not assigned'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block">Class Teacher</span>
                <span className="font-semibold text-indigo-700">{student.current_enrollment?.class_teacher_name || 'Not assigned'}</span>
              </div>
            </div>
          </div>

          {student.is_transferred_student && student.transfer_info && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> Previous School Transfer
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><span className="text-slate-400 block">Previous School</span><span className="font-semibold text-slate-800">{student.transfer_info.previous_school_name}</span></div>
                <div><span className="text-slate-400 block">Previous Class</span><span className="font-semibold text-slate-800">{student.transfer_info.previous_class}</span></div>
                <div><span className="text-slate-400 block">Previous Marks / Grade</span><span className="font-semibold text-slate-800">{student.transfer_info.previous_marks_or_grade}</span></div>
                <div><span className="text-slate-400 block">Transfer Reason</span><span className="font-semibold text-slate-800">{student.transfer_info.transfer_reason}</span></div>
              </div>
            </div>
          )}

          {/* Parent / Guardian Information */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Parent & Guardian Contact
            </h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block">Father Name</span>
                  <span className="font-semibold text-slate-800">{student.guardian?.father_name || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Mother Name</span>
                  <span className="font-semibold text-slate-800">{student.guardian?.mother_name || 'Not provided'}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block">Primary Phone</span>
                <span className="font-semibold text-slate-800 font-mono">{student.guardian?.primary_phone || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Parent Portal Login Email</span>
                <span className="font-semibold text-slate-800">{student.guardian?.email || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Residential Address</span>
                <span className="text-slate-700">{student.guardian?.address || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Enrolled Siblings Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
                <Users className="w-4 h-4" /> Enrolled Siblings ({siblings.length})
              </h3>
              {siblings.length > 0 && (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Family Linked
                </span>
              )}
            </div>

            {siblings.length > 0 ? (
              <div className="space-y-2.5">
                {siblings.map((sib) => (
                  <Link
                    key={sib.id}
                    href={`/admin/students/${sib.id}`}
                    className="p-3 bg-slate-50 hover:bg-indigo-50/70 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-2xs">
                        {sib.photo_url ? (
                          <img src={sib.photo_url} alt={sib.first_name} className="w-full h-full object-cover" />
                        ) : (
                          sib.first_name?.[0] || 'S'
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-xs">
                            {sib.first_name} {sib.last_name}
                          </span>
                          <span className="font-mono text-[10px] bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            {sib.registration_number}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {sib.current_enrollment?.class_name || 'Class'} {sib.current_enrollment?.section_name ? `(${sib.current_enrollment.section_name})` : ''} • Roll: {sib.current_enrollment?.roll_number || '—'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      View →
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-3 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                No enrolled siblings linked
              </div>
            )}
          </div>

          {/* Transport & Access Quick Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
              <Bus className="w-4 h-4" /> Transport & Security Status
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">School Transport Status</span>
                <span className="font-semibold text-slate-800">
                  {transportAssignment ? `${transportAssignment.vehicle_name} (${transportAssignment.route_name})` : 'Self Transport / Walker'}
                </span>
              </div>
              {transportAssignment && (
                <div>
                  <span className="text-slate-400 block">Pickup Stop & Time</span>
                  <span className="font-semibold text-slate-800">
                    {transportAssignment.stop_name} • {transportAssignment.estimated_pickup_time || '07:20 AM'}
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block">Student Portal Login</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold mt-1">
                  <ShieldCheck className="w-4 h-4" /> Enabled (School Code: {currentSchool?.code || 'JDPS0123Q'} / Registration ID: {student.registration_number})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* TAB 2: ATTENDANCE (Comprehensive Daily marked_at & Calendar History) */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* 1. TODAY'S ATTENDANCE CARD */}
          <div className="bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 p-6 rounded-2xl border border-indigo-100 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">
                  TODAY'S ATTENDANCE STATUS
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  {formatDate(todayDateStr)}
                </h3>
              </div>

              {/* Status Display */}
              <div className="flex items-center gap-3">
                {activeLeave ? (
                  <div className="px-4 py-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-2">
                    <Palmtree className="w-4 h-4 text-amber-600" />
                    <span>Approved Leave ({formatDate(activeLeave.start_date)} - {formatDate(activeLeave.end_date)})</span>
                  </div>
                ) : isTodayHoliday ? (
                  <div className="px-4 py-2 rounded-xl bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold flex items-center gap-2">
                    <Palmtree className="w-4 h-4 text-purple-600" />
                    <span>School Holiday</span>
                  </div>
                ) : todayRecord?.status === 'present' ? (
                  <div className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Present in Class</span>
                  </div>
                ) : todayRecord?.status === 'absent' ? (
                  <div className="px-4 py-2 rounded-xl bg-rose-100 text-rose-900 border border-rose-200 text-xs font-bold flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Marked Absent</span>
                  </div>
                ) : (
                  <div className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                    Attendance Not Taken Yet
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Marking Metadata */}
            <div className="mt-4 pt-4 border-t border-indigo-50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block">Class / Section</span>
                <span className="font-semibold text-slate-800">
                  {student.current_enrollment?.class_name || 'Not assigned'}
                  {student.current_enrollment?.section_name ? ` • Section ${student.current_enrollment.section_name}` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Attendance Marked At</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {todayRecord?.marked_at ? new Date(todayRecord.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not recorded'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Marked By Teacher</span>
                <span className="font-semibold text-slate-800">
                  {todayRecord?.marked_by_name || 'Not recorded'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Remarks</span>
                <span className="text-slate-700">
                  {todayRecord?.remarks || 'Not recorded'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. SUMMARY METRICS */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block">Working Days</span>
              <span className="text-xl font-bold text-slate-900 mt-1">{totalMarked}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
              <span className="text-[11px] font-semibold text-emerald-700 block">Present</span>
              <span className="text-xl font-bold text-emerald-800 mt-1">{presentCount}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
              <span className="text-[11px] font-semibold text-rose-700 block">Absent</span>
              <span className="text-xl font-bold text-rose-800 mt-1">{absentCount}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
              <span className="text-[11px] font-semibold text-amber-700 block">Approved Leave</span>
              <span className="text-xl font-bold text-amber-800 mt-1">{leaveCount}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
              <span className="text-[11px] font-semibold text-indigo-700 block">Partial</span>
              <span className="text-xl font-bold text-indigo-800 mt-1">{partialCount}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block">Attendance Rate</span>
              <span className="text-xl font-bold text-indigo-600 mt-1">
                {attendanceRate == null ? 'No data' : formatPercentage(attendanceRate)}
              </span>
            </div>
          </div>

          {/* 3. ATTENDANCE FOLLOW-UPS & PARENT COMMUNICATIONS */}
          {studentFollowUps.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Attendance Follow-ups & Parent Communication History ({studentFollowUps.length})
                  </h4>
                </div>
              </div>

              <div className="space-y-2">
                {studentFollowUps.map((fu) => (
                  <div key={fu.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 capitalize">
                        {fu.contact_method} Contact with {fu.contacted_person_name || 'Parent'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{formatDate(fu.created_at)}</span>
                    </div>
                    <p className="text-slate-700 italic">&ldquo;{fu.note}&rdquo;</p>
                    <div className="text-[10px] text-slate-500 flex justify-between pt-1">
                      <span>Logged by: <strong>{fu.created_by_name || 'Faculty'}</strong></span>
                      {fu.next_follow_up_at && (
                        <span>Next Check-in: <strong>{formatDate(fu.next_follow_up_at)}</strong></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. RANGE FILTER & DETAILED ATTENDANCE LOG */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="text-sm font-bold text-slate-900">Attendance History & Daily Logs</h4>
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
                {(['month', 'three_months', 'year'] as const).map((rng) => (
                  <button
                    key={rng}
                    onClick={() => setAttendanceRange(rng)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      attendanceRange === rng ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {rng === 'month' ? 'This Month' : rng === 'three_months' ? 'Last 3 Months' : 'Academic Year'}
                  </button>
                ))}
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Marked At</th>
                    <th className="py-2.5 px-3">Marked By</th>
                    <th className="py-2.5 px-3">Remarks</th>
                    <th className="py-2.5 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {attendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-semibold">{formatDate(rec.attendance_date)}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rec.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.status === 'absent'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rec.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {rec.marked_at ? new Date(rec.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not recorded'}
                      </td>
                      <td className="py-2.5 px-3">{rec.marked_by_name || 'Not recorded'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{rec.remarks || '—'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedDayDetail(rec)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACADEMICS & STUDENT GROWTH */}
      {activeTab === 'academics' && (
        <div className="space-y-6">
          {/* Academic Growth Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Academic Performance & Growth</h4>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                Overall: {academicAverage == null ? 'No results' : formatPercentage(academicAverage)}
              </span>
            </div>

            {/* Growth Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-400 block">Current Academic Average</span>
                <span className="text-2xl font-extrabold text-indigo-700 mt-1 block">
                  {academicAverage == null ? 'No data' : formatPercentage(academicAverage)}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">Calculated from published results only</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-400 block">Published Results</span>
                <span className="text-2xl font-extrabold text-slate-700 mt-1 block">{results.length}</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Real examination records for this student</span>
              </div>
            </div>
          </div>

          {/* Published Exam Results Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Published Examination Records</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Exam Name</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-center">Marks Obtained</th>
                    <th className="py-2.5 px-3 text-center">Max Marks</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {results.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 px-3 text-center text-slate-500">
                        No published exam results for this student.
                      </td>
                    </tr>
                  )}
                  {results.map(({ exam, result }) => (
                    <tr key={result.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{exam.name}</td>
                      <td className="py-2.5 px-3">{exam.subject_name || 'Not specified'}</td>
                      <td className="py-2.5 px-3">{formatDate(exam.exam_date)}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">{result.marks_obtained}</td>
                      <td className="py-2.5 px-3 text-center">{exam.max_marks}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {result.absent ? 'ABSENT' : exam.passing_marks != null && (result.marks_obtained || 0) < exam.passing_marks ? 'NOT PASSED' : 'PASSED'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{result.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FEES, CHARGES & RECEIPTS */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          {/* Fee Overview KPI Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Student Fee Account & Balance</h4>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setIsAddChargeModalOpen(true)}
                >
                  Add Charge
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<IndianRupee className="w-4 h-4" />}
                  onClick={() => handleOpenComprehensivePayment()}
                >
                  Record Payment
                </Button>
              </div>
            </div>

            {/* Financial Totals */}
            {(() => {
              const pendingTuition = invoices.reduce((sum, i) => sum + (i.remaining_amount || 0), 0);
              const pendingExtra = charges
                .filter((c) => c.status === 'pending' || c.status === 'partial')
                .reduce((sum, c) => sum + c.remaining_amount, 0);
              const netBalance = pendingTuition + pendingExtra;
              const totalInvoiced = invoices.reduce((sum, i) => sum + i.final_amount, 0);
              const totalCharges = charges.reduce((sum, c) => sum + c.amount, 0);
              const totalPaid = invoices.reduce((sum, i) => sum + i.paid_amount, 0) +
                charges.reduce((sum, c) => sum + c.paid_amount, 0);

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200">
                    <span className="text-[11px] font-semibold text-indigo-700 block uppercase tracking-wider">Current Balance Due</span>
                    <span className="text-2xl font-extrabold text-indigo-950 mt-1 block">
                      {formatCurrency(netBalance)}
                    </span>
                    <span className="text-[11px] text-indigo-600 block mt-0.5">
                      {netBalance === 0 ? '✓ All fees cleared' : `${invoices.filter((i) => i.status !== 'paid').length} invoices & ${charges.filter((c) => c.status === 'pending').length} charges`}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Total Monthly Fees</span>
                    <span className="text-xl font-bold text-slate-900 mt-1 block">{formatCurrency(totalInvoiced)}</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{invoices.length} billing cycles</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Extra Charges</span>
                    <span className="text-xl font-bold text-slate-900 mt-1 block">{formatCurrency(totalCharges)}</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{charges.length} extra items</span>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                    <span className="text-[11px] font-semibold text-emerald-700 block uppercase tracking-wider">Total Collected</span>
                    <span className="text-xl font-bold text-emerald-700 mt-1 block">{formatCurrency(totalPaid)}</span>
                    <span className="text-[11px] text-emerald-800 font-semibold block mt-0.5">{receipts.filter((r) => !r.is_reversed).length} valid receipts</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 1. MONTHLY TUITION INVOICES */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Monthly Fees & Invoices
              </h4>
              <span className="text-xs text-slate-400">{invoices.length} Invoices</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Invoice Particulars</th>
                    <th className="py-2.5 px-3">Billing Month</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">No tuition invoices issued.</td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{inv.fee_structure_name || inv.id}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{inv.billing_month}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{formatDate(inv.due_date)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{formatCurrency(inv.final_amount)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{formatCurrency(inv.paid_amount)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                          {formatCurrency(inv.remaining_amount || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <InvoiceStatusBadge status={inv.status} />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {inv.status !== 'paid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenComprehensivePayment(inv.id)}
                            >
                              Collect Fee
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. EXTRA STUDENT CHARGES & FINES */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-600" /> Extra Student Charges & Fines
                </h4>
              </div>

              <Button
                size="sm"
                variant="outline"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsAddChargeModalOpen(true)}
              >
                Add Charge
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Charge Name</th>
                    <th className="py-2.5 px-3">Charge Date</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {charges.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">No extra charges recorded for this student.</td>
                    </tr>
                  ) : (
                    charges.map((chg) => (
                      <tr key={chg.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {chg.charge_name}
                          {chg.description && <span className="block text-[10px] text-slate-400 font-normal">{chg.description}</span>}
                          {chg.waive_reason && <span className="block text-[10px] text-rose-500 font-medium">Reason: {chg.waive_reason}</span>}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{formatDate(chg.charge_date)}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{chg.due_date ? formatDate(chg.due_date) : '—'}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{formatCurrency(chg.amount)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{formatCurrency(chg.paid_amount)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-800">{formatCurrency(chg.remaining_amount)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              chg.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : chg.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : chg.status === 'waived'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {chg.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {chg.status === 'pending' && (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleWaiveCharge(chg.id, 'waived')}
                                className="px-2 py-1 text-[11px] text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100"
                              >
                                Waive
                              </button>
                              <button
                                onClick={() => handleWaiveCharge(chg.id, 'cancelled')}
                                className="px-2 py-1 text-[11px] text-slate-500 hover:text-rose-600 rounded hover:bg-slate-100"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. PAYMENT HISTORY & OFFICIAL FEE RECEIPTS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" /> Payment History & Official Fee Receipts (1/4 A4)
              </h4>
              <span className="text-xs text-slate-400 font-semibold">{receipts.length} Receipts</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Receipt Number</th>
                    <th className="py-2.5 px-3">Payment Date</th>
                    <th className="py-2.5 px-3">Payment Method</th>
                    <th className="py-2.5 px-3 text-right">Amount Paid</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                    <th className="py-2.5 px-3">Received By</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {receipts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">No payment receipts issued yet.</td>
                    </tr>
                  ) : (
                    receipts.map((rcp) => (
                      <tr key={rcp.id} className={`hover:bg-slate-50/60 transition-colors ${rcp.is_reversed ? 'bg-rose-50/30' : ''}`}>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {rcp.receipt_number}
                          {rcp.is_reversed && (
                            <span className="block text-[10px] text-rose-600 font-sans font-semibold">
                              VOID ({rcp.reversal_reason})
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {formatDate(rcp.payment_date)} {rcp.payment_time && <span className="text-[10px] text-slate-400">({rcp.payment_time})</span>}
                        </td>
                        <td className="py-2.5 px-3 capitalize text-slate-700">
                          {rcp.payment_method}
                          {rcp.reference_number && <span className="block text-[10px] font-mono text-slate-400">Ref: {rcp.reference_number}</span>}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatCurrency(rcp.amount_paid)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatCurrency(rcp.balance_after_payment)}</td>
                        <td className="py-2.5 px-3 text-slate-700">{rcp.received_by_name_snapshot}</td>
                        <td className="py-2.5 px-3 text-center">
                          {rcp.is_reversed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              REVERSED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              VALID
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={<Printer className="w-3.5 h-3.5" />}
                              onClick={() => setActiveReceiptForModal(rcp)}
                            >
                              Print / View
                            </Button>

                            {!rcp.is_reversed && (
                              <button
                                onClick={() => {
                                  setPaymentToReverse({
                                    paymentId: rcp.payment_id,
                                    receiptId: rcp.id,
                                    receiptNumber: rcp.receipt_number,
                                    amount: rcp.amount_paid,
                                  });
                                  setReversalReason('');
                                  setIsReversePaymentModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                                title="Reverse Payment (Correction)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
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

      {/* TAB 5: TRANSPORT */}
      {activeTab === 'transport' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bus className="w-4 h-4 text-indigo-600" /> Student Transport Details
            </h4>
            <Button size="sm" variant="outline" onClick={() => setIsEditModalOpen(true)}>
              Change Transport Assignment
            </Button>
          </div>

          {transportAssignment ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Assigned Route & Vehicle
                </span>
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400 block">Vehicle Name & Number</span>
                    <strong className="text-slate-800 text-sm">
                      {transportAssignment.vehicle_name} ({transportAssignment.vehicle_number})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Assigned Route</span>
                    <strong className="text-slate-800">{transportAssignment.route_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Pickup Stop</span>
                    <strong className="text-slate-800">{transportAssignment.stop_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Estimated Morning Pickup</span>
                    <strong className="text-indigo-600 font-mono">
                      {transportAssignment.estimated_pickup_time || 'Not scheduled'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Today's Real-time Pickup Status */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">
                  Today's Live Pickup Log
                </span>
                {todayTransportEvent ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          todayTransportEvent.event_type === 'picked_up'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {todayTransportEvent.event_type.toUpperCase()}
                      </span>
                      <span className="text-slate-500 font-mono">
                        {new Date(todayTransportEvent.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700">
                      Recorded by: <strong>{todayTransportEvent.recorded_by_name || 'Not recorded'}</strong>
                    </p>
                    {todayTransportEvent.notes && (
                      <p className="text-slate-500 italic">Note: {todayTransportEvent.notes}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500">Morning pickup run pending for today.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Bus className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>This student is not enrolled in school bus/van transport.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: LEAVE */}
      {activeTab === 'leave' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Leave History</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">{allLeaves.length} Total Requests</span>
              <Button
                type="button"
                size="sm"
                variant="primary"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsGrantLeaveModalOpen(true)}
              >
                Grant Leave
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Date Range</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {allLeaves.map((lv) => (
                  <tr key={lv.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-semibold">
                      {formatDate(lv.start_date)} – {formatDate(lv.end_date)}
                    </td>
                    <td className="py-2.5 px-3 capitalize">{lv.leave_type.replace('_', ' ')}</td>
                    <td className="py-2.5 px-3">{lv.reason}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {lv.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isGrantLeaveModalOpen}
        onClose={() => setIsGrantLeaveModalOpen(false)}
        title="Grant Student Leave"
        description={student ? `Approve leave for ${student.first_name} ${student.last_name}` : undefined}
      >
        <form onSubmit={handleGrantLeaveSubmit} className="space-y-4 text-xs text-left">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Leave Type</label>
            <select
              value={grantLeaveForm.leaveType}
              onChange={(e) => setGrantLeaveForm({ ...grantLeaveForm, leaveType: e.target.value as LeaveType })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium"
            >
              <option value="full_day">Full Day Leave</option>
              <option value="partial_day">Partial / Half Day Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DateInput
              label="Start Date"
              required
              value={grantLeaveForm.startDate}
              onChange={(e) => {
                const startDate = e.target.value;
                setGrantLeaveForm({
                  ...grantLeaveForm,
                  startDate,
                  endDate: grantLeaveForm.endDate < startDate ? startDate : grantLeaveForm.endDate,
                });
              }}
            />
            <DateInput
              label="End Date"
              required
              min={grantLeaveForm.startDate}
              value={grantLeaveForm.endDate}
              onChange={(e) => setGrantLeaveForm({ ...grantLeaveForm, endDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason</label>
            <input
              required
              value={grantLeaveForm.reason}
              onChange={(e) => setGrantLeaveForm({ ...grantLeaveForm, reason: e.target.value })}
              placeholder="e.g. Medical leave, family function"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsGrantLeaveModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isGrantingLeave}>
              Grant & Approve Leave
            </Button>
          </div>
        </form>
      </Modal>

      {/* TAB: EMERGENCY & MEDICAL INFORMATION */}
      {activeTab === 'emergency' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-left">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Student Emergency & Medical Profile</h4>
          </div>

          <form onSubmit={handleSaveEmergencyInfo} className="space-y-4 max-w-3xl text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={emergencyForm.blood_group}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, blood_group: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold text-indigo-700"
                >
                  <option value="">Not specified</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Doctor / Clinic Contact</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Malhotra (Patna Hospital - 9811122233)"
                  value={emergencyForm.doctor_clinic_contact || ''}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, doctor_clinic_contact: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Critical Allergies / Safety Alerts (Visible to Teachers)
              </label>
              <input
                type="text"
                placeholder="e.g. Severe peanut allergy (carries EpiPen in school bag)"
                value={emergencyForm.allergies_alert || ''}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, allergies_alert: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-rose-300 bg-rose-50/20 text-xs font-semibold text-rose-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Medical Condition / Medication Notes</label>
              <textarea
                rows={3}
                placeholder="e.g. Mild asthma inhaler before physical sports; requires hydration break..."
                value={emergencyForm.medical_condition_note || ''}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, medical_condition_note: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={emergencyForm.emergency_contact_name || ''}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, emergency_contact_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Father / Uncle / Mother"
                  value={emergencyForm.emergency_contact_relationship || ''}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, emergency_contact_relationship: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  placeholder="9876543210"
                  value={emergencyForm.emergency_contact_phone || ''}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, emergency_contact_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>

            {/* Least-Privilege Role Visibility Toggles */}
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
              <span className="text-xs font-bold text-indigo-900 block uppercase tracking-wider">
                Least-Privilege Role Visibility Permissions
              </span>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emergencyForm.visible_to_teachers ?? true}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, visible_to_teachers: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Visible to Assigned Class & Subject Teachers (Safety relevant alerts)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emergencyForm.visible_to_transport ?? false}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, visible_to_transport: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Visible to Transport & Bus Driver (e.g. Inhaler / Severe Allergy badge on Stop List)</span>
              </label>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button type="submit" variant="primary" size="sm" isLoading={isSavingEmergency}>
                Save Emergency Profile
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 7: ACCOUNT ACCESS */}
      {activeTab === 'account' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Student Portal Credentials</h4>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3 max-w-md">
            <div>
              <span className="text-slate-400 block">School Organization Code</span>
              <strong className="font-mono text-slate-900 text-sm">{currentSchool?.code || 'JDPS0123Q'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Registration ID</span>
              <strong className="font-mono text-slate-900 text-sm">{student.registration_number}</strong>
            </div>
            <div className="pt-2">
              <Button size="sm" variant="primary" onClick={() => setIsResetPasswordOpen(true)}>
                Reset Student Password
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: AUDIT HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Audit Trail of Updates</h4>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex justify-between">
                <div>
                  <strong className="block text-slate-800 capitalize">{log.event_type.replace('_', ' ')}</strong>
                  <span className="text-slate-500">Performed by: {log.user_name || 'Administrator'}</span>
                </div>
                <span className="text-[11px] text-slate-400">{formatDate(log.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Student Profile: ${student.first_name} ${student.last_name}`}
        description="Update student information, parent contact, class enrollment, and transport assignment"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveStudentEdits} className="space-y-4 text-xs text-left max-h-[75vh] overflow-y-auto pr-1">
          {/* Photo Upload */}
            <PhotoUpload
              label="Student Photo"
              currentPhotoUrl={editForm.photoUrl}
              onPhotoChange={(url) => setEditForm((prev) => ({ ...prev, photoUrl: url || '' }))}
            />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: sanitizePersonName(e.target.value) })}
                placeholder="Letters only"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: sanitizePersonName(e.target.value) })}
                placeholder="Letters only"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Registration No *</label>
              <input
                type="text"
                required
                readOnly
                value={editForm.registrationNumber}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-100 text-xs font-mono"
              />
            </div>
            <div>
              <DateInput
                label="Date of Birth"
                value={editForm.dateOfBirth}
                onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                className="text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={editForm.gender}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Academic Placement */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-700 block">Class & Section Placement</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Class</label>
                <select
                  value={editForm.classId}
                  onChange={(e) => setEditForm({ ...editForm, classId: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Section</label>
                <select
                  value={editForm.sectionId}
                  onChange={(e) => setEditForm({ ...editForm, sectionId: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  {sections.filter((s) => s.class_id === editForm.classId).map((s) => (
                    <option key={s.id} value={s.id}>Section {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Roll Number</label>
                <input
                  type="text"
                  value={editForm.rollNumber}
                  onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Guardian Info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-700 block">Guardian & Contact</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Father Name</label>
                <input
                  type="text"
                  value={editForm.fatherName}
                  onChange={(e) => setEditForm({ ...editForm, fatherName: sanitizePersonName(e.target.value) })}
                  placeholder="Letters only"
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Mother Name</label>
                <input
                  type="text"
                  value={editForm.motherName}
                  onChange={(e) => setEditForm({ ...editForm, motherName: sanitizePersonName(e.target.value) })}
                  placeholder="Letters only"
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Primary Phone *</label>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  value={editForm.primaryPhone}
                  onChange={(e) => setEditForm({ ...editForm, primaryPhone: sanitizeIndianMobile(e.target.value) })}
                  placeholder="9876543210 (10 digits, starts with 6-9)"
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>
              <div>
                <GoogleEmailInput
                  label="Parent Email (Parent Portal Login)"
                  value={editForm.email}
                  onChange={(val) => setEditForm({ ...editForm, email: val })}
                  targetSchoolId={currentSchool?.id || student.school_id}
                  targetRole="parent"
                  excludeEmail={student.guardian?.email}
                  onValidationChange={(_, available, checking) => {
                    setIsParentEmailAvailable(available);
                    setIsParentEmailChecking(checking);
                  }}
                  placeholder="parent.name@gmail.com"
                  id="student-edit-parent-email-input"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500">Enter at least one: father, mother, or guardian name.</p>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Residential Address *</label>
              <textarea
                rows={2}
                required
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          {/* Transport Assignment */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-700 block">Transport Assignment</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Vehicle</label>
                <select
                  value={editForm.vehicleId}
                  onChange={(e) => setEditForm({ ...editForm, vehicleId: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="">None (Self Transport)</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.vehicle_name} ({v.vehicle_number})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Route & Stop</label>
                <select
                  value={editForm.stopId}
                  onChange={(e) => {
                    const foundRoute = routes.find((r) => r.stops?.some((st) => st.id === e.target.value));
                    setEditForm({ ...editForm, stopId: e.target.value, routeId: foundRoute?.id || editForm.routeId });
                  }}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="">Select Stop</option>
                  {routes.flatMap((r) =>
                    (r.stops || []).map((st) => (
                      <option key={st.id} value={st.id}>{r.route_name} → {st.stop_name} ({st.estimated_pickup_time})</option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isParentEmailChecking || (Boolean(editForm.email.trim()) && isParentEmailAvailable === false)}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* 1. FEE RECEIPT MODAL (1/4 A4 / A6 Preview & Print) */}
      {activeReceiptForModal && (
        <Modal
          isOpen={true}
          onClose={() => setActiveReceiptForModal(null)}
          title="Official School Fee Receipt"
          description={`Receipt ${activeReceiptForModal.receipt_number} • 1/4 A4 Print Size`}
          maxWidth="lg"
        >
          <div className="flex justify-center">
            <FeeReceipt
              receipt={activeReceiptForModal}
              onClose={() => setActiveReceiptForModal(null)}
              showActions={true}
            />
          </div>
        </Modal>
      )}

      {/* 2. ADD EXTRA CHARGE MODAL */}
      <Modal
        isOpen={isAddChargeModalOpen}
        onClose={() => setIsAddChargeModalOpen(false)}
        title="Add Extra Student Charge / Fine"
        description={`Assign additional fee to ${student.first_name} ${student.last_name} (${student.registration_number})`}
        maxWidth="lg"
      >
        <form onSubmit={handleAddChargeSubmit} className="space-y-4 text-xs text-left">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Charge Type *</label>
            <select
              value={newChargeForm.chargeName}
              onChange={(e) => setNewChargeForm({ ...newChargeForm, chargeName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
            >
              <option value="Exam Fee">Exam Fee (₹300)</option>
              <option value="Transport Fee">Transport Fee (Route Surcharge)</option>
              <option value="Late Fee">Late Fee Surcharge (₹100)</option>
              <option value="Library Fine">Library Fine (Overdue Books)</option>
              <option value="ID Card Replacement">ID Card Replacement (₹150)</option>
              <option value="Lab Fee">Science / Computer Lab Fee (₹250)</option>
              <option value="Activity Fee">Sports & Activity Fee</option>
              <option value="Uniform Charge">School Uniform & Badge</option>
              <option value="Book Charge">Books & Study Material</option>
              <option value="Damage Charge">Campus Property Damage</option>
              <option value="Other">Other / Custom Charge</option>
            </select>
          </div>

          {newChargeForm.chargeName === 'Other' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Custom Charge Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Annual Sports Day Kit"
                value={newChargeForm.customName}
                onChange={(e) => setNewChargeForm({ ...newChargeForm, customName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                min={1}
                value={newChargeForm.amount}
                onChange={(e) => setNewChargeForm({ ...newChargeForm, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
              />
            </div>

            <div>
              <DateInput
                label="Due Date (Optional)"
                value={newChargeForm.dueDate}
                onChange={(e) => setNewChargeForm({ ...newChargeForm, dueDate: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Broken laboratory glassware replacement fine"
              value={newChargeForm.description}
              onChange={(e) => setNewChargeForm({ ...newChargeForm, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddChargeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Add Charge
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. MULTI-ITEM COMPREHENSIVE PAYMENT MODAL */}
      <Modal
        isOpen={isComprehensivePaymentModalOpen}
        onClose={() => setIsComprehensivePaymentModalOpen(false)}
        title="Record Fee Payment & Generate Receipt"
        description={`Collecting fee from ${student.first_name} ${student.last_name} (${student.registration_number})`}
        maxWidth="lg"
      >
        <form onSubmit={handleComprehensivePaymentSubmit} className="space-y-4 text-xs text-left max-h-[75vh] overflow-y-auto pr-1">
          {/* Outstanding Items Selector */}
          <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block">Select Items Covered by this Payment:</span>

            {/* Tuition Invoice Option */}
            {invoices.filter((i) => i.status !== 'paid').map((inv) => (
              <label
                key={inv.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-indigo-50/40"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={paymentSelection.includeInvoice && paymentSelection.invoiceId === inv.id}
                    onChange={(e) => {
                      const willInclude = e.target.checked;
                      setPaymentSelection((prev) => {
                        const invDue = willInclude ? (inv.remaining_amount || inv.final_amount) : 0;
                        const chgDue = charges
                          .filter((c) => prev.selectedChargeIds.includes(c.id))
                          .reduce((s, c) => s + c.remaining_amount, 0);
                        const net = Math.max(0, invDue + chgDue - (prev.discountAmount || 0));
                        return {
                          ...prev,
                          includeInvoice: willInclude,
                          invoiceId: willInclude ? inv.id : undefined,
                          amountToPay: net,
                        };
                      });
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">{inv.fee_structure_name || 'Monthly Tuition'}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Billing: {inv.billing_month}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrency(inv.remaining_amount || inv.final_amount)}
                </span>
              </label>
            ))}

            {/* Extra Charges Options */}
            {charges.filter((c) => c.status === 'pending' || c.status === 'partial').map((chg) => (
              <label
                key={chg.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-indigo-50/40"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={paymentSelection.selectedChargeIds.includes(chg.id)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const nextIds = checked
                        ? [...paymentSelection.selectedChargeIds, chg.id]
                        : paymentSelection.selectedChargeIds.filter((id) => id !== chg.id);

                      const inv = invoices.find((i) => i.id === paymentSelection.invoiceId);
                      const invDue = (paymentSelection.includeInvoice && inv) ? (inv.remaining_amount || inv.final_amount) : 0;
                      const chgDue = charges
                        .filter((c) => nextIds.includes(c.id))
                        .reduce((s, c) => s + c.remaining_amount, 0);
                      const net = Math.max(0, invDue + chgDue - (paymentSelection.discountAmount || 0));

                      setPaymentSelection({
                        ...paymentSelection,
                        selectedChargeIds: nextIds,
                        amountToPay: net,
                      });
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">{chg.charge_name}</span>
                    <span className="text-[10px] text-slate-400">Assigned: {formatDate(chg.charge_date)}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrency(chg.remaining_amount)}
                </span>
              </label>
            ))}
          </div>

          {/* Discount / Concession Field */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Discount / Concession (₹)</label>
              <input
                type="number"
                min={0}
                value={paymentSelection.discountAmount}
                onChange={(e) => {
                  const disc = Number(e.target.value);
                  const inv = invoices.find((i) => i.id === paymentSelection.invoiceId);
                  const invDue = (paymentSelection.includeInvoice && inv) ? (inv.remaining_amount || inv.final_amount) : 0;
                  const chgDue = charges
                    .filter((c) => paymentSelection.selectedChargeIds.includes(c.id))
                    .reduce((s, c) => s + c.remaining_amount, 0);
                  const net = Math.max(0, invDue + chgDue - disc);
                  setPaymentSelection({ ...paymentSelection, discountAmount: disc, amountToPay: net });
                }}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Concession Reason</label>
              <input
                type="text"
                placeholder="e.g. Merit Concession / Sibling Discount"
                value={paymentSelection.discountReason}
                onChange={(e) => setPaymentSelection({ ...paymentSelection, discountReason: e.target.value })}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          {/* Payment Method & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount to Collect (₹) *</label>
              <input
                type="number"
                required
                min={1}
                value={paymentSelection.amountToPay}
                onChange={(e) => setPaymentSelection({ ...paymentSelection, amountToPay: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-extrabold text-indigo-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
              <select
                value={paymentSelection.paymentMethod}
                onChange={(e) => setPaymentSelection({ ...paymentSelection, paymentMethod: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI / QR Code</option>
                <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {paymentSelection.paymentMethod !== 'cash' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction / Reference Number</label>
              <input
                type="text"
                placeholder="e.g. UPI Ref, UTR No., or Cheque No."
                value={paymentSelection.referenceNumber}
                onChange={(e) => setPaymentSelection({ ...paymentSelection, referenceNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Receipt Notes</label>
            <input
              type="text"
              placeholder="e.g. Collected at school accounts desk"
              value={paymentSelection.notes}
              onChange={(e) => setPaymentSelection({ ...paymentSelection, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsComprehensivePaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm & Generate Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. REVERSE PAYMENT MODAL */}
      {isReversePaymentModalOpen && paymentToReverse && (
        <Modal
          isOpen={true}
          onClose={() => setIsReversePaymentModalOpen(false)}
          title={`Reverse Payment & Void Receipt: ${paymentToReverse.receiptNumber}`}
          description={`Amount: ${formatCurrency(paymentToReverse.amount)}`}
        >
          <form onSubmit={handleReversePaymentSubmit} className="space-y-4 text-xs text-left">
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Controlled Financial Correction
              </span>
              <p className="text-[11px]">
                Reversing this payment will mark Receipt {paymentToReverse.receiptNumber} as <strong>VOID / REVERSED</strong> in school history. The paid amounts will be returned to the student&apos;s pending balance.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mandatory Reversal Reason *
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Incorrect amount entered by cashier / Cheque bounced / Entry error"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsReversePaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                isLoading={isSubmittingReversal}
              >
                Confirm Reversal (Void Receipt)
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* RESET PASSWORD MODAL */}
      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
        schoolId={student.school_id}
        targetRole="student"
        targetId={student.id}
        targetName={`${student.first_name} ${student.last_name}`}
        targetLoginId={student.registration_number}
      />

      {/* DAY DETAIL POPUP MODAL */}
      {selectedDayDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDayDetail(null)}
          title={`Attendance Details: ${formatDate(selectedDayDetail.attendance_date)}`}
          description="Detailed breakdown of recorded attendance"
        >
          <div className="space-y-3 text-xs text-slate-700 text-left">
            <div className="flex justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-600">Status</span>
              <span className="font-bold text-emerald-700 capitalize">{selectedDayDetail.status}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-600">Attendance Marked At</span>
              <span className="font-mono font-semibold">
                {selectedDayDetail.marked_at ? new Date(selectedDayDetail.marked_at).toLocaleTimeString() : 'Not recorded'}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-600">Marked By Faculty</span>
              <span className="font-semibold">{selectedDayDetail.marked_by_name || 'Not recorded'}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-semibold text-slate-600">Remarks</span>
              <span>{selectedDayDetail.remarks || 'Not recorded'}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
