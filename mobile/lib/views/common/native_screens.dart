import '../../core/theme/app_theme.dart';
import 'native_list_view.dart';

MapEntry<String, String> _e(String k, String v) => MapEntry(k, v);

String _money(Rec m, List<String> keys) {
  final v = pick(m, keys);
  return v.isEmpty ? '' : '₹$v';
}

String _range(Rec m) {
  final a = shortDate(pick(m, ['start_date']));
  final b = shortDate(pick(m, ['end_date']));
  return a == b || b.isEmpty ? a : '$a → $b';
}

List<NativeAction> _leaveActions(String path, {bool withSchool = false}) => [
      NativeAction(
        label: 'Approve',
        color: AppColors.success,
        method: 'PUT',
        path: (_) => path,
        confirm: 'Approve this leave request?',
        visible: (r) => pick(r, ['status']) == 'pending',
        body: (r) => {
          'id': r['id'],
          if (withSchool) 'school_id': r['school_id'],
          'status': 'approved',
        },
      ),
      NativeAction(
        label: 'Reject',
        color: AppColors.danger,
        method: 'PUT',
        path: (_) => path,
        confirm: 'Reject this leave request?',
        visible: (r) => pick(r, ['status']) == 'pending',
        body: (r) => {
          'id': r['id'],
          if (withSchool) 'school_id': r['school_id'],
          'status': 'rejected',
          'rejection_reason': 'Rejected by administrator',
          'admin_notes': 'Rejected by administrator',
        },
      ),
    ];

List<MapEntry<String, String>> _person(Rec r) => [
      _e('Employee no.', pick(r, ['employee_number'])),
      _e('Designation', pick(r, ['designation', 'staff_type'])),
      _e('Phone', pick(r, ['phone'])),
      _e('Email', pick(r, ['email'])),
      _e('Joined', shortDate(pick(r, ['joining_date']))),
      _e('Salary', _money(r, ['monthly_salary', 'salary'])),
    ];

