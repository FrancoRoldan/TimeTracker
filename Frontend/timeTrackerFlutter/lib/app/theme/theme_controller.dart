import 'app_theme.dart';

class ThemeController {
  ThemeController({
    required void Function(AppColorTheme) onChangeTheme,
    required void Function(bool) onChangeDarkMode,
  })  : _onChangeTheme = onChangeTheme,
        _onChangeDarkMode = onChangeDarkMode;

  final void Function(AppColorTheme) _onChangeTheme;
  final void Function(bool) _onChangeDarkMode;

  void changeTheme(AppColorTheme theme) => _onChangeTheme(theme);
  void changeDarkMode(bool value) => _onChangeDarkMode(value);
}
