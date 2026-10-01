import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/widgets/app_top_header.dart';
import '../../core/widgets/app_bottom_nav.dart';
import '../../core/widgets/app_drawer.dart';
import '../../data/models/user_model.dart';
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

// Driver Views
import '../driver/driver_home_view.dart';
import '../driver/driver_stops_view.dart';
import '../driver/driver_boarding_view.dart';

class MainShellView extends StatefulWidget {
  const MainShellView({super.key});

  @override
  State<MainShellView> createState() => _MainShellViewState();
}

class _MainShellViewState extends State<MainShellView> with WidgetsBindingObserver {
  static const String _keyActiveTab = 'nav_active_tab_index';
  static const String _keyTabHistory = 'nav_tab_history';

  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  int _currentIndex = 0;
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
        ),
      ),
    );
  }

  List<Widget> _getScreensForRole(UserRole role) {
    switch (role) {
      case UserRole.teacher:
        return [
          TeacherHomeView(onTabSelected: _onTabSelected),
          const TeacherAttendanceView(),
          const TeacherClassesView(),
          const TeacherExamsView(),
          const TeacherTimetableView(),
        ];
      case UserRole.student:
        return [
          StudentHomeView(onTabSelected: _onTabSelected),
          const StudentResultsView(),
          const StudentFeesView(),
          const StudentTransportView(),
          const StudentProfileView(),
        ];
      case UserRole.parent:
        return [
          ParentHomeView(onTabSelected: _onTabSelected),
          const StudentResultsView(),
          const StudentFeesView(),
          const StudentTransportView(),
          const StudentProfileView(),
        ];
      case UserRole.schoolAdmin:
      case UserRole.superAdmin:
      case UserRole.staff:
        return [
          AdminHomeView(onTabSelected: _onTabSelected),
          const AdminStudentsView(),
          const AdminAttendanceView(),
          const AdminFeesView(),
          const AdminNoticesView(),
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
