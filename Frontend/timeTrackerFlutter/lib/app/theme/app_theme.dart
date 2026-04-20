import 'package:flutter/material.dart';

/// Equivalente a los 6 temas CSS del Angular (azul, pink, green, ocre, violet, orange)
enum AppColorTheme {
  blue('blue', Color(0xFF2196F3)),
  pink('pink', Color(0xFFE91E63)),
  green('green', Color(0xFF4CAF50)),
  amber('amber', Color(0xFFFF9800)),
  purple('purple', Color(0xFF9C27B0)),
  orange('orange', Color(0xFFFF5722));

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
        AppColorTheme.amber => 'Ámbar',
        AppColorTheme.purple => 'Violeta',
        AppColorTheme.orange => 'Naranja',
      };
}

class AppTheme {
  AppTheme._();

  static ThemeData light(AppColorTheme colorTheme) => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: colorTheme.seed,
          brightness: Brightness.light,
        ),
      );

  static ThemeData dark(AppColorTheme colorTheme) => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: colorTheme.seed,
          brightness: Brightness.dark,
        ),
      );
}
