import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import 'app_svg_icon.dart';
import 'user_avatar.dart';
import '../../data/services/auth_service.dart';

class AppDrawer extends StatelessWidget {
  final Function(int) onNavigate;

  const AppDrawer({super.key, required this.onNavigate});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final user = auth.currentUser;

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
                    child: const AppSvgIcon('sparkles', size: 20, color: Colors.white),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user.schoolName,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const Text(
                          'K-12 Cloud Suite',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
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
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                children: [
                  const _SectionHeader(title: 'MAIN WORKSPACE'),
                  _DrawerTile(
                    icon: 'dashboard',
                    title: 'Dashboard Overview',
                    onTap: () {
                      Navigator.pop(context);
                      onNavigate(0);
                    },
                  ),
                  _DrawerTile(
                    icon: 'attendance',
                    title: 'Attendance & Leaves',
                    onTap: () {
                      Navigator.pop(context);
                      onNavigate(1);
                    },
                  ),
                  _DrawerTile(
                    icon: 'graduation_cap',
                    title: 'Students & Classes',
                    onTap: () {
                      Navigator.pop(context);
                      onNavigate(2);
                    },
                  ),

                  const SizedBox(height: 12),
                  const _SectionHeader(title: 'ACADEMICS & SERVICES'),
                  _DrawerTile(
                    icon: 'award',
                    title: 'Exams & Results',
                    onTap: () {
                      Navigator.pop(context);
                      onNavigate(3);
                    },
                  ),
                  _DrawerTile(
                    icon: 'receipt',
                    title: 'Fees & Invoices',
                    onTap: () {
                      Navigator.pop(context);
                      onNavigate(2);
                    },
                  ),
                  _DrawerTile(
                    icon: 'bus',
                    title: 'Transport & GPS Bus',
                    onTap: () {
                      Navigator.pop(context);
                      onNavigate(3);
                    },
                  ),
                  _DrawerTile(
                    icon: 'bell',
                    title: 'Notice Board & Alerts',
                    onTap: () {
                      Navigator.pop(context);
                      onNavigate(4);
                    },
                  ),
                ],
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
                  UserAvatar(name: user.name, imageUrl: user.avatarUrl, radius: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user.name,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          user.roleDisplayName,
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const AppSvgIcon('logout', size: 18, color: AppColors.danger),
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
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textPrimary),
      ),
      onTap: onTap,
    );
  }
}
