import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';

class OnboardingView extends StatelessWidget {
  final VoidCallback onContinue;

  const OnboardingView({super.key, required this.onContinue});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Row(
                children: [
                  AppSvgIcon('graduation_cap', size: 30, color: AppColors.primary),
                  SizedBox(width: 10),
                  Text('GI Campus', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                ],
              ),
              const Spacer(),
              const Text(
                'One app for daily school work',
                style: TextStyle(fontSize: 30, height: 1.12, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 12),
              const Text(
                'Students, parents, teachers, drivers, and admins use their real school ID to access the right workspace.',
                style: TextStyle(fontSize: 14, height: 1.45, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 28),
              const _Feature(icon: 'attendance', title: 'Attendance and classes', body: 'Teachers can work with live student rosters and daily records.'),
              const _Feature(icon: 'receipt', title: 'Fees and notices', body: 'Families see dues, receipts, and school announcements in one place.'),
              const _Feature(icon: 'bus', title: 'Transport visibility', body: 'Routes, stops, and boarding flows stay tied to school data.'),
              const Spacer(),
              ElevatedButton(
                onPressed: onContinue,
                child: const Text('Continue to Sign In'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Feature extends StatelessWidget {
  final String icon;
  final String title;
  final String body;

  const _Feature({required this.icon, required this.title, required this.body});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(10)),
            alignment: Alignment.center,
            child: AppSvgIcon(icon, size: 20, color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                const SizedBox(height: 3),
                Text(body, style: const TextStyle(fontSize: 12, height: 1.35, color: AppColors.textSecondary)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
