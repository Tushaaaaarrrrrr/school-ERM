import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import 'app_svg_icon.dart';
import '../../data/services/auth_service.dart';
import '../../data/models/user_model.dart';
import '../../viewmodels/student_viewmodel.dart';

class AppTopHeader extends StatelessWidget implements PreferredSizeWidget {
  final GlobalKey<ScaffoldState>? scaffoldKey;

  const AppTopHeader({super.key, this.scaffoldKey});

  @override
  Size get preferredSize => const Size.fromHeight(60);

  void _showYearPicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Row(
                  children: [
                    AppSvgIcon('calendar', size: 20, color: AppColors.primary),
                    SizedBox(width: 10),
                    Text(
                      'Select Academic Year',
                      style:
                          TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  leading: const AppSvgIcon('sparkles',
                      size: 20, color: AppColors.primary),
                  title: const Text('2026 - 2027 (Current Academic Year)',
                      style:
                          TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  trailing: const Icon(Icons.check_circle_rounded,
                      color: AppColors.success, size: 22),
                  onTap: () => Navigator.pop(context),
                ),
                ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  leading: const AppSvgIcon('calendar',
                      size: 20, color: AppColors.textSecondary),
                  title: const Text('2025 - 2026 (Previous Year Archive)',
                      style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textSecondary)),
                  onTap: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final isSuperAdmin = auth.currentUser.role == UserRole.superAdmin;
    final title =
        isSuperAdmin ? 'Platform Console' : auth.currentUser.schoolName;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border:
            const Border(bottom: BorderSide(color: AppColors.border, width: 1)),
        boxShadow: [
          BoxShadow(
            color: AppColors.secondary.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: SizedBox(
          height: 60,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Row(
              children: [
                // Hamburger Drawer Button (48dp touch target)
                IconButton(
                  icon: const Icon(Icons.menu_rounded,
                      color: AppColors.textPrimary, size: 22),
                  tooltip: 'Open navigation drawer',
                  onPressed: () {
                    if (scaffoldKey != null &&
                        scaffoldKey!.currentState != null) {
                      scaffoldKey!.currentState!.openDrawer();
                    }
                  },
                ),
                const SizedBox(width: 4),

                // School Badge Icon
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.18),
                      width: 1,
                    ),
                  ),
                  alignment: Alignment.center,
                  child: AppSvgIcon(
                    isSuperAdmin ? 'shield_check' : 'graduation_cap',
                    size: 18,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 10),

                // School Workspace Name & Role Subtitle
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 13.5,
                          letterSpacing: -0.2,
                          color: AppColors.textPrimary,
                        ),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                      Text(
                        isSuperAdmin
                            ? 'Enterprise Platform'
                            : auth.currentUser.roleDisplayName,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textSecondary,
                        ),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ],
                  ),
                ),

                // Refresh Button (min 48dp touch target)
                IconButton(
                  icon: const Icon(Icons.refresh_rounded,
                      size: 20, color: AppColors.textPrimary),
                  tooltip: 'Refresh data',
                  onPressed: () async {
                    final auth = context.read<AuthService>();
                    if (auth.currentUser.role == UserRole.student ||
                        auth.currentUser.role == UserRole.parent) {
                      await context
                          .read<StudentViewModel>()
                          .refresh(auth.currentUser);
                    }
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Data refreshed'),
                          duration: Duration(seconds: 1),
                        ),
                      );
                    }
                  },
                ),

                // Right Action: Academic Year Badge Picker (min 48dp touch target)
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => _showYearPicker(context),
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 4, vertical: 8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 9, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            AppSvgIcon('calendar',
                                size: 13, color: AppColors.primary),
                            SizedBox(width: 5),
                            Text(
                              '26-27',
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            Icon(Icons.keyboard_arrow_down_rounded,
                                size: 16, color: AppColors.textSecondary),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
