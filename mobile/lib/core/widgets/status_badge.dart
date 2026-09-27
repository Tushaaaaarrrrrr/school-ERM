import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

enum BadgeType { success, warning, danger, info, neutral }
typedef StatusType = BadgeType;

class StatusBadge extends StatelessWidget {
  final String? text;
  final String? label;
  final BadgeType type;

  const StatusBadge({
    super.key,
    this.text,
    this.label,
    this.type = BadgeType.neutral,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;

    switch (type) {
      case BadgeType.success:
        bg = AppColors.successLight;
        fg = AppColors.success;
        break;
      case BadgeType.warning:
        bg = AppColors.warningLight;
        fg = AppColors.warning;
        break;
      case BadgeType.danger:
        bg = AppColors.dangerLight;
        fg = AppColors.danger;
        break;
      case BadgeType.info:
        bg = AppColors.infoLight;
        fg = AppColors.info;
        break;
      case BadgeType.neutral:
      default:
        bg = const Color(0xFFF1F5F9);
        fg = AppColors.textSecondary;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label ?? text ?? '',
        style: TextStyle(
          color: fg,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
