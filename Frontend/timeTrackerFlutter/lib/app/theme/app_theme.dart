import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// 6 temas que replican exactamente las paletas del Angular (primary tono 40).
enum AppColorTheme {
  blue('blue', Color(0xFF365E9D)),     // Angular: azul  #365e9d
  pink('pink', Color(0xFF90427B)),     // Angular: pink  #90427b
  green('green', Color(0xFF356A22)),   // Angular: green #356a22
  amber('amber', Color(0xFF6A5E25)),   // Angular: ocre  #6a5e25
  purple('purple', Color(0xFF7748A7)), // Angular: violet #7748a7
  orange('orange', Color(0xFFA33E00)); // Angular: orange #a33e00

  const AppColorTheme(this.key, this.seed);

  final String key;
  final Color seed;

  static AppColorTheme fromKey(String key) =>
      AppColorTheme.values.firstWhere(
        (t) => t.key == key,
        orElse: () => AppColorTheme.blue,
      );

  String get label => switch (this) {
        AppColorTheme.blue => 'Azul',
        AppColorTheme.pink => 'Rosa',
        AppColorTheme.green => 'Verde',
        AppColorTheme.amber => 'Ocre',
        AppColorTheme.purple => 'Violeta',
        AppColorTheme.orange => 'Naranja',
      };
}

class AppTheme {
  AppTheme._();

  /// Poppins como fuente global — igual que el Angular.
  static TextTheme _poppins(TextTheme base) =>
      GoogleFonts.poppinsTextTheme(base);

  static ThemeData light(AppColorTheme colorTheme) {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: colorTheme.seed,
        brightness: Brightness.light,
      ),
    );
    return base.copyWith(textTheme: _poppins(base.textTheme));
  }

  static ThemeData dark(AppColorTheme colorTheme) {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: colorTheme.seed,
        brightness: Brightness.dark,
      ),
    );
    return base.copyWith(textTheme: _poppins(base.textTheme));
  }

  /// Estilo monospace para el display del temporizador (64px — igual Angular).
  static TextStyle timerDisplay(ColorScheme cs) => GoogleFonts.robotoMono(
        fontSize: 64,
        fontWeight: FontWeight.w700,
        color: cs.onTertiaryContainer,
        letterSpacing: 2,
      );

  /// Estilo monospace compacto para el pill flotante (20px — igual Angular).
  static TextStyle timerPill(ColorScheme cs) => GoogleFonts.robotoMono(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: cs.primary,
      );
}
