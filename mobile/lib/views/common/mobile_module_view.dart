import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_svg_icon.dart';

class MobileModuleView extends StatelessWidget {
  final String title;
  final String icon;
  final List<String> items;

  const MobileModuleView({
    super.key,
    required this.title,
    required this.icon,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              AppSvgIcon(icon, size: 22, color: AppColors.primary),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Card(
            child: Column(
              children: items
                  .map(
                    (item) => ListTile(
                      leading: const Icon(Icons.check_circle_outline,
                          size: 18, color: AppColors.primary),
                      title: Text(
                        item,
                        style: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w700),
                      ),
                    ),
                  )
                  .expand((child) => [child, const Divider(height: 1)])
                  .toList()
                ..removeLast(),
            ),
          ),
        ],
      ),
    );
  }
}
