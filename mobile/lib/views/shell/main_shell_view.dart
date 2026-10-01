import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/widgets/app_top_header.dart';
import '../../core/widgets/app_bottom_nav.dart';
import '../../core/widgets/app_drawer.dart';
import '../../data/models/user_model.dart';
import '../../data/services/api_client.dart';
import '../../data/services/auth_service.dart';
import '../auth/pin_lock_screen.dart';

// Teacher Views
import '../teacher/teacher_home_view.dart';
import '../teacher/teacher_attendance_view.dart';
import '../teacher/teacher_classes_view.dart';
import '../teacher/teacher_exams_view.dart';
import '../teacher/teacher_timetable_view.dart';

// Student & Parent Views
import '../parent_student/student_home_view.dart';
import '../parent/parent_home_view.dart';
import '../parent_student/student_results_view.dart';
import '../parent_student/student_fees_view.dart';
import '../parent_student/student_transport_view.dart';
import '../parent_student/student_profile_view.dart';

// Admin Views
import '../admin/admin_home_view.dart';
import '../admin/admin_students_view.dart';
import '../admin/admin_attendance_view.dart';
import '../admin/admin_fees_view.dart';
import '../admin/admin_notices_view.dart';
import '../super_admin/super_admin_views.dart';

// Driver Views
import '../driver/driver_home_view.dart';
import '../driver/driver_stops_view.dart';
import '../driver/driver_boarding_view.dart';
import '../common/mobile_module_view.dart';

class MainShellView extends StatefulWidget {
  const MainShellView({super.key});

  @override
  State<MainShellView> createState() => _MainShellViewState();
}