/// Every native "directory / requests / history" page, keyed by the website
/// route it replaces. Each reads the same API route the website page uses.
final Map<String, NativeListSpec> nativeScreens = {
  '/admin/teachers': NativeListSpec(
    title: 'Teachers',
    icon: 'teacher',
    path: '/api/teachers',
    heading: fullName,
    subtitle: (r) => [pick(r, ['designation']), pick(r, ['phone'])]
        .where((s) => s.isNotEmpty)
        .join(' • '),
    status: (r) => pick(r, ['status']),
    details: _person,
  ),
  '/admin/staff': NativeListSpec(
    title: 'Staff & Support',
    icon: 'teacher',
    path: '/api/staff',
    heading: fullName,
    subtitle: (r) => [pick(r, ['designation', 'staff_type']), pick(r, ['phone'])]
        .where((s) => s.isNotEmpty)
        .join(' • '),
    status: (r) => pick(r, ['status']),
    details: _person,
  ),
  '/admin/reception': NativeListSpec(
    title: 'Reception & Enquiries',
    icon: 'bell',
    path: '/api/enquiries',
    emptyText: 'No enquiries yet',
    heading: (r) => pick(r, ['student_name']),
    subtitle: (r) => [
      pick(r, ['parent_name']),
      pick(r, ['interested_class']),
      pick(r, ['primary_phone'])
    ].where((s) => s.isNotEmpty).join(' • '),
    status: (r) => pick(r, ['status']),
    details: (r) => [
      _e('Parent', pick(r, ['parent_name'])),
      _e('Phone', pick(r, ['primary_phone'])),
      _e('Alt. phone', pick(r, ['secondary_phone'])),
      _e('Email', pick(r, ['email'])),
      _e('Class', pick(r, ['interested_class'])),
      _e('Source', pick(r, ['source'])),
      _e('Assigned to', pick(r, ['assigned_to_name'])),
      _e('Next follow-up', shortDate(pick(r, ['next_follow_up_at']))),
      _e('Notes', pick(r, ['notes'])),
    ],
  ),
  '/admin/attendance/leaves': NativeListSpec(
    title: 'Student Leaves',
    icon: 'calendar',
    path: '/api/leaves/students',
    emptyText: 'No leave requests',
    heading: (r) => pick(r, ['student_name']),
    subtitle: (r) => '${pick(r, ['leave_type'])} • ${_range(r)}',
    status: (r) => pick(r, ['status']),
    actions: _leaveActions('/api/leaves/students'),
    details: (r) => [
      _e('Class', '${pick(r, ['class_name'])} ${pick(r, ['section_name'])}'.trim()),
      _e('Type', pick(r, ['leave_type'])),
      _e('Dates', _range(r)),
      _e('Reason', pick(r, ['reason'])),
      _e('Requested by', pick(r, ['requested_by_name'])),
      _e('Reviewed by', pick(r, ['approved_by_name'])),
      _e('Rejection reason', pick(r, ['rejection_reason'])),
    ],
  ),
  '/admin/teachers/attendance': NativeListSpec(
    title: 'Teacher Leaves',
    icon: 'attendance',
    path: '/api/leaves/teachers',
    emptyText: 'No leave requests',
    heading: (r) => pick(r, ['teacher_name']),
    subtitle: (r) => '${pick(r, ['leave_type'])} • ${_range(r)}',
    status: (r) => pick(r, ['status']),
    actions: _leaveActions('/api/leaves/teachers', withSchool: true),
    details: (r) => [
      _e('Employee no.', pick(r, ['employee_number'])),
      _e('Type', pick(r, ['leave_type'])),
      _e('Dates', _range(r)),
      _e('Return date', shortDate(pick(r, ['return_date']))),
      _e('Reason', pick(r, ['reason'])),
      _e('Admin notes', pick(r, ['admin_notes'])),
      _e('Reviewed by', pick(r, ['reviewed_by_name'])),
    ],
  ),
  '/admin/academics/holidays': NativeListSpec(
    title: 'School Holidays',
    icon: 'calendar',
    path: '/api/holidays',
    heading: (r) => pick(r, ['name']),
    subtitle: _range,
    details: (r) => [
      _e('Dates', _range(r)),
      _e('Reason', pick(r, ['reason'])),
      _e('Description', pick(r, ['description'])),
    ],
  ),
  '/admin/academics/classes': NativeListSpec(
    title: 'Classes & Sections',
    icon: 'graduation_cap',
    path: '/api/classes',
    heading: (r) => pick(r, ['name']),
    subtitle: (r) => 'Class teacher: ${pick(r, ['class_teacher_name'], 'Not assigned')}',
    status: (r) => pick(r, ['status']),
    trailing: (r) => _money(r, ['common_monthly_fee']),
    details: (r) => [
      _e('Class teacher', pick(r, ['class_teacher_name'])),
      _e('Room', pick(r, ['room_name', 'default_room_number'])),
      _e('Monthly fee', _money(r, ['common_monthly_fee'])),
      _e('Fee due day', pick(r, ['monthly_fee_due_day'])),
      _e('Promotes to', pick(r, ['next_class_name'])),
    ],
  ),
  '/admin/academics/rooms': NativeListSpec(
    title: 'Classrooms & Labs',
    icon: 'graduation_cap',
    path: '/api/rooms',
    heading: (r) => pick(r, ['name']),
    subtitle: (r) => [pick(r, ['type']), pick(r, ['building']), pick(r, ['floor'])]
        .where((s) => s.isNotEmpty)
        .join(' • '),
    status: (r) => pick(r, ['status']),
    trailing: (r) => pick(r, ['capacity']).isEmpty ? '' : 'Cap ${pick(r, ['capacity'])}',
    details: (r) => [
      _e('Room no.', pick(r, ['room_number'])),
      _e('Type', pick(r, ['type'])),
      _e('Building', pick(r, ['building'])),
      _e('Floor', pick(r, ['floor'])),
      _e('Capacity', pick(r, ['capacity'])),
    ],
  ),
  '/admin/academics/subjects': NativeListSpec(
    title: 'Subjects',
    icon: 'graduation_cap',
    path: '/api/subjects',
    heading: (r) => pick(r, ['name']),
    subtitle: (r) => pick(r, ['code'], 'No code'),
    status: (r) => pick(r, ['status']),
    details: (r) => [_e('Code', pick(r, ['code']))],
  ),
  '/admin/academics/timetable': NativeListSpec(
    title: 'Timetable',
    icon: 'calendar',
    path: '/api/timetable',
    heading: (r) => pick(r, ['subject_name', 'period_name', 'slot_type']),
    subtitle: (r) => [
      pick(r, ['day_of_week']),
      '${pick(r, ['start_time'])}-${pick(r, ['end_time'])}',
      '${pick(r, ['class_name'])} ${pick(r, ['section_name'])}'.trim()
    ].where((s) => s.isNotEmpty && s != '-').join(' • '),
    details: (r) => [
      _e('Day', pick(r, ['day_of_week'])),
      _e('Time', '${pick(r, ['start_time'])} - ${pick(r, ['end_time'])}'),
      _e('Class', '${pick(r, ['class_name'])} ${pick(r, ['section_name'])}'.trim()),
      _e('Teacher', pick(r, ['teacher_name'])),
      _e('Room', pick(r, ['room'])),
      _e('Notes', pick(r, ['notes'])),
    ],
  ),
  '/admin/transport': NativeListSpec(
    title: 'Fleet & Bus Routes',
    icon: 'bus',
    path: '/api/vehicles',
    heading: (r) => pick(r, ['vehicle_name']),
    subtitle: (r) => [pick(r, ['vehicle_number']), pick(r, ['driver_name'])]
        .where((s) => s.isNotEmpty)
        .join(' • '),
    status: (r) => pick(r, ['status']),
    trailing: (r) => pick(r, ['capacity']).isEmpty ? '' : '${pick(r, ['capacity'])} seats',
    details: (r) => [
      _e('Vehicle no.', pick(r, ['vehicle_number'])),
      _e('Type', pick(r, ['vehicle_type', 'type'])),
      _e('Capacity', pick(r, ['capacity'])),
      _e('Driver', pick(r, ['driver_name'])),
      _e('Driver phone', pick(r, ['driver_phone'])),
      _e('Helper', pick(r, ['helper_name'])),
    ],
  ),
  '/admin/payroll': NativeListSpec(
    title: 'Employee Payroll',
    icon: 'receipt',
    path: '/api/employee-payments',
    emptyText: 'No salary payments yet',
    heading: (r) => pick(r, ['employee_name']),
    subtitle: (r) => [pick(r, ['designation']), pick(r, ['billing_month'])]
        .where((s) => s.isNotEmpty)
        .join(' • '),
    status: (r) => pick(r, ['status']),
    trailing: (r) => _money(r, ['amount']),
    details: (r) => [
      _e('Employee no.', pick(r, ['employee_number'])),
      _e('Month', pick(r, ['billing_month'])),
      _e('Base salary', _money(r, ['base_salary'])),
      _e('Reimbursements', _money(r, ['total_reimbursements'])),
      _e('Deductions', _money(r, ['total_deductions'])),
      _e('Net paid', _money(r, ['amount'])),
      _e('Paid on', shortDate(pick(r, ['payment_date']))),
      _e('Method', pick(r, ['payment_method'])),
      _e('Reference', pick(r, ['reference_number'])),
      _e('Notes', pick(r, ['notes'])),
    ],
  ),
  '/admin/exams': NativeListSpec(
    title: 'Exams',
    icon: 'award',
    path: '/api/exams',
    heading: (r) => pick(r, ['name']),
    subtitle: (r) => [
      pick(r, ['subject_name']),
      '${pick(r, ['class_name'])} ${pick(r, ['section_name'])}'.trim(),
      shortDate(pick(r, ['exam_date']))
    ].where((s) => s.isNotEmpty).join(' • '),
    status: (r) => pick(r, ['status']),
    trailing: (r) => pick(r, ['max_marks']).isEmpty ? '' : '/${pick(r, ['max_marks'])}',
    details: (r) => [
      _e('Subject', pick(r, ['subject_name'])),
      _e('Class', '${pick(r, ['class_name'])} ${pick(r, ['section_name'])}'.trim()),
      _e('Date', shortDate(pick(r, ['exam_date']))),
      _e('Max marks', pick(r, ['max_marks'])),
      _e('Passing marks', pick(r, ['passing_marks'])),
      _e('Teacher', pick(r, ['teacher_name'])),
    ],
  ),
  '/admin/results': NativeListSpec(
    title: 'Marks & Results',
    icon: 'award',
    path: '/api/exam-results',
    emptyText: 'No results entered yet',
    heading: (r) => pick(r, ['student_name']),
    subtitle: (r) => [pick(r, ['registration_number']), 'Roll ${pick(r, ['roll_number'])}']
        .where((s) => s.isNotEmpty && s != 'Roll ')
        .join(' • '),
    status: (r) => r['absent'] == true ? 'absent' : '',
    trailing: (r) => pick(r, ['marks_obtained']),
    details: (r) => [
      _e('Registration', pick(r, ['registration_number'])),
      _e('Marks', pick(r, ['marks_obtained'])),
      _e('Remarks', pick(r, ['remarks'])),
    ],
  ),
  '/admin/access-requests': NativeListSpec(
    title: 'Join Requests',
    icon: 'bell',
    path: '/api/access-requests',
    emptyText: 'No join requests',
    heading: (r) => pick(r, ['user_name', 'user_email']),
    subtitle: (r) => [pick(r, ['user_email']), pick(r, ['assigned_role'])]
        .where((s) => s.isNotEmpty)
        .join(' • '),
    status: (r) => pick(r, ['status']),
    actions: [
      NativeAction(
        label: 'Approve',
        color: AppColors.success,
        method: 'PATCH',
        path: (_) => '/api/access-requests',
        confirm: 'Approve this access request?',
        visible: (r) => pick(r, ['status']) == 'pending',
        body: (r) => {
          'action': 'approve',
          'requestId': r['id'],
          'role': pick(r, ['assigned_role'], 'staff'),
        },
      ),
      NativeAction(
        label: 'Reject',
        color: AppColors.danger,
        method: 'PATCH',
        path: (_) => '/api/access-requests',
        confirm: 'Reject this access request?',
        visible: (r) => pick(r, ['status']) == 'pending',
        body: (r) => {'action': 'reject', 'requestId': r['id']},
      ),
    ],
    details: (r) => [
      _e('Email', pick(r, ['user_email'])),
      _e('Phone', pick(r, ['phone'])),
      _e('School', pick(r, ['school_name'])),
      _e('Requested role', pick(r, ['assigned_role'])),
      _e('Designation', pick(r, ['assigned_designation'])),
      _e('Notes', pick(r, ['applicant_notes'])),
      _e('Requested', shortDate(pick(r, ['created_at']))),
      _e('Rejection reason', pick(r, ['rejection_reason'])),
    ],
  ),
  '/admin/account-requests': NativeListSpec(
    title: 'Account Deletion Requests',
    icon: 'bell',
    path: '/api/access-requests',
    emptyText: 'No account deletion requests',
    heading: (r) => pick(r, ['user_name', 'user_email', 'email']),
    subtitle: (r) => [pick(r, ['user_email', 'role', 'assigned_role']), shortDate(pick(r, ['created_at']))]
        .where((s) => s.isNotEmpty)
        .join(' • '),
    status: (r) => pick(r, ['status']),
    details: (r) => [
      _e('User', pick(r, ['user_name'])),
      _e('Email', pick(r, ['user_email', 'email'])),
      _e('Role', pick(r, ['assigned_role', 'role'])),
      _e('Reason', pick(r, ['applicant_notes', 'reason'])),
      _e('Status', pick(r, ['status'])),
      _e('Requested', shortDate(pick(r, ['created_at']))),
    ],
  ),
  '/admin/recycle-bin': NativeListSpec(
    title: 'Recycle Bin (30-Day)',
    icon: 'bell',
    path: '/api/recycle-bin',
    emptyText: 'Recycle bin is empty',
    heading: (r) => pick(r, ['entity_name']),
    subtitle: (r) => '${pick(r, ['entity_type'])} • deleted ${shortDate(pick(r, ['deleted_at']))}',
    status: (r) => pick(r, ['status']),
    details: (r) => [
      _e('Type', pick(r, ['entity_type'])),
      _e('Details', pick(r, ['entity_details'])),
      _e('Deleted by', pick(r, ['deleted_by_name'])),
      _e('Deleted on', shortDate(pick(r, ['deleted_at']))),
      _e('Purged on', shortDate(pick(r, ['permanent_purge_at']))),
    ],
  ),
  '/admin/security/logs': NativeListSpec(
    title: 'Login History',
    icon: 'shield_check',
    path: '/api/auth/events',
    query: const {'limit': '100'},
    emptyText: 'No login events',
    heading: (r) => pick(r, ['user_name', 'email', 'registration_identifier']),
    subtitle: (r) => '${pick(r, ['event_type']).replaceAll('_', ' ')} • ${shortDate(pick(r, ['created_at']))}',
    status: (r) => r['success'] == false ? 'failed' : 'success',
    details: (r) => [
      _e('Event', pick(r, ['event_type']).replaceAll('_', ' ')),
      _e('Role', pick(r, ['role'])),
      _e('Email', pick(r, ['email'])),
      _e('Platform', pick(r, ['platform'])),
      _e('Time', pick(r, ['created_at'])),
    ],
  ),
};
