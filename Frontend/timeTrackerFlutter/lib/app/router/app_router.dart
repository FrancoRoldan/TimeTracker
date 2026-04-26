import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:time_tracker_flutter/features/user/data/user_repository.dart';

import '../../core/network/api_client.dart';
import '../../core/storage/local_storage.dart';
import '../../features/auth/bloc/auth_cubit.dart';
import '../../features/auth/bloc/auth_state.dart';
import '../../features/auth/data/auth_repository.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/company/bloc/company_cubit.dart';
import '../../features/company/bloc/company_state.dart';
import '../../features/company/data/company_repository.dart';
import '../../features/company/presentation/screens/company_detail_screen.dart';
import '../../features/company/presentation/widgets/company_selector.dart';
import '../../features/dashboard/bloc/dashboard_cubit.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/issue/bloc/issue_cubit.dart';
import '../../features/issue/data/issue_repository.dart';
import '../../features/issue/presentation/screens/issues_screen.dart';
import '../../features/project/bloc/project_cubit.dart';
import '../../features/project/data/project_repository.dart';
import '../../features/project/presentation/screens/project_list_screen.dart';
import '../../features/reports/bloc/reports_cubit.dart';
import '../../features/reports/data/reports_repository.dart';
import '../../features/reports/presentation/screens/reports_screen.dart';
import '../../features/time_entry/bloc/time_entry_cubit.dart';
import '../../features/time_entry/bloc/time_entry_state.dart';
import '../../features/time_entry/data/time_entry_repository.dart';
import '../../features/time_entry/presentation/screens/time_tracker_screen.dart';
import '../../features/user/bloc/user_cubit.dart';
import '../../features/user/presentation/screens/user_profile_screen.dart';
import '../../shared/widgets/floating_timer_pill.dart';
import '../../shared/widgets/user_avatar.dart';
import '../theme/app_theme.dart';
import '../theme/theme_controller.dart';

// ── Route paths ───────────────────────────────────────────────────────────────

class AppRoutes {
  AppRoutes._();

