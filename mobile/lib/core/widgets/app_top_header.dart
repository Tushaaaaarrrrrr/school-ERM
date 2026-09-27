import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import 'app_svg_icon.dart';
import '../../data/models/user_model.dart';
import '../../data/services/auth_service.dart';

class AppTopHeader extends StatelessWidget implements PreferredSizeWidget {
  final GlobalKey<ScaffoldState>? scaffoldKey;

  const AppTopHeader({super.key, this.scaffoldKey});

  @override
  Size get preferredSize => const Size.fromHeight(60);

  void _showYearPicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  AppSvgIcon('calendar', size: 18, color: AppColors.primary),
                  SizedBox(width: 10),
                  Text(
                    'Select Academic Year',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const AppSvgIcon('sparkles', size: 18, color: AppColors.primary),
                title: const Text('2026 - 2027 (Current Academic Year)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                trailing: const Icon(Icons.check_circle, color: AppColors.success, size: 20),
                onTap: () => Navigator.pop(context),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const AppSvgIcon('calendar', size: 18, color: AppColors.textMuted),
                title: const Text('2025 - 2026 (Previous Year Archive)', style: TextStyle(fontSize: 14)),
                onTap: () => Navigator.pop(context),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showRoleSwitcher(BuildContext context, AuthService auth) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  AppSvgIcon('shield_check', size: 18, color: AppColors.primary),
                  SizedBox(width: 10),
                  Text(
                    '1-Click Switch Persona',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Explore any role workspace instantly without re-logging:',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
              const SizedBox(height: 16),
              _RoleOption(
                iconName: 'teacher',
                title: 'Teacher (Rajesh Sir)',
                role: 'Classes, Attendance & Mark Entry',
                isSelected: auth.currentUser.role == UserRole.teacher,
                onTap: () {
                  auth.switchPersona(UserRole.teacher);
                  Navigator.pop(context);
                },
              ),
              const SizedBox(height: 8),
              _RoleOption(
                iconName: 'graduation_cap',
                title: 'Student (Rahul Verma)',
                role: 'Results, Fees & Bus Transport',
                isSelected: auth.currentUser.role == UserRole.student,
                onTap: () {
                  auth.switchPersona(UserRole.student);
                  Navigator.pop(context);
                },
              ),
              const SizedBox(height: 8),
              _RoleOption(
                iconName: 'shield_check',
                title: 'School Admin (Anita Roy)',
                role: 'Students, Staff, Payroll & Fees',
                isSelected: auth.currentUser.role == UserRole.schoolAdmin,
                onTap: () {
                  auth.switchPersona(UserRole.schoolAdmin);
                  Navigator.pop(context);
                },
              ),
              const SizedBox(height: 8),
              _RoleOption(
                iconName: 'bus',
                title: 'Bus Driver (Gurmeet Singh)',
                role: 'Route Stops & Boarding',
                isSelected: auth.currentUser.role == UserRole.driver,
                onTap: () {
                  auth.switchPersona(UserRole.driver);
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: AppColors.border, width: 1)),
      ),
      child: SafeArea(
        bottom: false,
        child: Container(
          height: 60,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(
            children: [
              // Hamburger Drawer Button
              IconButton(
                icon: const Icon(Icons.menu, color: AppColors.textPrimary, size: 22),
                onPressed: () {
                  if (scaffoldKey != null && scaffoldKey!.currentState != null) {
                    scaffoldKey!.currentState!.openDrawer();
                  }
                },
              ),
              const SizedBox(width: 4),

              // School Name + Tenant Pill
              Expanded(
                child: Row(
                  children: [
                    Flexible(
                      child: Text(
                        auth.currentUser.schoolName,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: AppColors.textPrimary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        auth.currentUser.schoolCode,
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Right Actions: Academic Year + Persona Switcher
              InkWell(
                onTap: () => _showYearPicker(context),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Row(
                    children: [
                      AppSvgIcon('calendar', size: 12, color: AppColors.textSecondary),
                      SizedBox(width: 4),
                      Text('26-27', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                      Icon(Icons.arrow_drop_down, size: 14, color: AppColors.textMuted),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 6),

              // Persona Switcher Pill
              InkWell(
                onTap: () => _showRoleSwitcher(context, auth),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const AppSvgIcon('sparkles', size: 12, color: AppColors.primary),
                      const SizedBox(width: 4),
                      Text(
                        auth.currentUser.roleDisplayName.split(' ')[0],
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                      const Icon(Icons.arrow_drop_down, size: 14, color: AppColors.primary),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleOption extends StatelessWidget {
  final String iconName;
  final String title;
  final String role;
  final bool isSelected;
  final VoidCallback onTap;

  const _RoleOption({
    required this.iconName,
    required this.title,
    required this.role,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryLight : AppColors.background,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primary : Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
              alignment: Alignment.center,
              child: AppSvgIcon(
                iconName,
                size: 18,
                color: isSelected ? Colors.white : AppColors.primary,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: isSelected ? AppColors.primary : AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    role,
                    style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, color: AppColors.primary, size: 18),
          ],
        ),
      ),
    );
  }
}
