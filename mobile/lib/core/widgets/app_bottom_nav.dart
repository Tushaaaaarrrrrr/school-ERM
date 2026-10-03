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
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.border, width: 1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 8,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 66,
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
                      offset: const Offset(0, -14),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 54,
                            height: 54,
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 4),
                              boxShadow: const [
                                BoxShadow(
                                  color: Colors.black26,
                                  blurRadius: 12,
                                  offset: Offset(0, 4),
                                ),
                              ],
                            ),
                            child: const Icon(Icons.add,
                                color: Colors.white, size: 28),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Create',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }
              if (item.isMoreAction) {
                return Expanded(
                  child: InkWell(
                    onTap: onMore,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                              color: currentIndex == -1
                                  ? AppColors.primaryLight
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(20)),
                          child: Icon(Icons.grid_view_rounded,
                              size: 21,
                              color: currentIndex == -1
                                  ? AppColors.primary
                                  : AppColors.textMuted),
                        ),
                        const SizedBox(height: 4),
                        Text('More',
                            style: TextStyle(
                                fontSize: 10,
                                fontWeight: currentIndex == -1
                                    ? FontWeight.w600
                                    : FontWeight.w500,
                                color: currentIndex == -1
                                    ? AppColors.primary
                                    : AppColors.textSecondary)),
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
                        duration: const Duration(milliseconds: 180),
                        curve: Curves.easeOut,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primaryLight
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: AppSvgIcon(
                          item.icon,
                          size: 20,
                          color: isSelected
                              ? AppColors.primary
                              : AppColors.textMuted,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.label,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight:
                              isSelected ? FontWeight.bold : FontWeight.w500,
                          color: isSelected
                              ? AppColors.primary
                              : AppColors.textSecondary,
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