class _MainShellViewState extends State<MainShellView>
    with WidgetsBindingObserver {
  static const String _keyActiveTab = 'nav_active_tab_index';
  static const String _keyTabHistory = 'nav_tab_history';

  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  int _currentIndex = 0;
  int _studentsVersion = 0;
  List<int> _tabHistory = [0];
  UserRole? _lastRole;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadNavState();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive ||
        state == AppLifecycleState.hidden) {
      _saveNavState();
    }
  }

  Future<void> _saveNavState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_keyActiveTab, _currentIndex);
      await prefs.setStringList(
        _keyTabHistory,
        _tabHistory.map((e) => e.toString()).toList(),
      );
    } catch (_) {}
  }

  Future<void> _loadNavState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedIndex = prefs.getInt(_keyActiveTab);
      final savedHistory = prefs.getStringList(_keyTabHistory);
      if (savedHistory != null && savedHistory.isNotEmpty) {
        final parsed = savedHistory.map((e) => int.tryParse(e) ?? 0).toList();
        if (parsed.isNotEmpty) {
          setState(() {
            _tabHistory = parsed;
            _currentIndex = savedIndex ?? parsed.last;
          });
          return;
        }
      }
      if (savedIndex != null) {
        setState(() {
          _currentIndex = savedIndex;
          _tabHistory = [savedIndex];
        });
      }
    } catch (_) {}
  }

  void _onTabSelected(int index) {
    if (_currentIndex == index) return;
    setState(() {
      _currentIndex = index;
      _tabHistory.remove(index);
      _tabHistory.add(index);
    });
    _saveNavState();
  }

  void _handleDeviceBack() {
    // 1. Close drawer if open
    if (_scaffoldKey.currentState?.isDrawerOpen ?? false) {
      _scaffoldKey.currentState?.closeDrawer();
      return;
    }

    // 2. Navigate back in tab/screen history (Screen C -> Screen B -> Screen A)
    if (_tabHistory.length > 1) {
      setState(() {
        _tabHistory.removeLast();
        _currentIndex = _tabHistory.last;
      });
      _saveNavState();
      return;
    }

    // 3. At root screen with nowhere left to navigate back: exit/close app cleanly
    SystemNavigator.pop();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();

    // 5-Digit PIN Lock Guard
    if (!auth.isPinUnlocked) {
      return const PinLockScreen();
    }

    final currentRole = auth.currentUser.role;

    // Reset tab index if user switches persona
    if (_lastRole != currentRole) {
      _lastRole = currentRole;
      _currentIndex = 0;
      _tabHistory = [0];
      _saveNavState();
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _handleDeviceBack();
      },
      child: Scaffold(
        key: _scaffoldKey,
        appBar: AppTopHeader(scaffoldKey: _scaffoldKey),
        drawer: AppDrawer(onNavigate: _onTabSelected),
        body: IndexedStack(
          index: _currentIndex,
          children: _getScreensForRole(currentRole),
        ),
        bottomNavigationBar: AppBottomNav(
          role: currentRole,
          currentIndex: _currentIndex,
          onTap: _onTabSelected,
          onCreateStudent: currentRole == UserRole.schoolAdmin
              ? _showCreateStudentSheet
              : null,
          onMore: currentRole == UserRole.schoolAdmin
              ? _showSchoolAdminMoreSheet
              : null,
        ),
      ),
    );
  }

  void _showSchoolAdminMoreSheet() {
    const options = [
      _MoreNavItem('Teachers', 2),
      _MoreNavItem('Staff & Support', 3),
      _MoreNavItem('Reception & Enquiries', 4),
      _MoreNavItem('Student Attendance', 5),
      _MoreNavItem('Student Leaves', 6),
      _MoreNavItem('Teacher Attendance & Leaves', 7),
      _MoreNavItem('School Holidays', 8),
      _MoreNavItem('Classes & Sections', 9),
      _MoreNavItem('Classrooms & Labs', 10),
      _MoreNavItem('Subjects', 11),
      _MoreNavItem('Timetable', 12),
      _MoreNavItem('Fleet & Bus Routes', 13),
      _MoreNavItem('Student Fees', 14),
      _MoreNavItem('Employee Payroll', 15),
      _MoreNavItem('Exams', 16),
      _MoreNavItem('Marks & Results', 17),
      _MoreNavItem('Notice Board', 18),
      _MoreNavItem('Join Requests', 19),
      _MoreNavItem('Recycle Bin (30-Day)', 20),
      _MoreNavItem('Login History', 21),
      _MoreNavItem('Deletion Requests', 22),
      _MoreNavItem('School Settings', 23),
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.72,
          minChildSize: 0.35,
          maxChildSize: 0.92,
          builder: (context, controller) {
            return ListView(
              controller: controller,
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
              children: [
                const Text(
                  'More Options',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                ...options.map((item) => ListTile(
                      title: Text(item.label),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                        Navigator.pop(context);
                        _onTabSelected(item.index);
                      },
                    )),
              ],
            );
          },
        );
      },
    );
  }

  void _showCreateStudentSheet() {
    final name = TextEditingController();
    final admission = TextEditingController();
    final className = TextEditingController();
    final section = TextEditingController();
    var saving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            Future<void> save() async {
              final user = context.read<AuthService>().currentUser;
              setSheetState(() => saving = true);
              try {
                await ApiClient.createStudent(
                  schoolId: user.schoolId,
                  fullName: name.text,
                  admissionNumber: admission.text,
                  className: className.text,
                  section: section.text,
                );
                if (!context.mounted) return;
                Navigator.pop(context);
                setState(() {
                  _studentsVersion++;
                  _currentIndex = 1;
                  _tabHistory.remove(1);
                  _tabHistory.add(1);
                });
                _saveNavState();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Student created')),
                );
              } catch (e) {
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content:
                        Text(e.toString().replaceFirst('Exception: ', '')),
                  ),
                );
              } finally {
                if (context.mounted) setSheetState(() => saving = false);
              }
            }

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 18,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Create Student',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: name,
                    onChanged: (_) => setSheetState(() {}),
                    decoration:
                        const InputDecoration(labelText: 'Student full name'),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: admission,
                    onChanged: (_) => setSheetState(() {}),
                    decoration:
                        const InputDecoration(labelText: 'Admission number'),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: className,
                    decoration: const InputDecoration(labelText: 'Class'),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: section,
                    decoration: const InputDecoration(labelText: 'Section'),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: saving ||
                              name.text.trim().isEmpty ||
                              admission.text.trim().isEmpty
                          ? null
                          : save,
                      child: Text(saving ? 'Saving...' : 'Save Student'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    ).whenComplete(() {
      name.dispose();
      admission.dispose();
      className.dispose();
      section.dispose();
    });
  }

  List<Widget> _getScreensForRole(UserRole role) {
    switch (role) {
      case UserRole.teacher:
        return [
          TeacherHomeView(onTabSelected: _onTabSelected),
          const TeacherAttendanceView(),
          const MobileModuleView(
            title: 'My Attendance & Leave',
            icon: 'attendance',
            items: ['Daily attendance status', 'Leave request history', 'Salary-linked attendance records'],
          ),
          const TeacherClassesView(),
          const TeacherExamsView(),
          const TeacherTimetableView(),
          const MobileModuleView(
            title: 'Salary Statements',
            icon: 'receipt',
            items: ['Monthly salary statements', 'Payment history', 'Deductions and adjustments'],
          ),
        ];
      case UserRole.student:
        return [
          StudentHomeView(onTabSelected: _onTabSelected),
          const MobileModuleView(
            title: 'Classes & Timetable',
            icon: 'calendar',
            items: ['Class schedule', 'Subject timetable', 'Teacher details'],
          ),
          const StudentTransportView(),
          const StudentResultsView(),
          const StudentFeesView(),
          const StudentProfileView(),
        ];
      case UserRole.parent:
        return [
          ParentHomeView(onTabSelected: _onTabSelected),
          const MobileModuleView(
            title: 'Classes & Timetable',
            icon: 'calendar',
            items: ['Ward class schedule', 'Subject timetable', 'Teacher details'],
          ),
          const StudentTransportView(),
          const StudentResultsView(),
          const StudentFeesView(),
          const StudentProfileView(),
        ];
      case UserRole.superAdmin:
        return [
          SuperAdminOverviewView(onTabSelected: _onTabSelected),
          const SuperAdminSchoolsView(),
          const SuperAdminUsersView(),
          const SuperAdminAccessRequestsView(),
          const SuperAdminSecurityView(),
          const SuperAdminSettingsView(),
        ];
      case UserRole.schoolAdmin:
        return [
          AdminHomeView(onTabSelected: _onTabSelected),
          AdminStudentsView(key: ValueKey(_studentsVersion)),
          const MobileModuleView(title: 'Teachers', icon: 'teacher', items: ['Teacher directory', 'Teacher profiles', 'Teacher payments']),
          const MobileModuleView(title: 'Staff & Support', icon: 'teacher', items: ['Staff directory', 'Drivers', 'Support staff']),
          const MobileModuleView(title: 'Reception & Enquiries', icon: 'bell', items: ['Visitor lookup', 'New enquiries', 'Follow-ups']),
          const AdminAttendanceView(),
          const MobileModuleView(title: 'Student Leaves', icon: 'calendar', items: ['Pending leaves', 'Approved leaves', 'Rejected leaves']),
          const MobileModuleView(title: 'Teacher Attendance & Leaves', icon: 'attendance', items: ['Teacher attendance', 'Teacher leave requests', 'Daily staff status']),
          const MobileModuleView(title: 'School Holidays', icon: 'calendar', items: ['Holiday calendar', 'Create holiday', 'Edit holiday']),
          const MobileModuleView(title: 'Classes & Sections', icon: 'graduation_cap', items: ['Classes', 'Sections', 'Student assignment']),
          const MobileModuleView(title: 'Classrooms & Labs', icon: 'graduation_cap', items: ['Rooms', 'Labs', 'Capacity']),
          const MobileModuleView(title: 'Subjects', icon: 'graduation_cap', items: ['Subject list', 'Subject teachers', 'Class mapping']),
          const MobileModuleView(title: 'Timetable', icon: 'calendar', items: ['Class timetable', 'Teacher timetable', 'Weekly periods']),
          const MobileModuleView(title: 'Fleet & Bus Routes', icon: 'bus', items: ['Vehicles', 'Routes', 'Stops', 'Assignments']),
          const AdminFeesView(),
          const MobileModuleView(title: 'Employee Payroll', icon: 'receipt', items: ['Salary payments', 'Adjustments', 'Payment history']),
          const MobileModuleView(title: 'Exams', icon: 'award', items: ['Exam setup', 'Schedules', 'Marks entry']),
          const MobileModuleView(title: 'Marks & Results', icon: 'award', items: ['Result sheets', 'Student marks', 'Publish results']),
          const AdminNoticesView(),
          const MobileModuleView(title: 'Join Requests', icon: 'bell', items: ['Pending requests', 'Approve school access', 'Reject requests']),
          const MobileModuleView(title: 'Recycle Bin (30-Day)', icon: 'bell', items: ['Deleted records', 'Restore records', 'Permanent deletion window']),
          const MobileModuleView(title: 'Login History', icon: 'shield_check', items: ['Login events', 'Failed logins', 'Role access events']),
          const MobileModuleView(title: 'Deletion Requests', icon: 'shield_check', items: ['Account deletion requests', 'Approve requests', 'Reject requests']),
          const MobileModuleView(title: 'School Settings', icon: 'sparkles', items: ['School profile', 'Modules', 'Security settings']),
          const MobileModuleView(title: 'Profile', icon: 'id_card', items: ['Principal profile', 'School account', 'Security PIN']),
        ];
      case UserRole.staff:
        return [
          AdminHomeView(onTabSelected: _onTabSelected),
          const MobileModuleView(title: 'Visitor Lookup', icon: 'bell', items: ['Find visitor records', 'Check student pickup authority']),
          const AdminFeesView(),
          const AdminStudentsView(),
          const AdminAttendanceView(),
          const AdminNoticesView(),
        ];
      case UserRole.accountant:
        return [
          AdminHomeView(onTabSelected: _onTabSelected),
          const AdminFeesView(),
          const MobileModuleView(title: 'Employee Payroll', icon: 'receipt', items: ['Salary payments', 'Payroll reports', 'Adjustments']),
          const MobileModuleView(title: 'Student Directory', icon: 'graduation_cap', items: ['Student fee profiles', 'Parent contact', 'Admission numbers']),
          const MobileModuleView(title: 'Login History', icon: 'shield_check', items: ['Fee desk login activity', 'Payment access events']),
        ];
      case UserRole.driver:
        return [
          const DriverHomeView(),
          const DriverStopsView(),
          const DriverBoardingView(),
        ];
    }
  }
}

class _MoreNavItem {
  final String label;
  final int index;

  const _MoreNavItem(this.label, this.index);
}
