import 'package:material_ui/material_ui.dart';

abstract final class LayoutTokens {
  static const pagePadding = 20.0;
  static const gap = 16.0;
  static const cardRadius = 24.0;
  static const sheetRadius = 28.0;
  static const touchTarget = 48.0;
  static const maxContentWidth = 640.0;
}

abstract final class MotionTokens {
  static const entrance = Duration(milliseconds: 560);
  static const settle = Duration(milliseconds: 320);
  static const sheetEnter = Duration(milliseconds: 380);
  static const sheetExit = Duration(milliseconds: 300);
  static const entranceCurve = Curves.easeOutCubic;
  static const entranceTravel = 22.0;
  static const entranceScale = 0.97;
  static const passportReach = 210.0;
  static Duration stagger(int index) =>
      Duration(milliseconds: 40 + index.clamp(0, 7) * 70);
}

abstract final class EatTheme {
  static ThemeData get light => _theme(Brightness.light);
  static ThemeData get dark => _theme(Brightness.dark);

  static ThemeData _theme(Brightness brightness) {
    final dark = brightness == Brightness.dark;
    final scheme =
        ColorScheme.fromSeed(
          seedColor: const Color(0xFF10B981),
          brightness: brightness,
        ).copyWith(
          primary: dark ? const Color(0xFF34D399) : const Color(0xFF047857),
          onPrimary: dark ? Colors.black : Colors.white,
          surface: dark ? const Color(0xFF111111) : const Color(0xFFF5F7F6),
          onSurface: dark ? Colors.white : const Color(0xFF121916),
          onSurfaceVariant: dark
              ? const Color(0xFFB3BDB8)
              : const Color(0xFF4A5851),
        );
    final base = ThemeData(useMaterial3: true, colorScheme: scheme);
    return base.copyWith(
      scaffoldBackgroundColor: dark ? Colors.black : Colors.white,
      textTheme: base.textTheme.copyWith(
        headlineLarge: base.textTheme.headlineLarge?.copyWith(
          fontWeight: FontWeight.w800,
          letterSpacing: -1,
        ),
        titleLarge: base.textTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(LayoutTokens.cardRadius),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(48, LayoutTokens.touchTarget),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(48, LayoutTokens.touchTarget),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        ),
      ),
    );
  }
}
