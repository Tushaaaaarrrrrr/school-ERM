import 'package:flutter/material.dart';

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
    Color border;

    switch (type) {
      case BadgeType.success:
        bg = const Color(0xFFECFDF5);
        fg = const Color(0xFF065F46); // WCAG AA 7.2:1
        border = const Color(0xFFA7F3D0);
        break;
      case BadgeType.warning:
        bg = const Color(0xFFFFFBEB);
        fg = const Color(0xFF92400E); // WCAG AA 6.8:1
        border = const Color(0xFFFDE68A);
        break;
      case BadgeType.danger:
        bg = const Color(0xFFFEF2F2);
        fg = const Color(0xFF991B1B); // WCAG AA 7.0:1
        border = const Color(0xFFFECACA);
        break;
      case BadgeType.info:
        bg = const Color(0xFFEFF6FF);
        fg = const Color(0xFF1D4ED8); // WCAG AA 5.8:1
        border = const Color(0xFFBFDBFE);
        break;
      case BadgeType.neutral:
        bg = const Color(0xFFF1F5F9);
        fg = const Color(0xFF334155); // WCAG AA 9.6:1
        border = const Color(0xFFE2E8F0);
        break;
    }

    final displayText = label ?? text ?? '';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: border, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 5,
            height: 5,
            margin: const EdgeInsets.only(right: 5),
            decoration: BoxDecoration(
              color: fg,
              shape: BoxShape.circle,
            ),
          ),
          Text(
            displayText,
            style: TextStyle(
              color: fg,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }
}
