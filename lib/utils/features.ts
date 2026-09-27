// ============================================================================
// School ERP Modular Feature Catalog & Permission Utilities
// ============================================================================

import { School, SchoolFeatureKey, SchoolFeatureDefinition, SchoolFeatureCategory } from '@/lib/types';

export const ALL_SCHOOL_FEATURE_KEYS: SchoolFeatureKey[] = [
  'students',
  'teachers',
  'staff',
  'attendance',
  'teacher_attendance',
  'timetable',
  'academics',
  'fees',
  'payroll',
  'exams',
  'transport',
  'reception',
  'notices',
  'parent_portal',
  'recycle_bin',
  'security_logs',
];

export const SCHOOL_FEATURE_CATALOG: SchoolFeatureDefinition[] = [
  // 1. Core People & Operations
  {
    key: 'students',
    name: 'Student Admissions & Directory',
    category: 'core',
    description: 'Student enrollment registers, admission files, roll numbers, guardian profiles and academic records.',
    defaultEnabled: true,
  },
  {
    key: 'teachers',
    name: 'Teacher & Faculty Management',
    category: 'core',
    description: 'Faculty directory, employee numbers, subject specializations and class teacher assignments.',
    defaultEnabled: true,
  },
  {
    key: 'staff',
    name: 'Staff & Support Staff HR',
    category: 'core',
    description: 'Administrative staff, accountants, lab assistants, security and driver staff directory.',
    defaultEnabled: true,
  },

  // 2. Attendance & Academics
  {
    key: 'attendance',
    name: 'Student Attendance & Leaves',
    category: 'academics',
    description: 'Daily 1-tap roll call, real-time morning/afternoon registers and parent leave request workflow.',
    defaultEnabled: true,
  },
  {
    key: 'teacher_attendance',
    name: 'Teacher & Staff Attendance',
    category: 'operations',
    description: 'Faculty attendance logs, staff leave approvals and teacher presence registers.',
    defaultEnabled: true,
  },
  {
    key: 'academics',
    name: 'Classes, Rooms & Subjects',
    category: 'academics',
    description: 'Class hierarchy, sections, classrooms, laboratory allocation and subject curriculum management.',
    defaultEnabled: true,
  },
  {
    key: 'timetable',
    name: 'Class Timetable & Schedule',
    category: 'academics',
    description: 'Weekly timetable builder, period schedules, lunch/games intervals and holiday calendar.',
    defaultEnabled: true,
  },
  {
    key: 'exams',
    name: 'Exams, Marks & Report Cards',
    category: 'academics',
    description: 'Examination scheduling, subject mark entry, grading schemes and printable student report cards.',
    defaultEnabled: true,
  },

  // 3. Finance & Payroll
  {
    key: 'fees',
    name: 'Student Fees & Collections',
    category: 'finance',
    description: 'Custom fee structures, monthly billing, discount rules, collection tracking and 1/4 A4 fee receipts.',
    defaultEnabled: true,
  },
  {
    key: 'payroll',
    name: 'Employee Payroll & Salaries',
    category: 'finance',
    description: 'Faculty salary contracts, monthly disbursement records and downloadable pay statements.',
    defaultEnabled: true,
  },

  // 4. Operations & Transport
  {
    key: 'transport',
    name: 'Transport Fleet & Driver Portal',
    category: 'operations',
    description: 'Bus vehicles, stop routes, student pickup rosters and dedicated driver navigation portal.',
    defaultEnabled: true,
  },
  {
    key: 'reception',
    name: 'Reception & Visitor Logbook',
    category: 'operations',
    description: 'Front desk visitor passes, guest logbook, campus entries and admission enquiries.',
    defaultEnabled: true,
  },
  {
    key: 'notices',
    name: 'Notice Board & Circulars',
    category: 'operations',
    description: 'School-wide circulars, urgent announcements, event broadcasts and holiday alerts.',
    defaultEnabled: true,
  },
  {
    key: 'parent_portal',
    name: 'Parent Portal & Family Access',
    category: 'operations',
    description: 'Dedicated portal for parents to view student fee dues, attendance and report cards.',
    defaultEnabled: true,
  },

  // 5. Governance & Security
  {
    key: 'recycle_bin',
    name: '30-Day Recycle Bin & Recovery',
    category: 'governance',
    description: 'Soft-deletion safety net with 30-day restore center for students, teachers and invoices.',
    defaultEnabled: true,
  },
  {
    key: 'security_logs',
    name: 'Security Logs & Audit Trail',
    category: 'governance',
    description: 'Authentication history, IP logs, platform security events and PIN lock monitors.',
    defaultEnabled: true,
  },
];

export const DEFAULT_SCHOOL_FEATURES: SchoolFeatureKey[] = SCHOOL_FEATURE_CATALOG.map((f) => f.key);

export const FEATURE_CATEGORIES: { id: SchoolFeatureCategory; label: string; description: string }[] = [
  { id: 'core', label: 'Core People & HR', description: 'Students, teachers, and staff management' },
  { id: 'academics', label: 'Academics & Curricula', description: 'Classes, timetable, attendance, exams, and holidays' },
  { id: 'finance', label: 'Finance & Invoicing', description: 'Fee receipts, collections, and payroll' },
  { id: 'operations', label: 'Operations & Fleet', description: 'Transport, reception, notice boards, and parent portal' },
  { id: 'governance', label: 'Governance & Security', description: 'Recycle bin, audit logs, and security controls' },
];

/**
 * Checks if a specific feature is enabled for a given school.
 * If enabled_features is not explicitly set (e.g. legacy school), returns true by default.
 */
export function isFeatureEnabled(
  school: School | null | undefined,
  featureKey: SchoolFeatureKey
): boolean {
  if (!school) return true;
  if (!school.enabled_features || !Array.isArray(school.enabled_features) || school.enabled_features.length === 0) {
    return true; // Default: all features enabled when not explicitly customized or empty
  }
  return school.enabled_features.includes(featureKey);
}

/**
 * Groups all features by category for display in checklist/settings.
 */
export function getFeaturesByCategory(): Record<SchoolFeatureCategory, SchoolFeatureDefinition[]> {
  const groups: Record<SchoolFeatureCategory, SchoolFeatureDefinition[]> = {
    core: [],
    academics: [],
    finance: [],
    operations: [],
    governance: [],
  };

  for (const feature of SCHOOL_FEATURE_CATALOG) {
    if (groups[feature.category]) {
      groups[feature.category].push(feature);
    }
  }

  return groups;
}
