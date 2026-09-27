import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class AppSvgIcon extends StatelessWidget {
  final String assetName;
  final double size;
  final Color? color;

  const AppSvgIcon(
    this.assetName, {
    super.key,
    this.size = 20,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final String fullPath = assetName.startsWith('assets/')
        ? assetName
        : 'assets/icons/$assetName.svg';

    return SvgPicture.asset(
      fullPath,
      width: size,
      height: size,
      colorFilter: color != null
          ? ColorFilter.mode(color!, BlendMode.srcIn)
          : null,
    );
  }
}
