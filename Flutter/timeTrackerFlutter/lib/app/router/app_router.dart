import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:time_tracker_flutter/features/user/data/user_repository.dart';

import '../../core/network/api_client.dart';
import '../../core/storage/local_storage.dart';
import '../../features/auth/bloc/auth_cubit.dart';
import '../../features/auth/bloc/auth_state.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/project/bloc/project_cubit.dart';
import '../../features/project/data/project_repository.dart';
import '../../features/project/presentation/screens/project_list_screen.dart';
import '../../features/issue/bloc/issue_cubit.dart';
import '../../features/issue/data/issue_repository.dart';
import '../../features/issue/presentation/screens/my_issues_screen.dart';
import '../../features/time_entry/bloc/time_entry_cubit.dart';
import '../../features/time_entry/data/time_entry_repository.dart';
import '../../features/time_entry/presentation/screens/time_tracker_screen.dart';
import '../../features/reports/bloc/reports_cubit.dart';
import '../../features/reports/data/reports_repository.dart';
import '../../features/reports/presentation/screens/reports_screen.dart';
import '../../features/user/bloc/user_cubit.dart';
import '../../features/company/data/company_repository.dart';
import '../../features/user/presentation/screens/user_profile_screen.dart';

// ── Route paths ───────────────────────────────────────────────────────────────

class AppRoutes {
  AppRoutes._();

  static const login = '/auth/login';
  static const register = '/auth/register';
  static const companies = '/companies';
  static const companyUsers = '/companies/:id/users';
  static const projects = '/projects';
  static const projectDetail = '/projects/:id';
  static const issues = '/issues';
  static const myIssues = '/issues/my';
  static const issueDetail = '/issues/:id';
  static const timeEntries = '/time-entries';
  static const timeTracker = '/time-entries/tracker';
  static const reportsUser = '/reports/user';
  static const reportsProject = '/reports/project';
  static const reportsCompany = '/reports/company';
  static const userProfile = '/user';
}

// ── GoRouter refresh adapter ──────────────────────────────────────────────────

class _BlocRefreshListenable extends ChangeNotifier {
  _BlocRefreshListenable(Stream<dynamic> stream) {
    _sub = stream.listen((_) => notifyListeners());
  }

  late final StreamSubscription<dynamic> _sub;

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}

// ── Router factory ────────────────────────────────────────────────────────────

GoRouter createRouter(LocalStorage localStorage, AuthCubit authCubit) {
  return GoRouter(
    initialLocation: AppRoutes.login,
    refreshListenable: _BlocRefreshListenable(authCubit.stream),
    redirect: (context, state) {
      final authState = authCubit.state;

      // Todavía verificando sesión guardada — no redirigir hasta saber
      if (authState is AuthInitial || authState is AuthLoading) return null;

      final isAuthenticated = authState is AuthAuthenticated;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');

      if (!isAuthenticated && !isAuthRoute) return AppRoutes.login;
      if (isAuthenticated && isAuthRoute) return AppRoutes.projects;
      return null;
    },
    routes: [
      // ── Auth (sin shell) ──────────────────────────────────────────────────
      GoRoute(path: AppRoutes.login, builder: (_, __) => const LoginScreen()),
      GoRoute(
        path: AppRoutes.register,
        builder: (_, __) => const RegisterScreen(),
      ),

      // ── Shell con NavigationBar ───────────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) {
          final api = context.read<ApiClient>();
          return MultiRepositoryProvider(
            providers: [
              RepositoryProvider(
                create: (_) => CompanyRepository(apiClient: api),
              ),
            ],
            child: MultiBlocProvider(
              providers: [
                BlocProvider(
                  create: (_) => ProjectCubit(
                    repository: ProjectRepository(apiClient: api),
                  )..loadProjects(),
                ),
                BlocProvider(
                  create: (_) =>
                      IssueCubit(repository: IssueRepository(apiClient: api)),
                ),
                BlocProvider(
                  create: (_) => TimeEntryCubit(
                    repository: TimeEntryRepository(apiClient: api),
                  ),
                ),
                BlocProvider(
                  create: (_) => ReportsCubit(
                    repository: ReportsRepository(apiClient: api),
                  ),
                ),
                BlocProvider(
                  create: (_) =>
                      UserCubit(repository: UserRepository(apiClient: api)),
                ),
              ],
              child: _AppShell(child: child),
            ),
          );
        },
        routes: [
          GoRoute(
            path: AppRoutes.projects,
            builder: (_, __) => const ProjectListScreen(),
            routes: [
              GoRoute(
                path: ':id',
                builder: (_, state) => Scaffold(
                  appBar: AppBar(
                    title: Text('Proyecto ${state.pathParameters['id']}'),
                  ),
                  body: const Center(child: Text('Detalle próximamente')),
                ),
              ),
            ],
          ),
          GoRoute(
            path: AppRoutes.myIssues,
            builder: (_, __) => const MyIssuesScreen(),
          ),
          GoRoute(
            path: AppRoutes.timeTracker,
            builder: (_, __) => const TimeTrackerScreen(),
          ),
          GoRoute(
            path: AppRoutes.reportsUser,
            builder: (_, __) => const ReportsScreen(),
          ),
          GoRoute(
            path: AppRoutes.userProfile,
            builder: (_, __) => const UserProfileScreen(),
          ),
        ],
      ),
    ],
  );
}

// ── Shell widget ──────────────────────────────────────────────────────────────

class _AppShell extends StatelessWidget {
  const _AppShell({required this.child});

  final Widget child;

  static const _destinations = [
    NavigationDestination(
      icon: Icon(Icons.folder_outlined),
      selectedIcon: Icon(Icons.folder),
      label: 'Proyectos',
    ),
    NavigationDestination(
      icon: Icon(Icons.task_alt_outlined),
      selectedIcon: Icon(Icons.task_alt),
      label: 'Mis Issues',
    ),
    NavigationDestination(
      icon: Icon(Icons.timer_outlined),
      selectedIcon: Icon(Icons.timer),
      label: 'Timer',
    ),
    NavigationDestination(
      icon: Icon(Icons.bar_chart_outlined),
      selectedIcon: Icon(Icons.bar_chart),
      label: 'Reportes',
    ),
    NavigationDestination(
      icon: Icon(Icons.person_outline),
      selectedIcon: Icon(Icons.person),
      label: 'Perfil',
    ),
  ];

  static const _routes = [
    AppRoutes.projects,
    AppRoutes.myIssues,
    AppRoutes.timeTracker,
    AppRoutes.reportsUser,
    AppRoutes.userProfile,
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    for (var i = _routes.length - 1; i >= 0; i--) {
      if (location.startsWith(_routes[i])) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex(context),
        onDestinationSelected: (i) => context.go(_routes[i]),
        destinations: _destinations,
      ),
    );
  }
}
