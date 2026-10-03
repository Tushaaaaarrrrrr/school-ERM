import 'package:flutter/material.dart';

class AppColors {
  static const Color primary = Color(0xFF4F46E5); // Indigo 600
  static const Color primaryDark = Color(0xFF4338CA); // Indigo 700
  static const Color primaryLight = Color(0xFFEEF2FF); // Indigo 50
  static const Color secondary = Color(0xFF0F172A); // Slate 900
  static const Color background = Color(0xFFF8FAFC); // Slate 50
  static const Color card = Colors.white;
  static const Color border = Color(0xFFE2E8F0); // Slate 200
  static const Color textPrimary = Color(0xFF0F172A); // Slate 900
  static const Color textSecondary = Color(0xFF64748B); // Slate 500
  static const Color textMuted = Color(0xFF94A3B8); // Slate 400

  // Semantic Colors
  static const Color success = Color(0xFF10B981); // Emerald 500
  static const Color successLight = Color(0xFFECFDF5);
  static const Color warning = Color(0xFFF59E0B); // Amber 500
  static const Color warningLight = Color(0xFFFFFBEB);
  static const Color danger = Color(0xFFEF4444); // Rose 500
  static const Color dangerLight = Color(0xFFFEF2F2);
  static const Color info = Color(0xFF3B82F6); // Blue 500
  static const Color infoLight = Color(0xFFEFF6FF);
}

/// Design tokens shared by theme and widgets.
class AppSpacing {
  static const double xs = 4, sm = 8, md = 12, lg = 16, xl = 24, xxl = 32;
}

class AppRadius {
  static const double sm = 8, md = 12, lg = 16, xl = 24;
}

class AppShadows {
  static List<BoxShadow> get soft => [
        BoxShadow(
          color: AppColors.secondary.withValues(alpha: 0.06),
          blurRadius: 12,
          offset: const Offset(0, 4),
        ),
      ];
}

class AppTheme {
  static const double minTap = 48;

