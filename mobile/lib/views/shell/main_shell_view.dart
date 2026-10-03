import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_top_header.dart';
import '../../core/widgets/school_status_card.dart';
import '../../core/widgets/app_bottom_nav.dart';
import '../../core/widgets/app_drawer.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../core/widgets/user_avatar.dart';
import '../../data/models/user_model.dart';
import '../../data/services/api_client.dart';
import '../../data/services/auth_service.dart';
import '../../viewmodels/student_viewmodel.dart';
import '../auth/pin_lock_screen.dart';

// Teacher workflows reuse the authenticated web portal.
import '../teacher/teacher_portal_view.dart';

// Student & Parent Views
import '../parent_student/student_home_view.dart';
import '../parent/parent_home_view.dart';
import '../parent_student/student_attendance_view.dart';
import '../parent_student/student_classes_view.dart';
import '../parent_student/student_results_view.dart';
import '../parent_student/student_fees_view.dart';
import '../parent_student/student_transport_view.dart';
import '../parent_student/student_notices_view.dart';
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
  bool _showMore = false;
  int? _morePage;

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
    if (state == AppLifecycleState.resumed) _refreshStudentFees();
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

  void _refreshStudentFees() {
    final user = context.read<AuthService>().currentUser;
    if (user.role == UserRole.student || user.role == UserRole.parent) {
      context.read<StudentViewModel>().refresh(user);
    }
  }

  void _onTabSelected(int index) {
    if (index == 4) _refreshStudentFees();
    if (_currentIndex == index && !_showMore) return;
    setState(() {
      _showMore = false;
      _morePage = null;
      _currentIndex = index;
      _tabHistory.remove(index);
      _tabHistory.add(index);
    });
    _saveNavState();
  }

  void _navigate(int index) {
    final role = context.read<AuthService>().currentUser.role;
    if (_moreItemsForRole(role).any((item) => item.index == index)) {
      _openMorePage(index);
    } else {
      _onTabSelected(index);
    }
  }

  void _openMorePage(int index) {
    setState(() {
      _showMore = true;
      _morePage = index;
    });
  }

  void _handleDeviceBack() {
    if (_showMore) {
      setState(() {
        if (_morePage != null) {
          _morePage = null;
        } else {
          _showMore = false;
        }
      });
      return;
    }

    // 1. Close drawer if open
    if (_scaffoldKey.currentState?.isDrawerOpen ?? false) {
      _scaffoldKey.currentState?.closeDrawer();
      return;
    }
    if (_scaffoldKey.currentState?.isEndDrawerOpen ?? false) {
      Navigator.of(context).pop();
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
      _showMore = false;
      _morePage = null;
      _lastRole = currentRole;
      _currentIndex = 0;
      _tabHistory = [0];
      _saveNavState();
    }

    // Older installs saved secondary pages as primary tabs.
    if (!_showMore &&
        _moreItemsForRole(currentRole)
            .any((item) => item.index == _currentIndex)) {
      _morePage = _currentIndex;
      _showMore = true;
      _currentIndex = 0;
      _tabHistory = [0];
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _handleDeviceBack();
      },
      child: Scaffold(
        key: _scaffoldKey,
        appBar:
            currentRole == UserRole.teacher && !(_showMore && _morePage == null)
                ? null
                : AppTopHeader(scaffoldKey: _scaffoldKey),
        drawer: AppDrawer(onNavigate: _navigate),
        body: SafeArea(
            top: currentRole == UserRole.teacher,
            bottom: false,
            child: _showMore && _morePage == null
                ? _MoreMenu(
                    user: auth.currentUser,
                    items: _moreItemsForRole(currentRole),
                    onNavigate: _openMorePage,
                  )
                : Column(children: [
                    if (_showMore)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(8, 4, 16, 4),
                        child: Row(children: [
                          TextButton.icon(
                            onPressed: () => setState(() => _morePage = null),
                            icon:
                                const Icon(Icons.arrow_back_ios_new, size: 16),
                            label: const Text('More'),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                              child: Text(
                                  _moreItemsForRole(currentRole)
                                          .where(
                                              (item) => item.index == _morePage)
                                          .map((item) => item.label)
                                          .firstOrNull ??
                                      'Details',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600))),
                        ]),
                      ),
                    if (!_showMore && _currentIndex == 0)
                      SchoolStatusCard(
                          key: ValueKey(auth.currentUser.schoolId)),
                    Expanded(
                        child: currentRole == UserRole.teacher
                            ? _getScreensForRole(
                                currentRole)[_morePage ?? _currentIndex]
                            : IndexedStack(
                                index: _morePage ?? _currentIndex,
                                children: _getScreensForRole(currentRole),
                              )),
                  ])),
        bottomNavigationBar: AppBottomNav(
          role: currentRole,
          currentIndex: _showMore ? -1 : _currentIndex,
          onTap: _onTabSelected,
          onCreateStudent: currentRole == UserRole.schoolAdmin
              ? _showCreateStudentSheet
              : null,
          onMore: () => setState(() {
            _showMore = true;
            _morePage = null;
          }),
        ),
      ),
    );
  }

  List<_MoreNavItem> _moreItemsForRole(UserRole role) {
    switch (role) {
      case UserRole.teacher:
        return const [
          _MoreNavItem('My Leave', 2, 'attendance'),
          _MoreNavItem('Schedule', 5, 'calendar'),
          _MoreNavItem('Salary', 6, 'receipt'),
          _MoreNavItem('Account & Security', 8, 'shield_check'),
        ];
      case UserRole.student:
      case UserRole.parent:
        return const [
          _MoreNavItem('Attendance, Leave & Health', 7, 'attendance'),
          _MoreNavItem('Results', 3, 'award'),
          _MoreNavItem('Notices', 8, 'bell'),
          _MoreNavItem('Profile', 5, 'id_card'),
          _MoreNavItem('Settings', 6, 'sparkles'),
        ];
      case UserRole.superAdmin:
        return const [
          _MoreNavItem('Security', 4, 'shield_check'),
          _MoreNavItem('Settings', 5, 'sparkles'),
          _MoreNavItem('Profile', 6, 'id_card'),
        ];
      case UserRole.schoolAdmin:
        return const [
          _MoreNavItem('Teachers', 2, 'teacher'),
          _MoreNavItem('Staff & Support', 3, 'teacher'),
          _MoreNavItem('Reception & Enquiries', 4, 'bell'),
          _MoreNavItem('Student Attendance', 5, 'attendance'),
          _MoreNavItem('Student Leaves', 6, 'calendar'),
          _MoreNavItem('Teacher Attendance & Leaves', 7, 'attendance'),
          _MoreNavItem('School Holidays', 8, 'calendar'),
          _MoreNavItem('Classes & Sections', 9, 'graduation_cap'),
          _MoreNavItem('Classrooms & Labs', 10, 'graduation_cap'),
          _MoreNavItem('Subjects', 11, 'graduation_cap'),
          _MoreNavItem('Timetable', 12, 'calendar'),
          _MoreNavItem('Fleet & Bus Routes', 13, 'bus'),
          _MoreNavItem('Employee Payroll', 15, 'receipt'),
          _MoreNavItem('Exams', 16, 'award'),
          _MoreNavItem('Marks & Results', 17, 'award'),
          _MoreNavItem('Notice Board', 18, 'bell'),
          _MoreNavItem('Join Requests', 19, 'bell'),
          _MoreNavItem('Recycle Bin', 20, 'bell'),
          _MoreNavItem('Login History', 21, 'shield_check'),
          _MoreNavItem('Deletion Requests', 22, 'shield_check'),
          _MoreNavItem('Settings', 23, 'sparkles'),
          _MoreNavItem('Profile', 24, 'id_card'),
        ];
      case UserRole.accountant:
        return const [
          _MoreNavItem('Students', 3, 'graduation_cap'),
          _MoreNavItem('Security', 4, 'shield_check'),
          _MoreNavItem('Profile', 5, 'id_card'),
          _MoreNavItem('Settings', 6, 'sparkles'),
        ];
      case UserRole.staff:
        return const [
          _MoreNavItem('Reception', 1, 'bell'),
          _MoreNavItem('Attendance', 4, 'attendance'),
          _MoreNavItem('Notices', 5, 'bell'),
          _MoreNavItem('Profile', 6, 'id_card'),
          _MoreNavItem('Settings', 7, 'sparkles'),
        ];
      case UserRole.driver:
        return const [
          _MoreNavItem('Profile', 3, 'id_card'),
          _MoreNavItem('Settings', 4, 'sparkles'),
        ];
    }
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
                    content: Text(e.toString().replaceFirst('Exception: ', '')),
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
                        const InputDecoration(labelText: 'Registration ID'),
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
        return const [
          TeacherPortalView(path: '/teacher'),
          TeacherPortalView(path: '/teacher/attendance'),
          TeacherPortalView(path: '/teacher/leave'),
          TeacherPortalView(path: '/teacher/classes'),
          TeacherPortalView(path: '/teacher/exams'),
          TeacherPortalView(path: '/teacher/timetable'),
          TeacherPortalView(path: '/teacher/payments'),
          TeacherPortalView(path: '/account/security'),
          TeacherPortalView(path: '/account/security'),
        ];
      case UserRole.student:
        return [
          StudentHomeView(onTabSelected: _navigate),
          const StudentClassesView(),
          const StudentTransportView(),
          const StudentResultsView(),
          const StudentFeesView(),
          const StudentProfileView(),
          const TeacherPortalView(path: '/account/security'),
          const StudentAttendanceView(),
          const StudentNoticesView(),
        ];
      case UserRole.parent:
        return [
          ParentHomeView(onTabSelected: _navigate),
          const StudentClassesView(),
          const StudentTransportView(),
          const StudentResultsView(),
          const StudentFeesView(),
          const StudentProfileView(),
          const TeacherPortalView(path: '/account/security'),
          const StudentAttendanceView(),
          const StudentNoticesView(),
        ];
      case UserRole.superAdmin:
        return [
          SuperAdminOverviewView(onTabSelected: _navigate),
          const SuperAdminSchoolsView(),
          const SuperAdminUsersView(),
          const SuperAdminAccessRequestsView(),
          const SuperAdminSecurityView(),
          const SuperAdminSettingsView(),
          const TeacherPortalView(path: '/account/security'),
        ];
      case UserRole.schoolAdmin:
        return [
          AdminHomeView(onTabSelected: _navigate),
          AdminStudentsView(key: ValueKey(_studentsVersion)),
          const TeacherPortalView(path: '/admin/teachers'),
          const TeacherPortalView(path: '/admin/staff'),
          const TeacherPortalView(path: '/admin/reception'),
          const AdminAttendanceView(),
          const TeacherPortalView(path: '/admin/attendance/leaves'),
          const TeacherPortalView(path: '/admin/teachers/attendance'),
          const TeacherPortalView(path: '/admin/academics/holidays'),
          const TeacherPortalView(path: '/admin/academics/classes'),
          const TeacherPortalView(path: '/admin/academics/rooms'),
          const TeacherPortalView(path: '/admin/academics/subjects'),
          const TeacherPortalView(path: '/admin/academics/timetable'),
          const TeacherPortalView(path: '/admin/transport'),
          const AdminFeesView(),
          const TeacherPortalView(path: '/admin/payroll'),
          const TeacherPortalView(path: '/admin/exams'),
          const TeacherPortalView(path: '/admin/results'),
          const AdminNoticesView(),
          const TeacherPortalView(path: '/admin/access-requests'),
          const TeacherPortalView(path: '/admin/recycle-bin'),
          const TeacherPortalView(path: '/admin/security/logs'),
          const TeacherPortalView(path: '/admin/account-requests'),
          const TeacherPortalView(path: '/admin/settings'),
          const TeacherPortalView(path: '/account/security'),
        ];
      case UserRole.staff:
        return [
          AdminHomeView(onTabSelected: _navigate),
          const TeacherPortalView(path: '/staff'),
          const AdminFeesView(),
          const AdminStudentsView(),
          const AdminAttendanceView(),
          const AdminNoticesView(),
          const TeacherPortalView(path: '/account/security'),
          const TeacherPortalView(path: '/account/security'),
        ];
      case UserRole.accountant:
        return [
          AdminHomeView(onTabSelected: _navigate),
          const AdminFeesView(),
          const TeacherPortalView(path: '/staff'),
          const AdminStudentsView(),
          const TeacherPortalView(path: '/account/security'),
          const TeacherPortalView(path: '/account/security'),
          const TeacherPortalView(path: '/account/security'),
          const AdminNoticesView(),
        ];
      case UserRole.driver:
        return [
          const DriverHomeView(),
          const DriverStopsView(),
          const DriverBoardingView(),
          const TeacherPortalView(path: '/account/security'),
          const TeacherPortalView(path: '/account/security'),
        ];
    }
  }
}

