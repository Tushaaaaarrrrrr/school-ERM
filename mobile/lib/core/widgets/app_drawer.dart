import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import 'app_svg_icon.dart';
import 'user_avatar.dart';
import '../../data/services/auth_service.dart';
import '../../data/models/user_model.dart';

class AppDrawer extends StatelessWidget {
  final Function(int) onNavigate;

  const AppDrawer({super.key, required this.onNavigate});

  List<_DrawerNavItem> _itemsFor(UserRole role) {
    switch (role) {
      case UserRole.superAdmin:
        return const [
          _DrawerNavItem('PLATFORM', 'dashboard', 'Platform Overview', 0),
          _DrawerNavItem('PLATFORM', 'graduation_cap', 'Schools', 1),
          _DrawerNavItem('PLATFORM', 'teacher', 'Users & Roles', 2),
          _DrawerNavItem('GOVERNANCE', 'bell', 'Access Requests', 3),
          _DrawerNavItem('GOVERNANCE', 'shield_check', 'Security Logs', 4),
          _DrawerNavItem('GOVERNANCE', 'sparkles', 'Platform Settings', 5),
        ];
      case UserRole.teacher:
        return const [
          _DrawerNavItem('FACULTY WORKSPACE', 'dashboard', 'Dashboard', 0),
          _DrawerNavItem('FACULTY WORKSPACE', 'attendance', 'Student Roll Call', 1),
          _DrawerNavItem('FACULTY WORKSPACE', 'attendance', 'My Attendance & Leave', 2),
          _DrawerNavItem('FACULTY WORKSPACE', 'teacher', 'My Classes & Rosters', 3),
          _DrawerNavItem('FACULTY WORKSPACE', 'award', 'Exams & Marks', 4),
          _DrawerNavItem('FACULTY WORKSPACE', 'calendar', 'Teaching Schedule', 5),
          _DrawerNavItem('FACULTY WORKSPACE', 'receipt', 'Salary Statements', 6),
        ];
      case UserRole.student:
      case UserRole.parent:
        return const [
          _DrawerNavItem('STUDENT WORKSPACE', 'dashboard', 'Dashboard', 0),
          _DrawerNavItem('STUDENT WORKSPACE', 'calendar', 'Classes & Timetable', 1),
          _DrawerNavItem('STUDENT WORKSPACE', 'bus', 'Bus Transport', 2),
          _DrawerNavItem('STUDENT WORKSPACE', 'award', 'Exam Results', 3),
          _DrawerNavItem('STUDENT WORKSPACE', 'receipt', 'Fee Statements', 4),
          _DrawerNavItem('STUDENT WORKSPACE', 'id_card', 'Profile & Attendance', 5),
        ];
      case UserRole.driver:
        return const [
          _DrawerNavItem('DRIVER FLEET PORTAL', 'bus', 'Driver Dashboard', 0),
          _DrawerNavItem('DRIVER FLEET PORTAL', 'map_pin', 'Route Stops', 1),
          _DrawerNavItem('DRIVER FLEET PORTAL', 'id_card', 'Boarding', 2),
        ];
      case UserRole.staff:
        return const [
          _DrawerNavItem('STAFF WORKSPACE', 'dashboard', 'Staff Dashboard', 0),
          _DrawerNavItem('STAFF WORKSPACE', 'bell', 'Visitor Lookup', 1),
          _DrawerNavItem('STAFF WORKSPACE', 'receipt', 'Student Fees', 2),
          _DrawerNavItem('STAFF WORKSPACE', 'graduation_cap', 'Student Directory', 3),
          _DrawerNavItem('STAFF WORKSPACE', 'attendance', 'Daily Attendance', 4),
          _DrawerNavItem('STAFF WORKSPACE', 'bell', 'Notice Board', 5),
        ];
      case UserRole.accountant:
        return const [
          _DrawerNavItem('FINANCE WORKSPACE', 'dashboard', 'Dashboard', 0),
          _DrawerNavItem('FINANCE WORKSPACE', 'receipt', 'Student Fees', 1),
          _DrawerNavItem('FINANCE WORKSPACE', 'receipt', 'Employee Payroll', 2),
          _DrawerNavItem('FINANCE WORKSPACE', 'graduation_cap', 'Student Directory', 3),
          _DrawerNavItem('GOVERNANCE', 'shield_check', 'Login History', 4),
        ];
      case UserRole.schoolAdmin:
        return const [
          _DrawerNavItem('MAIN', 'dashboard', 'Dashboard', 0),
          _DrawerNavItem('PEOPLE & OPERATIONS', 'graduation_cap', 'Students', 1),
          _DrawerNavItem('PEOPLE & OPERATIONS', 'teacher', 'Teachers', 2),
          _DrawerNavItem('PEOPLE & OPERATIONS', 'teacher', 'Staff & Support', 3),
          _DrawerNavItem('PEOPLE & OPERATIONS', 'bell', 'Reception & Enquiries', 4),
          _DrawerNavItem('ATTENDANCE & LEAVES', 'attendance', 'Student Attendance', 5),
          _DrawerNavItem('ATTENDANCE & LEAVES', 'calendar', 'Student Leaves', 6),
          _DrawerNavItem('ATTENDANCE & LEAVES', 'attendance', 'Teacher Attendance & Leaves', 7),
          _DrawerNavItem('ATTENDANCE & LEAVES', 'calendar', 'School Holidays', 8),
          _DrawerNavItem('ACADEMICS & FACILITIES', 'graduation_cap', 'Classes & Sections', 9),
          _DrawerNavItem('ACADEMICS & FACILITIES', 'graduation_cap', 'Classrooms & Labs', 10),
          _DrawerNavItem('ACADEMICS & FACILITIES', 'graduation_cap', 'Subjects', 11),
          _DrawerNavItem('ACADEMICS & FACILITIES', 'calendar', 'Timetable', 12),
          _DrawerNavItem('TRANSPORT', 'bus', 'Fleet & Bus Routes', 13),
          _DrawerNavItem('FINANCE & PAYROLL', 'receipt', 'Student Fees', 14),
          _DrawerNavItem('FINANCE & PAYROLL', 'receipt', 'Employee Payroll', 15),
          _DrawerNavItem('EXAMS & COMMUNICATION', 'award', 'Exams', 16),
          _DrawerNavItem('EXAMS & COMMUNICATION', 'award', 'Marks & Results', 17),
          _DrawerNavItem('EXAMS & COMMUNICATION', 'bell', 'Notice Board', 18),
          _DrawerNavItem('GOVERNANCE & SECURITY', 'bell', 'Join Requests', 19),
          _DrawerNavItem('GOVERNANCE & SECURITY', 'bell', 'Recycle Bin (30-Day)', 20),
          _DrawerNavItem('GOVERNANCE & SECURITY', 'shield_check', 'Login History', 21),
          _DrawerNavItem('GOVERNANCE & SECURITY', 'shield_check', 'Deletion Requests', 22),
          _DrawerNavItem('GOVERNANCE & SECURITY', 'sparkles', 'School Settings', 23),
        ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final user = auth.currentUser;
    final isSuperAdmin = user.role == UserRole.superAdmin;
    final navItems = _itemsFor(user.role);
    final sectionedItems = <String, List<_DrawerNavItem>>{};
    for (final item in navItems) {
      sectionedItems.putIfAbsent(item.section, () => []).add(item);
    }

    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            // Drawer Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    alignment: Alignment.center,
                    child: const AppSvgIcon('sparkles',
                        size: 20, color: Colors.white),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isSuperAdmin ? 'Platform Console' : user.schoolName,
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 14),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const Text(
                          'K-12 Cloud Suite',
                          style: TextStyle(
                              color: AppColors.textSecondary, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Navigation Sections
            Expanded(
              child: ListView(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                children: sectionedItems.entries.expand((entry) {
                  return [
                    _SectionHeader(title: entry.key),
                    ...entry.value.map((item) => _DrawerTile(
                          icon: item.icon,
                          title: item.title,
                          onTap: () {
                            Navigator.pop(context);
                            onNavigate(item.index);
                          },
                        )),
                    const SizedBox(height: 12),
                  ];
                }).toList(),
              ),
            ),

            // Bottom Profile & Logout
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  UserAvatar(
                      name: user.name, imageUrl: user.avatarUrl, radius: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user.name,
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 12),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          user.roleDisplayName,
                          style: const TextStyle(
                              color: AppColors.textMuted, fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const AppSvgIcon('logout',
                        size: 18, color: AppColors.danger),
                    onPressed: () {
                      Navigator.pop(context);
                      auth.logout();
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DrawerNavItem {
  final String section;
  final String icon;
  final String title;
  final int index;

  const _DrawerNavItem(this.section, this.icon, this.title, this.index);
}

class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 8, top: 12, bottom: 6),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: AppColors.textMuted,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _DrawerTile extends StatelessWidget {
  final String icon;
  final String title;
  final VoidCallback onTap;

  const _DrawerTile({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      visualDensity: VisualDensity.compact,
      contentPadding: const EdgeInsets.symmetric(horizontal: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      leading: AppSvgIcon(icon, size: 18, color: AppColors.textSecondary),
      title: Text(
        title,
        style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: AppColors.textPrimary),
      ),
      onTap: onTap,
    );
  }
}
