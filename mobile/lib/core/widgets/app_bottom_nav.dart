import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'app_svg_icon.dart';
import '../../data/models/user_model.dart';

class NavItemData {
  final String label;
  final String icon;
  final int? screenIndex;
  final bool isPrimaryAction;
  final bool isMoreAction;

  const NavItemData({
    required this.label,
    required this.icon,
    this.screenIndex,
    this.isPrimaryAction = false,
    this.isMoreAction = false,
  });
}

class AppBottomNav extends StatelessWidget {
  final UserRole role;
  final int currentIndex;
  final ValueChanged<int> onTap;
  final VoidCallback? onCreateStudent;
  final VoidCallback? onMore;

  const AppBottomNav({
    super.key,
    required this.role,
    required this.currentIndex,
    required this.onTap,
    this.onCreateStudent,
    this.onMore,
  });

  List<NavItemData> _getNavItems() {
    switch (role) {
      case UserRole.teacher:
        return const [
          NavItemData(label: 'Home', icon: 'dashboard'),
          NavItemData(label: 'Roll Call', icon: 'attendance'),
          NavItemData(label: 'Classes', icon: 'teacher', screenIndex: 3),
          NavItemData(label: 'Exams', icon: 'award', screenIndex: 4),
          NavItemData(label: 'More', icon: 'sparkles', isMoreAction: true),
        ];
      case UserRole.student:
      case UserRole.parent:
        return const [
          NavItemData(label: 'Home', icon: 'dashboard'),
          NavItemData(label: 'Classes', icon: 'calendar'),
          NavItemData(label: 'Bus', icon: 'bus'),
          NavItemData(label: 'Fees', icon: 'receipt', screenIndex: 4),
          NavItemData(label: 'More', icon: 'sparkles', isMoreAction: true),
        ];
      case UserRole.superAdmin:
        return const [
          NavItemData(label: 'Overview', icon: 'dashboard'),
          NavItemData(label: 'Schools', icon: 'graduation_cap'),
          NavItemData(label: 'Users', icon: 'teacher'),
          NavItemData(label: 'Requests', icon: 'bell'),
          NavItemData(label: 'More', icon: 'sparkles', isMoreAction: true),
        ];
      case UserRole.schoolAdmin:
        return const [
          NavItemData(label: 'Home', icon: 'dashboard', screenIndex: 0),
          NavItemData(
              label: 'Students', icon: 'graduation_cap', screenIndex: 1),
          NavItemData(
            label: 'Create',
            icon: 'graduation_cap',
            isPrimaryAction: true,
          ),
          NavItemData(label: 'Fees', icon: 'receipt', screenIndex: 14),
          NavItemData(label: 'More', icon: 'sparkles', isMoreAction: true),
        ];
      case UserRole.accountant:
        return const [
          NavItemData(label: 'Home', icon: 'dashboard'),
          NavItemData(label: 'Fees', icon: 'receipt'),
          NavItemData(label: 'Payroll', icon: 'receipt'),
          NavItemData(label: 'More', icon: 'sparkles', isMoreAction: true),
        ];
      case UserRole.staff:
        return const [
          NavItemData(label: 'Overview', icon: 'dashboard'),
          NavItemData(label: 'Fees', icon: 'receipt', screenIndex: 2),
          NavItemData(
              label: 'Students', icon: 'graduation_cap', screenIndex: 3),
          NavItemData(label: 'More', icon: 'sparkles', isMoreAction: true),
        ];
      case UserRole.driver:
        return const [
          NavItemData(label: 'Dashboard', icon: 'bus'),
          NavItemData(label: 'Route Stops', icon: 'map_pin'),
          NavItemData(label: 'Boarding', icon: 'id_card'),
          NavItemData(label: 'More', icon: 'sparkles', isMoreAction: true),
        ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = _getNavItems();

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border:
            const Border(top: BorderSide(color: AppColors.border, width: 1)),
        boxShadow: [
          BoxShadow(
            color: AppColors.secondary.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 68,
          child: Row(
            children: List.generate(items.length, (index) {
              final item = items[index];
              final targetIndex = item.screenIndex ?? index;
              final isSelected =
                  !item.isPrimaryAction && currentIndex == targetIndex;
              if (item.isPrimaryAction) {
                return Expanded(
                  child: InkWell(
                    onTap: onCreateStudent,
                    child: Transform.translate(
                      offset: const Offset(0, -12),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [
                                  AppColors.primary,
                                  AppColors.primaryDark
                                ],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 3),
                              boxShadow: [
                                BoxShadow(
                                  color:
                                      AppColors.primary.withValues(alpha: 0.35),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: const Icon(Icons.add_rounded,
                                color: Colors.white, size: 28),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Create',
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primaryDark,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }
              if (item.isMoreAction) {
                final isMoreSelected = currentIndex == -1;
                return Expanded(
                  child: InkWell(
                    onTap: onMore,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          curve: Curves.easeOutCubic,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 4),
                          decoration: BoxDecoration(
                            color: isMoreSelected
                                ? AppColors.primaryLight
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Icon(
                            Icons.grid_view_rounded,
                            size: 20,
                            color: isMoreSelected
                                ? AppColors.primaryDark
                                : AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          'More',
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: isMoreSelected
                                ? FontWeight.w700
                                : FontWeight.w600,
                            color: isMoreSelected
                                ? AppColors.primaryDark
                                : AppColors.textSecondary,
                            letterSpacing: 0.1,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }
              return Expanded(
                child: InkWell(
                  onTap: () => onTap(targetIndex),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        curve: Curves.easeOutCubic,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 4),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primaryLight
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: AppSvgIcon(
                          item.icon,
                          size: 20,
                          color: isSelected
                              ? AppColors.primaryDark
                              : AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        item.label,
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight:
                              isSelected ? FontWeight.w700 : FontWeight.w600,
                          color: isSelected
                              ? AppColors.primaryDark
                              : AppColors.textSecondary,
                          letterSpacing: 0.1,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}
