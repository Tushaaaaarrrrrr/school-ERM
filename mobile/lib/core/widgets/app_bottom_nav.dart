import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'app_svg_icon.dart';
import '../../data/models/user_model.dart';

class NavItemData {
  final String label;
  final String icon;

  const NavItemData({required this.label, required this.icon});
}

class AppBottomNav extends StatelessWidget {
  final UserRole role;
  final int currentIndex;
  final ValueChanged<int> onTap;

  const AppBottomNav({
    super.key,
    required this.role,
    required this.currentIndex,
    required this.onTap,
  });

  List<NavItemData> _getNavItems() {
    switch (role) {
      case UserRole.teacher:
        return const [
          NavItemData(label: 'Home', icon: 'dashboard'),
          NavItemData(label: 'Attendance', icon: 'attendance'),
          NavItemData(label: 'Classes', icon: 'teacher'),
          NavItemData(label: 'Exams', icon: 'award'),
          NavItemData(label: 'Schedule', icon: 'calendar'),
        ];
      case UserRole.student:
      case UserRole.parent:
        return const [
          NavItemData(label: 'Home', icon: 'dashboard'),
          NavItemData(label: 'Results', icon: 'award'),
          NavItemData(label: 'Fees', icon: 'receipt'),
          NavItemData(label: 'Transport', icon: 'bus'),
          NavItemData(label: 'Profile', icon: 'id_card'),
        ];
      case UserRole.schoolAdmin:
      case UserRole.superAdmin:
      case UserRole.staff:
        return const [
          NavItemData(label: 'Overview', icon: 'dashboard'),
          NavItemData(label: 'Students', icon: 'graduation_cap'),
          NavItemData(label: 'Attendance', icon: 'attendance'),
          NavItemData(label: 'Fees', icon: 'receipt'),
          NavItemData(label: 'Notices', icon: 'bell'),
        ];
      case UserRole.driver:
        return const [
          NavItemData(label: 'Dashboard', icon: 'bus'),
          NavItemData(label: 'Route Stops', icon: 'map_pin'),
          NavItemData(label: 'Boarding', icon: 'id_card'),
        ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = _getNavItems();
    final clampedIndex = currentIndex.clamp(0, items.length - 1);

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
          height: 60,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(items.length, (index) {
              final item = items[index];
              final isSelected = index == clampedIndex;
              return Expanded(
                child: InkWell(
                  onTap: () => onTap(index),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      AppSvgIcon(
                        item.icon,
                        size: 20,
                        color: isSelected ? AppColors.primary : AppColors.textMuted,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.label,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                          color: isSelected ? AppColors.primary : AppColors.textSecondary,
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