class _MoreNavItem {
  final String label;
  final int index;
  final String icon;

  const _MoreNavItem(this.label, this.index, this.icon);
}

class _MoreMenu extends StatelessWidget {
  final UserModel user;
  final List<_MoreNavItem> items;
  final ValueChanged<int> onNavigate;
  const _MoreMenu(
      {required this.user, required this.items, required this.onNavigate});

  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
        children: [
          const Text('More',
              style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary)),
          const SizedBox(height: 16),
          _MoreProfileHeader(user: user),
          const SizedBox(height: 24),
          const Text('YOUR WORKSPACE',
              style: TextStyle(
                  fontSize: 11,
                  letterSpacing: 1.2,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMuted)),
          const SizedBox(height: 10),
          Material(
            color: Colors.white,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: AppColors.border)),
            clipBehavior: Clip.antiAlias,
            child: Column(children: [
              for (var i = 0; i < items.length; i++) ...[
                if (i > 0) const Divider(height: 1, indent: 64, endIndent: 16),
                ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(10)),
                    child: AppSvgIcon(items[i].icon,
                        size: 20, color: AppColors.primary),
                  ),
                  title: Text(items[i].label,
                      style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textPrimary)),
                  trailing: const Icon(Icons.chevron_right_rounded,
                      size: 20, color: AppColors.textMuted),
                  onTap: () => onNavigate(items[i].index),
                ),
              ],
            ]),
          ),
        ],
      );
}

class _MoreProfileHeader extends StatelessWidget {
  final UserModel user;

  const _MoreProfileHeader({required this.user});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          UserAvatar(
            name: user.name,
            imageUrl: user.avatarUrl,
            radius: 34,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.name.isEmpty ? 'User' : user.name,
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(user.roleDisplayName,
                    style: const TextStyle(color: AppColors.textSecondary)),
                if (user.schoolName.isNotEmpty)
                  Text(user.schoolName,
                      style: const TextStyle(color: AppColors.textSecondary)),
                if (user.email.isNotEmpty)
                  Text(
                    user.email,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: AppColors.textMuted, fontSize: 12),
                  ),
                if ((user.loginId ?? '').isNotEmpty)
                  Text(
                    'ID: ${user.loginId}',
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: AppColors.textMuted, fontSize: 12),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
