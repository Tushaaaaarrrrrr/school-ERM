// ============================================================================
// Secure CSV Data Export Utilities
// ============================================================================

import { Student, Teacher, Staff, PaymentReceipt } from '@/lib/types';
import { authLogService } from '@/lib/services/api';

/**
 * Converts a list of records into standard UTF-8 CSV and triggers download.
 * Properly escapes quotes, commas, and line breaks.
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const escapeCell = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    // Spreadsheet applications can execute cells beginning with formula sigils.
    // Prefix untrusted formula-like values with an apostrophe before CSV escaping.
    const raw = String(val);
    const neutralized = /^[\t\r ]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
    const str = neutralized.replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((row) => row.map(escapeCell).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n'); // Include UTF-8 BOM for Excel compatibility

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Student CSV Exporter (Excludes passwords, tokens, internal security credentials)
 */
export function exportStudentsToCsv(
  students: Student[],
  actorName: string = 'School Admin',
  schoolId: string = 'sch-001',
  filterLabel: string = 'all'
) {
  const headers = [
    'Registration Number',
    'Student Full Name',
    'Class',
    'Section',
    'Roll Number',
    'Gender',
    'Date of Birth',
    'Joining Date',
    'Father Name',
    'Mother Name',
    'Primary Contact Phone',
    'Secondary Phone',
    'Guardian Email',
    'Residential Address',
    'Status',
    'Uses School Transport',
    'Transport Vehicle',
    'Pickup Stop',
    'Drop Stop',
  ];

  const rows = students.map((s) => [
    s.registration_number,
    `${s.first_name} ${s.last_name}`,
    s.current_enrollment?.class_name || '—',
    s.current_enrollment?.section_name || '—',
    s.current_enrollment?.roll_number || '—',
    s.gender || '—',
    s.date_of_birth || '—',
    s.joining_date || '—',
    s.guardian?.father_name || '—',
    s.guardian?.mother_name || '—',
    s.guardian?.primary_phone || '—',
    s.guardian?.secondary_phone || '—',
    s.guardian?.email || '—',
    s.guardian?.address || '—',
    s.status,
    s.transport_assignment?.pickup_enabled ? 'Yes' : 'No',
    s.transport_assignment?.vehicle_name || '—',
    s.transport_assignment?.stop_name || '—',
    s.transport_assignment?.drop_stop_name || s.transport_assignment?.stop_name || '—',
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `students_${filterLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${dateStr}.csv`;

  downloadCsv(filename, headers, rows);

  // Log audit event
  try {
    authLogService.logEvent({
      school_id: schoolId,
      user_name: actorName,
      event_type: 'csv_export_generated',
      success: true,
      role: 'school_admin',
      details: {
        action: 'student_export',
        record_count: students.length,
        filter_label: filterLabel,
        filename,
      },
    });
  } catch (err) {
    console.error('Failed to log student export event', err);
  }
}

/**
 * Teacher CSV Exporter
 */
export function exportTeachersToCsv(
  teachers: Teacher[],
  actorName: string = 'School Admin',
  schoolId: string = 'sch-001'
) {
  const headers = [
    'Employee Number',
    'Full Name',
    'Designation',
    'Phone Number',
    'Email Address',
    'Joining Date',
    'Assigned Subjects',
    'Assigned Classes',
    'Employment Status',
  ];

  const rows = teachers.map((t) => [
    t.employee_number,
    `${t.first_name} ${t.last_name}`,
    t.designation || 'Faculty Teacher',
    t.phone || '—',
    t.email || '—',
    t.joining_date || '—',
    (t.subjects || []).join('; ') || 'General',
    (t.assigned_classes || []).map((c) => `${c.class_name}${c.section_name ? ` (${c.section_name})` : ''}`).join('; ') || 'None',
    t.status,
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `teachers_${dateStr}.csv`;

  downloadCsv(filename, headers, rows);

  try {
    authLogService.logEvent({
      school_id: schoolId,
      user_name: actorName,
      event_type: 'csv_export_generated',
      success: true,
      role: 'school_admin',
      details: { action: 'teacher_export', record_count: teachers.length, filename },
    });
  } catch (err) {
    console.error('Failed to log teacher export', err);
  }
}

/**
 * Staff CSV Exporter
 */
export function exportStaffToCsv(
  staffList: Staff[],
  actorName: string = 'School Admin',
  schoolId: string = 'sch-001'
) {
  const headers = [
    'Employee Number',
    'Full Name',
    'Staff Type / Role',
    'Department',
    'Phone Number',
    'Email Address',
    'Joining Date',
    'Driving License',
    'License Expiry',
    'Portal Access Enabled',
    'Employment Status',
  ];

  const rows = staffList.map((s) => [
    s.employee_number,
    `${s.first_name} ${s.last_name}`,
    s.custom_type_name || s.staff_type.replace('_', ' ').toUpperCase(),
    s.department || 'Administration',
    s.phone || '—',
    s.email || '—',
    s.joining_date || '—',
    s.driving_license_number || '—',
    s.driving_license_expiry || '—',
    s.portal_access ? 'Yes' : 'No',
    s.status,
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `staff_${dateStr}.csv`;

  downloadCsv(filename, headers, rows);

  try {
    authLogService.logEvent({
      school_id: schoolId,
      user_name: actorName,
      event_type: 'csv_export_generated',
      success: true,
      role: 'school_admin',
      details: { action: 'staff_export', record_count: staffList.length, filename },
    });
  } catch (err) {
    console.error('Failed to log staff export', err);
  }
}

/**
 * Fee Collections CSV Exporter
 */
export function exportCollectionsToCsv(
  transactions: PaymentReceipt[],
  periodLabel: string = 'today',
  actorName: string = 'School Admin',
  schoolId: string = 'sch-001'
) {
  const headers = [
    'Receipt Number',
    'Student',
    'Registration Number',
    'Amount',
    'Payment Method',
    'Payment Date',
    'Payment Time',
    'Collected By',
    'Status',
    'Reference Number',
  ];

  const rows = transactions.map((t) => [
    t.receipt_number,
    t.student_name_snapshot,
    t.registration_number_snapshot,
    t.amount_paid,
    t.payment_method?.toUpperCase(),
    t.payment_date || t.created_at.split('T')[0],
    t.payment_time || '—',
    t.received_by_name_snapshot,
    t.is_reversed ? 'REVERSED' : 'SUCCESS',
    t.reference_number || '—',
  ]);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `fee_collections_${periodLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${dateStr}.csv`;

  downloadCsv(filename, headers, rows);

  try {
    authLogService.logEvent({
      school_id: schoolId,
      user_name: actorName,
      event_type: 'csv_export_generated',
      success: true,
      role: 'school_admin',
      details: { action: 'collections_export', record_count: transactions.length, periodLabel, filename },
    });
  } catch (err) {
    console.error('Failed to log collections export', err);
  }
}
