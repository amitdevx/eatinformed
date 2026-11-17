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

/// Nunito roles follow GymMane's display/rounded/body line-height families.
/// The values here describe roles; screens keep their EatInformed wording.
abstract final class EatType {
  static const family = 'Nunito';
  static TextStyle display(double size, {Color? color}) => TextStyle(
    fontFamily: family,
    fontSize: size,
    fontWeight: FontWeight.w800,
    height: 1,
    letterSpacing: -size * .025,
    color: color,
  );
  static TextStyle heading(double size, {Color? color}) => TextStyle(
    fontFamily: family,
    fontSize: size,
    fontWeight: FontWeight.w700,
    height: 1.15,
    color: color,
  );
  static TextStyle body(double size, {Color? color}) => TextStyle(
    fontFamily: family,
    fontSize: size,
    fontWeight: FontWeight.w400,
    height: 1.35,
    color: color,
  );
  static TextStyle label(double size, {Color? color}) => TextStyle(
    fontFamily: family,
    fontSize: size,
    fontWeight: FontWeight.w700,
    height: 1.15,
    color: color,
  );
  static TextStyle numeric(double size, {Color? color}) => TextStyle(
    fontFamily: family,
    fontSize: size,
    fontWeight: FontWeight.w900,
    height: 1,
    fontFeatures: const [FontFeature.tabularFigures()],
    color: color,
  );
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
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      fontFamily: EatType.family,
    );
    final text = base.textTheme.apply(fontFamily: EatType.family);
    return base.copyWith(
      scaffoldBackgroundColor: dark ? Colors.black : Colors.white,
      textTheme: text.copyWith(
        displayLarge: EatType.display(56),
        displayMedium: EatType.display(45),
        displaySmall: EatType.numeric(36),
        headlineLarge: EatType.display(34),
        headlineMedium: EatType.display(28),
        headlineSmall: EatType.heading(24),
        titleLarge: EatType.heading(22),
        titleMedium: EatType.heading(18),
        titleSmall: EatType.heading(16),
        bodyLarge: EatType.body(17),
        bodyMedium: EatType.body(15),
        bodySmall: EatType.body(13),
        labelLarge: EatType.label(14),
        labelMedium: EatType.label(12),
        labelSmall: EatType.label(11),
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
