import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import 'app_svg_icon.dart';
import 'status_badge.dart';
import 'user_avatar.dart';
import '../../data/services/auth_service.dart';
import '../../data/models/user_model.dart';

class AppDrawer extends StatelessWidget {
  final Function(int) onNavigate;
  final int? currentIndex;

  const AppDrawer({super.key, required this.onNavigate, this.currentIndex});

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
          _DrawerNavItem(
              'FACULTY WORKSPACE', 'attendance', 'Student Roll Call', 1),
          _DrawerNavItem(
              'FACULTY WORKSPACE', 'attendance', 'My Attendance & Leave', 2),
          _DrawerNavItem(
              'FACULTY WORKSPACE', 'teacher', 'My Classes & Rosters', 3),
          _DrawerNavItem('FACULTY WORKSPACE', 'award', 'Exams & Marks', 4),
          _DrawerNavItem(
              'FACULTY WORKSPACE', 'calendar', 'Teaching Schedule', 5),
          _DrawerNavItem(
              'FACULTY WORKSPACE', 'receipt', 'Salary Statements', 6),
        ];
      case UserRole.student:
      case UserRole.parent:
        return const [
          _DrawerNavItem('STUDENT WORKSPACE', 'dashboard', 'Dashboard', 0),
          _DrawerNavItem(
              'STUDENT WORKSPACE', 'calendar', 'Classes & Timetable', 1),
          _DrawerNavItem('STUDENT WORKSPACE', 'bus', 'Bus Transport', 2),
          _DrawerNavItem('STUDENT WORKSPACE', 'award', 'Exam Results', 3),
          _DrawerNavItem('STUDENT WORKSPACE', 'receipt', 'Fee Statements', 4),
          _DrawerNavItem(
              'STUDENT WORKSPACE', 'id_card', 'Profile & Attendance', 5),
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
          _DrawerNavItem(
              'STAFF WORKSPACE', 'graduation_cap', 'Student Directory', 3),
          _DrawerNavItem(
              'STAFF WORKSPACE', 'attendance', 'Daily Attendance', 4),
          _DrawerNavItem('STAFF WORKSPACE', 'bell', 'Notice Board', 5),
        ];
      case UserRole.accountant:
        return const [
          _DrawerNavItem('FINANCE WORKSPACE', 'dashboard', 'Dashboard', 0),
          _DrawerNavItem('FINANCE WORKSPACE', 'receipt', 'Student Fees', 1),
          _DrawerNavItem('FINANCE WORKSPACE', 'receipt', 'Employee Payroll', 2),
          _DrawerNavItem(
              'FINANCE WORKSPACE', 'graduation_cap', 'Student Directory', 3),
          _DrawerNavItem('GOVERNANCE', 'shield_check', 'Login History', 4),
        ];
      case UserRole.schoolAdmin:
        return const [
          _DrawerNavItem('MAIN', 'dashboard', 'Dashboard', 0),
          _DrawerNavItem(
              'PEOPLE & OPERATIONS', 'graduation_cap', 'Students', 1),
          _DrawerNavItem('PEOPLE & OPERATIONS', 'teacher', 'Teachers', 2),
          _DrawerNavItem(
              'PEOPLE & OPERATIONS', 'teacher', 'Staff & Support', 3),
          _DrawerNavItem(
              'PEOPLE & OPERATIONS', 'bell', 'Reception & Enquiries', 4),
          _DrawerNavItem(
              'ATTENDANCE & LEAVES', 'attendance', 'Student Attendance', 5),
          _DrawerNavItem(
              'ATTENDANCE & LEAVES', 'calendar', 'Student Leaves', 6),
          _DrawerNavItem('ATTENDANCE & LEAVES', 'attendance',
              'Teacher Attendance & Leaves', 7),
          _DrawerNavItem(
              'ATTENDANCE & LEAVES', 'calendar', 'School Holidays', 8),
          _DrawerNavItem(
              'ACADEMICS & FACILITIES', 'graduation_cap', 'Classes & Sections', 9),
          _DrawerNavItem('ACADEMICS & FACILITIES', 'graduation_cap',
              'Classrooms & Labs', 10),
          _DrawerNavItem(
              'ACADEMICS & FACILITIES', 'graduation_cap', 'Subjects', 11),
          _DrawerNavItem(
              'ACADEMICS & FACILITIES', 'calendar', 'Timetable', 12),
          _DrawerNavItem('TRANSPORT', 'bus', 'Fleet & Bus Routes', 13),
          _DrawerNavItem('FINANCE & PAYROLL', 'receipt', 'Student Fees', 14),
          _DrawerNavItem(
              'FINANCE & PAYROLL', 'receipt', 'Employee Payroll', 15),
          _DrawerNavItem('EXAMS & COMMUNICATION', 'award', 'Exams', 16),
          _DrawerNavItem(
              'EXAMS & COMMUNICATION', 'award', 'Marks & Results', 17),
          _DrawerNavItem('EXAMS & COMMUNICATION', 'bell', 'Notice Board', 18),
          _DrawerNavItem('GOVERNANCE & SECURITY', 'bell', 'Join Requests', 19),
          _DrawerNavItem(
              'GOVERNANCE & SECURITY', 'bell', 'Recycle Bin (30-Day)', 20),
          _DrawerNavItem(
              'GOVERNANCE & SECURITY', 'shield_check', 'Login History', 21),
          _DrawerNavItem(
              'GOVERNANCE & SECURITY', 'shield_check', 'Deletion Requests', 22),
          _DrawerNavItem(
              'GOVERNANCE & SECURITY', 'sparkles', 'School Settings', 23),
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
            // Sleek Drawer Header with School Logo & Role Badge
            Container(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
              decoration: const BoxDecoration(
                border:
                    Border(bottom: BorderSide(color: AppColors.border, width: 1)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.primary, AppColors.primaryDark],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.25),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    alignment: Alignment.center,
                    child: AppSvgIcon(
                      isSuperAdmin ? 'shield_check' : 'graduation_cap',
                      size: 22,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isSuperAdmin ? 'Platform Console' : user.schoolName,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 14.5,
                            letterSpacing: -0.2,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 3),
                        Row(
                          children: [
                            StatusBadge(
                              label: user.roleDisplayName.toUpperCase(),
                              type: isSuperAdmin
                                  ? StatusType.danger
                                  : StatusType.info,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Navigation Sections with Active Highlights
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                children: sectionedItems.entries.expand((entry) {
                  return [
                    _SectionHeader(title: entry.key),
                    ...entry.value.map((item) {
                      final isSelected =
                          currentIndex != null && item.index == currentIndex;
                      return _DrawerTile(
                        icon: item.icon,
                        title: item.title,
                        isSelected: isSelected,
                        onTap: () {
                          Navigator.pop(context);
                          onNavigate(item.index);
                        },
                      );
                    }),
                    const SizedBox(height: 8),
                  ];
                }).toList(),
              ),
            ),

            // Bottom Profile & Clean Logout Item
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: const BoxDecoration(
                color: Colors.white,
                border:
                    Border(top: BorderSide(color: AppColors.border, width: 1)),
              ),
              child: Row(
                children: [
                  UserAvatar(
                    name: user.name,
                    imageUrl: user.avatarUrl,
                    radius: 19,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 12.5,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          user.roleDisplayName,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  Tooltip(
                    message: 'Sign Out',
                    child: Material(
                      color: AppColors.dangerLight,
                      borderRadius: BorderRadius.circular(10),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(10),
                        onTap: () {
                          Navigator.pop(context);
                          auth.logout();
                        },
                        child: const Padding(
                          padding: EdgeInsets.all(10),
                          child: AppSvgIcon('logout',
                              size: 18, color: AppColors.danger),
                        ),
                      ),
                    ),
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
      padding: const EdgeInsets.only(left: 10, top: 12, bottom: 6),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 10.5,
          fontWeight: FontWeight.w700,
          color: AppColors.textSecondary,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _DrawerTile extends StatelessWidget {
  final String icon;
  final String title;
  final bool isSelected;
  final VoidCallback onTap;

  const _DrawerTile({
    required this.icon,
    required this.title,
    this.isSelected = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 2),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.primaryLight : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        border: isSelected
            ? Border.all(
                color: AppColors.primary.withValues(alpha: 0.2), width: 1)
            : null,
      ),
      child: ListTile(
        dense: true,
        minLeadingWidth: 24,
        minVerticalPadding: 8,
        contentPadding: const EdgeInsets.symmetric(horizontal: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        leading: AppSvgIcon(
          icon,
          size: 19,
          color: isSelected ? AppColors.primaryDark : AppColors.textSecondary,
        ),
        title: Text(
          title,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? AppColors.primaryDark : AppColors.textPrimary,
          ),
        ),
        onTap: onTap,
      ),
    );
  }
}
