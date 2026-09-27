import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';
import '../../data/models/user_model.dart';
import '../../data/services/auth_service.dart';

class LoginView extends StatelessWidget {
  const LoginView({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),
              // Brand Logo & Header
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Image.asset(
                      'assets/icons/logo.png',
                      width: 48,
                      height: 48,
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'GI Campus',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                'Next-Gen Mobile Management',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 40),

              // 1-Click Role Switcher Demo Cards (Uses vector SVG icons!)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        AppSvgIcon('shield_check', size: 16, color: AppColors.primary),
                        SizedBox(width: 8),
                        Text(
                          '1-CLICK PERSONA LOGIN',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textSecondary,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _PersonaTile(
                      iconName: 'teacher',
                      title: 'Teacher Portal',
                      subtitle: 'Mark Attendance, Marks & Schedule',
                      isSelected: authService.currentUser.role == UserRole.teacher,
                      onTap: () => authService.switchPersona(UserRole.teacher),
                    ),
                    const SizedBox(height: 8),
                    _PersonaTile(
                      iconName: 'graduation_cap',
                      title: 'Student Portal',
                      subtitle: 'Results, Fees, Timetable & Bus',
                      isSelected: authService.currentUser.role == UserRole.student,
                      onTap: () => authService.switchPersona(UserRole.student),
                    ),
                    const SizedBox(height: 8),
                    _PersonaTile(
                      iconName: 'bus',
                      title: 'Bus Driver Portal',
                      subtitle: 'Route Stops & Student Boarding',
                      isSelected: authService.currentUser.role == UserRole.driver,
                      onTap: () => authService.switchPersona(UserRole.driver),
                    ),
                    const SizedBox(height: 8),
                    _PersonaTile(
                      iconName: 'shield_check',
                      title: 'Parent Portal',
                      subtitle: 'Fee Invoices, Report Cards & Tracking',
                      isSelected: authService.currentUser.role == UserRole.parent,
                      onTap: () => authService.switchPersona(UserRole.parent),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
              // Standard Credentials Login Form
              const TextField(
                decoration: InputDecoration(
                  labelText: 'Registration ID or Email',
                  prefixIcon: Padding(
                    padding: EdgeInsets.all(12),
                    child: AppSvgIcon('teacher', size: 18, color: AppColors.textMuted),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              const TextField(
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'Password',
                  prefixIcon: Padding(
                    padding: EdgeInsets.all(12),
                    child: AppSvgIcon('shield_check', size: 18, color: AppColors.textMuted),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: () {
                  authService.login('demo', 'password');
                },
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Enter as ${authService.currentUser.roleDisplayName}'),
                    const SizedBox(width: 8),
                    const AppSvgIcon('dashboard', size: 16, color: Colors.white),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'By continuing, you agree to GI Campus Terms and Conditions & Privacy Policy',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  color: AppColors.textMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PersonaTile extends StatelessWidget {
  final String iconName;
  final String title;
  final String subtitle;
  final bool isSelected;
  final VoidCallback onTap;

  const _PersonaTile({
    required this.iconName,
    required this.title,
    required this.subtitle,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryLight : AppColors.background,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 1.5 : 1,
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
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? AppColors.primary : AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              const AppSvgIcon('sparkles', size: 16, color: AppColors.primary),
          ],
        ),
      ),
    );
  }
}