  static ThemeData get lightTheme {
    final base = ThemeData.light().textTheme;
    TextStyle? s(TextStyle? t, Color c, double size, FontWeight w,
            {double? h}) =>
        t?.copyWith(color: c, fontSize: size, fontWeight: w, height: h);
    const p = AppColors.textPrimary;
    const sec = AppColors.textSecondary;

    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      primary: AppColors.primary,
      onPrimary: Colors.white,
      primaryContainer: AppColors.primaryLight,
      onPrimaryContainer: AppColors.primaryDark,
      secondary: AppColors.secondary,
      surface: Colors.white,
      onSurface: p,
      onSurfaceVariant: sec,
      outline: sec,
      outlineVariant: AppColors.border,
      error: const Color(0xFFDC2626),
    );
    RoundedRectangleBorder shape(double r) =>
        RoundedRectangleBorder(borderRadius: BorderRadius.circular(r));
    OutlineInputBorder border(Color c, [double w = 1]) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(color: c, width: w),
        );
    const minSize = Size(64, minTap);

    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.background,
      primaryColor: AppColors.primary,
      colorScheme: scheme,
      splashFactory: InkSparkle.splashFactory,
      visualDensity: VisualDensity.standard,
      materialTapTargetSize: MaterialTapTargetSize.padded,
      pageTransitionsTheme: const PageTransitionsTheme(builders: {
        TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
        TargetPlatform.iOS: FadeForwardsPageTransitionsBuilder(),
      }),
      textTheme: base.copyWith(
        displayLarge: s(base.displayLarge, p, 32, FontWeight.w800, h: 1.2),
        headlineMedium: s(base.headlineMedium, p, 24, FontWeight.w700, h: 1.25),
        headlineSmall: s(base.headlineSmall, p, 20, FontWeight.w700, h: 1.3),
        titleLarge: s(base.titleLarge, p, 18, FontWeight.w700, h: 1.3),
        titleMedium: s(base.titleMedium, p, 15, FontWeight.w600, h: 1.35),
        titleSmall: s(base.titleSmall, p, 13, FontWeight.w600, h: 1.35),
        bodyLarge: s(base.bodyLarge, p, 14, FontWeight.w400, h: 1.45),
        bodyMedium: s(base.bodyMedium, sec, 13, FontWeight.w400, h: 1.45),
        bodySmall: s(base.bodySmall, sec, 12, FontWeight.w400, h: 1.4),
        labelLarge: s(base.labelLarge, p, 14, FontWeight.w600),
        labelMedium: s(base.labelMedium, sec, 12, FontWeight.w600),
        // Muted (#94A3B8) fails AA on white; labels use textSecondary.
        labelSmall: s(base.labelSmall, sec, 11, FontWeight.w500),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        centerTitle: false,
        scrolledUnderElevation: 0.5,
        surfaceTintColor: Colors.transparent,
        shadowColor: AppColors.border,
        titleTextStyle: TextStyle(
          color: AppColors.textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.card,
        elevation: 0,
        margin: EdgeInsets.zero,
        surfaceTintColor: Colors.transparent,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          side: const BorderSide(color: AppColors.border, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppColors.border,
          disabledForegroundColor: AppColors.textSecondary,
          elevation: 0,
          minimumSize: minSize,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: shape(AppRadius.md),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: minSize,
          shape: shape(AppRadius.md),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.textPrimary,
          side: const BorderSide(color: AppColors.border),
          minimumSize: minSize,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: shape(AppRadius.md),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primaryDark,
          minimumSize: minSize,
          shape: shape(AppRadius.md),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(minimumSize: const Size(minTap, minTap)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: border(AppColors.border),
        enabledBorder: border(AppColors.border),
        focusedBorder: border(AppColors.primary, 2),
        errorBorder: border(scheme.error),
        focusedErrorBorder: border(scheme.error, 2),
        hintStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
        labelStyle:
            const TextStyle(color: AppColors.textSecondary, fontSize: 13),
        errorStyle: TextStyle(color: scheme.error, fontSize: 12),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: Colors.white,
        selectedColor: AppColors.primaryLight,
        side: const BorderSide(color: AppColors.border),
        shape: shape(AppRadius.xl),
        labelStyle: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 13,
            fontWeight: FontWeight.w600),
        secondaryLabelStyle: const TextStyle(
            color: AppColors.primaryDark,
            fontSize: 13,
            fontWeight: FontWeight.w600),
        checkmarkColor: AppColors.primaryDark,
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: shape(AppRadius.xl),
        titleTextStyle: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.w700),
        contentTextStyle: const TextStyle(
            color: AppColors.textSecondary, fontSize: 14, height: 1.45),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
        dragHandleColor: AppColors.border,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.secondary,
        contentTextStyle: const TextStyle(color: Colors.white, fontSize: 14),
        actionTextColor: const Color(0xFFA5B4FC),
        shape: shape(AppRadius.md),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        indicatorColor: AppColors.primaryLight,
        height: 68,
        iconTheme: WidgetStateProperty.resolveWith((st) => IconThemeData(
            color: st.contains(WidgetState.selected)
                ? AppColors.primaryDark
                : AppColors.textSecondary)),
        labelTextStyle: WidgetStateProperty.resolveWith((st) => TextStyle(
            fontSize: 12,
            fontWeight: st.contains(WidgetState.selected)
                ? FontWeight.w700
                : FontWeight.w500,
            color: st.contains(WidgetState.selected)
                ? AppColors.primaryDark
                : AppColors.textSecondary)),
      ),
      listTileTheme: const ListTileThemeData(minVerticalPadding: 8),
      dividerTheme: const DividerThemeData(
          color: AppColors.border, thickness: 1, space: 1),
      progressIndicatorTheme:
          const ProgressIndicatorThemeData(color: AppColors.primary),
    );
  }
}
