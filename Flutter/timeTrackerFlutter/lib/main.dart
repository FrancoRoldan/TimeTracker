import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app/router/app_router.dart';
import 'app/theme/app_theme.dart';
import 'app/theme/theme_controller.dart';
import 'core/network/api_client.dart';
import 'core/storage/local_storage.dart';
import 'features/auth/bloc/auth_cubit.dart';
import 'features/auth/data/auth_repository.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final prefs = await SharedPreferences.getInstance();
  const secureStorage = FlutterSecureStorage();

  final localStorage = LocalStorage(prefs: prefs, secureStorage: secureStorage);

  final apiClient = ApiClient(localStorage: localStorage);

  final authRepository = AuthRepository(
    apiClient: apiClient,
    localStorage: localStorage,
  );

  runApp(
    TimeTrackerApp(
      localStorage: localStorage,
      apiClient: apiClient,
      authRepository: authRepository,
    ),
  );
}

class TimeTrackerApp extends StatelessWidget {
  const TimeTrackerApp({
    required this.localStorage,
    required this.apiClient,
    required this.authRepository,
    super.key,
  });

  final LocalStorage localStorage;
  final ApiClient apiClient;
  final AuthRepository authRepository;

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider<LocalStorage>.value(value: localStorage),
        RepositoryProvider<ApiClient>.value(value: apiClient),
      ],
      child: BlocProvider(
        create: (_) => AuthCubit(repository: authRepository)..checkAuthStatus(),
        child: _AppView(localStorage: localStorage),
      ),
    );
  }
}

class _AppView extends StatefulWidget {
  const _AppView({required this.localStorage});

  final LocalStorage localStorage;

  @override
  State<_AppView> createState() => _AppViewState();
}

class _AppViewState extends State<_AppView> {
  // El router se crea una sola vez y recibe el AuthCubit para el refreshListenable
  late final _router = createRouter(
    widget.localStorage,
    context.read<AuthCubit>(),
  );

  AppColorTheme _colorTheme = AppColorTheme.blue;
  bool _darkMode = false;

  @override
  void initState() {
    super.initState();
    _colorTheme = AppColorTheme.fromKey(widget.localStorage.getTheme());
    _darkMode = widget.localStorage.getDarkMode();
  }

  /// Llamar desde UserProfileScreen para cambiar el tema en caliente.
  void changeTheme(AppColorTheme theme) {
    setState(() => _colorTheme = theme);
    widget.localStorage.saveTheme(theme.key);
  }

  /// Llamar desde UserProfileScreen para alternar modo oscuro.
  void changeDarkMode(bool value) {
    setState(() => _darkMode = value);
    widget.localStorage.saveDarkMode(value);
  }

  @override
  Widget build(BuildContext context) {
    return RepositoryProvider<ThemeController>(
      create: (_) => ThemeController(
        onChangeTheme: changeTheme,
        onChangeDarkMode: changeDarkMode,
      ),
      child: MaterialApp.router(
        title: 'TimeTracker',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(_colorTheme),
        darkTheme: AppTheme.dark(_colorTheme),
        themeMode: _darkMode ? ThemeMode.dark : ThemeMode.light,
        routerConfig: _router,
      ),
    );
  }
}