  static const login = '/auth/login';
  static const register = '/auth/register';
  static const dashboard = '/dashboard';
  static const companyDetail = '/company';
  static const projects = '/projects';
  static const projectDetail = '/projects/:id';
  static const issues = '/issues';
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
    initialLocation: AppRoutes.dashboard,
    refreshListenable: _BlocRefreshListenable(authCubit.stream),
    redirect: (context, state) {
      final authState = authCubit.state;

      if (authState is AuthInitial || authState is AuthLoading) return null;

      final isAuthenticated = authState is AuthAuthenticated;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');

      if (!isAuthenticated && !isAuthRoute) return AppRoutes.login;
      if (isAuthenticated && isAuthRoute) return AppRoutes.dashboard;
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
          final storage = context.read<LocalStorage>();
          return MultiRepositoryProvider(
            providers: [
              RepositoryProvider(
                create: (_) => CompanyRepository(apiClient: api),
              ),
            ],
            child: MultiBlocProvider(
              providers: [
                BlocProvider(
                  create: (_) => CompanyCubit(
                    repository: CompanyRepository(apiClient: api),
                    localStorage: storage,
                    authRepository: AuthRepository(
                      apiClient: api,
                      localStorage: storage,
                    ),
                  )..initFromStorage(),
                ),
                BlocProvider(
                  create: (_) => ProjectCubit(
                    repository: ProjectRepository(apiClient: api),
                  )..loadProjects(
                      companyId: storage.getSelectedCompanyId(),
                    ),
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
                BlocProvider(
                  create: (ctx) => DashboardCubit(
                    timeEntryRepository: TimeEntryRepository(apiClient: api),
                    issueRepository: IssueRepository(apiClient: api),
                    projectRepository: ProjectRepository(apiClient: api),
                    localStorage: storage,
                  )..load(),
                ),
              ],
              child: BlocListener<CompanyCubit, CompanyState>(
                listenWhen: (prev, curr) {
                  if (prev is CompanyLoaded && curr is CompanyLoaded) {
                    return prev.selectedCompany?.companyId !=
                        curr.selectedCompany?.companyId;
                  }
                  return false;
                },
                listener: (ctx, state) {
                  if (state is CompanyLoaded) {
                    final id = state.selectedCompany?.companyId;
                    ctx.read<ProjectCubit>().loadProjects(companyId: id);
                    ctx.read<DashboardCubit>().load();
                    ctx.read<TimeEntryCubit>().loadEntries();
                    ctx.read<IssueCubit>().loadMyIssues(companyId: id);
                    ctx.read<ReportsCubit>().reset();
                  }
                },
                child: _AppShell(child: child),
              ),
            ),
          );
        },
        routes: [
          GoRoute(
            path: AppRoutes.dashboard,
            builder: (_, __) => const DashboardScreen(),
          ),
          GoRoute(
            path: AppRoutes.companyDetail,
            builder: (_, __) => const CompanyDetailScreen(),
          ),
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
            path: AppRoutes.issues,
            builder: (_, state) {
              final projectId = int.tryParse(
                state.uri.queryParameters['projectId'] ?? '',
              );
              return IssuesScreen(initialProjectId: projectId);
            },
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
            path: AppRoutes.reportsProject,
            builder: (_, __) => const ReportsScreen(),
          ),
          GoRoute(
            path: AppRoutes.reportsCompany,
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

typedef _NavItem = ({
  IconData icon,
  IconData activeIcon,
  String label,
  String route,
});

class _AppShell extends StatefulWidget {
  const _AppShell({required this.child});

  final Widget child;

  @override
  State<_AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<_AppShell> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  static const List<_NavItem> _navItems = [
    (
      icon: Icons.dashboard_outlined,
      activeIcon: Icons.dashboard,
      label: 'Panel de control',
      route: AppRoutes.dashboard,
    ),
    (
      icon: Icons.business_outlined,
      activeIcon: Icons.business,
      label: 'Empresas',
      route: AppRoutes.companyDetail,
    ),
    (
      icon: Icons.folder_outlined,
      activeIcon: Icons.folder,
      label: 'Proyectos',
      route: AppRoutes.projects,
    ),
    (
      icon: Icons.timer_outlined,
      activeIcon: Icons.timer,
      label: 'Registro de tiempo',
      route: AppRoutes.timeTracker,
    ),
    (
      icon: Icons.bar_chart_outlined,
      activeIcon: Icons.bar_chart,
      label: 'Mis reportes',
      route: AppRoutes.reportsUser,
    ),
    (
      icon: Icons.pie_chart_outline,
      activeIcon: Icons.pie_chart,
      label: 'Reportes de proyecto',
      route: AppRoutes.reportsProject,
    ),
    (
      icon: Icons.assessment_outlined,
      activeIcon: Icons.assessment,
      label: 'Reportes de empresa',
      route: AppRoutes.reportsCompany,
    ),
    (
      icon: Icons.person_outline,
      activeIcon: Icons.person,
      label: 'Mi cuenta',
      route: AppRoutes.userProfile,
    ),
  ];

  String _currentRoute(BuildContext context) =>
      GoRouterState.of(context).matchedLocation;

  @override
  Widget build(BuildContext context) {
    final localStorage = context.read<LocalStorage>();
    final user = localStorage.getUser();
    final userName = user?.name ?? 'Usuario';
    final currentRoute = _currentRoute(context);

    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.menu),
          tooltip: 'Menú',
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
        title: const Text('TimeTracker'),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: UserAvatar(name: userName, size: 36),
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            tooltip: 'Configuración',
            onPressed: () => _scaffoldKey.currentState?.openEndDrawer(),
          ),
          const SizedBox(width: 4),
        ],
      ),
      drawer: _NavDrawer(
        currentRoute: currentRoute,
        navItems: _navItems,
        onItemTap: (route) {
          _scaffoldKey.currentState?.closeDrawer();
          context.go(route);
        },
      ),
      endDrawer: const _SettingsDrawer(),
      body: Stack(
        children: [
          widget.child,
          // Floating timer pill — visible en todas las rutas cuando hay timer activo
          BlocBuilder<TimeEntryCubit, TimeEntryState>(
            builder: (ctx, state) {
              if (state is TimeEntryLoaded && state.hasActiveTimer) {
                return Positioned(
                  bottom: 24,
                  right: 24,
                  child: FloatingTimerPill(
                    activeTimer: state.activeTimer!,
                    onStop: () => ctx.read<TimeEntryCubit>().stopTimer(),
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
    );
  }
}

// ── Navigation drawer (izquierdo) ─────────────────────────────────────────────

class _NavDrawer extends StatelessWidget {
  const _NavDrawer({
    required this.currentRoute,
    required this.navItems,
    required this.onItemTap,
  });

  final String currentRoute;
  final List<_NavItem> navItems;
  final ValueChanged<String> onItemTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Drawer(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Company selector
            Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: cs.outlineVariant,
                    width: 1,
                  ),
                ),
              ),
              child: const CompanySelectorWidget(),
            ),
            // Nav items
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                itemCount: navItems.length,
                itemBuilder: (context, i) {
                  final item = navItems[i];
                  final isActive = currentRoute.startsWith(item.route);
                  return ListTile(
                    dense: true,
                    leading: Icon(
                      isActive ? item.activeIcon : item.icon,
                      color: isActive ? cs.primary : cs.onSurfaceVariant,
                      size: 22,
                    ),
                    title: Text(
                      item.label,
                      style: TextStyle(
                        fontWeight:
                            isActive ? FontWeight.w600 : FontWeight.normal,
                        color: isActive ? cs.primary : cs.onSurface,
                        fontSize: 14,
                      ),
                    ),
                    selected: isActive,
                    selectedTileColor: cs.primaryContainer.withValues(alpha: 0.2),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    onTap: () => onItemTap(item.route),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Settings end drawer (derecho) ────────────────────────────────────────────

class _SettingsDrawer extends StatelessWidget {
  const _SettingsDrawer();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final themeCtrl = context.read<ThemeController>();
    final localStorage = context.read<LocalStorage>();
    final currentTheme = AppColorTheme.fromKey(localStorage.getTheme());
    final isDark = localStorage.getDarkMode();

    return Drawer(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
              child: Text(
                'Configuración',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ),
            Divider(height: 1, color: cs.outlineVariant),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Tema',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                  ),
                  const SizedBox(height: 12),
                  // 6 swatches — cuadrados 50x50, igual que Angular
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: AppColorTheme.values.map((theme) {
                      final isSelected = theme == currentTheme;
                      return Tooltip(
                        message: theme.label,
                        child: GestureDetector(
                          onTap: () => themeCtrl.changeTheme(theme),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: theme.seed,
                              borderRadius: BorderRadius.circular(8),
                              border: isSelected
                                  ? Border.all(color: Colors.white, width: 3)
                                  : null,
                              boxShadow: isSelected
                                  ? [
                                      BoxShadow(
                                        color: theme.seed
                                            .withValues(alpha: 0.5),
                                        blurRadius: 8,
                                      ),
                                    ]
                                  : null,
                            ),
                            alignment: Alignment.center,
                            child: isSelected
                                ? const Icon(Icons.check,
                                    color: Colors.white, size: 22)
                                : null,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 20),
                  // Dark / light mode toggle
                  Row(
                    children: [
                      Icon(
                        isDark ? Icons.dark_mode : Icons.light_mode,
                        color: cs.onSurfaceVariant,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          isDark ? 'Modo oscuro' : 'Modo claro',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
                      Switch(
                        value: isDark,
                        onChanged: (v) => themeCtrl.changeDarkMode(v),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Spacer(),
            Divider(height: 1, color: cs.outlineVariant),
            // Logout
            ListTile(
              leading: Icon(Icons.logout, color: cs.error),
              title: Text(
                'Cerrar sesión',
                style: TextStyle(color: cs.error, fontWeight: FontWeight.w500),
              ),
              onTap: () => context.read<AuthCubit>().logout(),
            ),
          ],
        ),
      ),
    );
  }
}
