import 'dart:convert';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class UserAvatar extends StatelessWidget {
  final String? imageUrl;
  final String name;
  final double radius;

  const UserAvatar({
    super.key,
    required this.name,
    this.imageUrl,
    this.radius = 18,
  });

  static ImageProvider? imageProviderOf(String? rawUrl) {
    if (rawUrl == null) return null;
    final url = rawUrl.trim();
    if (url.isEmpty) return null;

    if (url.startsWith('data:image/') || url.startsWith('data:application/')) {
      try {
        final comma = url.indexOf(',');
        final b64 = comma != -1 ? url.substring(comma + 1) : url;
        final clean = b64.replaceAll(RegExp(r'\s+'), '');
        return MemoryImage(base64Decode(clean));
      } catch (_) {
        return null;
      }
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return NetworkImage(url);
    }

    return null;
  }

  @override
  Widget build(BuildContext context) {
    final provider = imageProviderOf(imageUrl);
    return CircleAvatar(
      radius: radius,
      backgroundColor: AppColors.primaryLight,
      backgroundImage: provider,
      onBackgroundImageError: provider != null ? (_, __) {} : null,
      child: provider == null
          ? Text(
              name.isNotEmpty ? name[0].toUpperCase() : 'U',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
                fontSize: radius * 0.8,
              ),
            )
          : null,
    );
  }
}
