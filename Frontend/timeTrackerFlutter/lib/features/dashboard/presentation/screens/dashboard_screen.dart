import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../bloc/dashboard_cubit.dart';
import '../../bloc/dashboard_state.dart';
import '../../../../core/models/issue.dart';
import '../../../../core/models/project.dart';
import '../../../../core/models/time_entry.dart';
import '../../../../core/enums/issue_status.dart';
import '../../../../core/enums/issue_priority.dart';
import '../../../../core/enums/project_status.dart';
import '../../../../core/enums/user_role.dart';
import '../../../../app/router/app_router.dart';
import '../../../company/bloc/company_cubit.dart';
import '../../../company/bloc/company_state.dart';
import '../../../company/presentation/widgets/company_selector.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocConsumer<DashboardCubit, DashboardState>(
        listener: (context, state) {
          if (state.error != null) {
            ScaffoldMessenger.of(context)
              ..hideCurrentSnackBar()
              ..showSnackBar(SnackBar(
                content: Text(state.error!),
                backgroundColor: Theme.of(context).colorScheme.error,
                behavior: SnackBarBehavior.floating,
              ));
          }
        },
        builder: (context, state) {
          if (state.isLoading && state.activeProjects.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }
          return RefreshIndicator(
            onRefresh: () => context.read<DashboardCubit>().load(),
            child: CustomScrollView(
              slivers: [
                SliverAppBar(
                  title: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Inicio'),
                      Text(
                        DateFormat('EEEE, d MMMM').format(DateTime.now()),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurfaceVariant,
                            ),
                      ),
                    ],
                  ),
                  floating: true,
                  snap: true,
                  actions: [
                    const CompanySelectorWidget(),
                    BlocBuilder<CompanyCubit, CompanyState>(
                      builder: (context, cs) {
                        final isManager = cs is CompanyLoaded &&
                            (cs.selectedCompany?.userRole.canManage ?? false);
                        return Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (isManager)
                              IconButton(
                                icon: const Icon(Icons.business_outlined),
                                tooltip: 'Gestión de empresa',
                                onPressed: () =>
                                    context.go(AppRoutes.companyDetail),
                              ),
                            IconButton(
                              icon: const Icon(Icons.folder_outlined),
                              tooltip: 'Proyectos',
                              onPressed: () => context.go(AppRoutes.projects),
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ),
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      if (state.activeTimer != null)
                        _ActiveTimerCard(entry: state.activeTimer!),
                      if (state.activeTimer != null) const SizedBox(height: 16),
                      _TodaySummaryCard(state: state),
                      const SizedBox(height: 16),
                      if (state.activeIssues.isNotEmpty) ...[
                        _SectionHeader(
                          title: 'Mis issues activos',
                          onSeeAll: () => context.go(AppRoutes.issues),
                        ),
                        const SizedBox(height: 8),
                        ...state.activeIssues
                            .map((i) => _IssueRow(issue: i)),
                        const SizedBox(height: 16),
                      ],
                      if (state.activeProjects.isNotEmpty) ...[
                        _SectionHeader(
                          title: 'Proyectos activos',
                          onSeeAll: () => context.go(AppRoutes.projects),
                        ),
                        const SizedBox(height: 8),
                        _ProjectGrid(projects: state.activeProjects),
                        const SizedBox(height: 16),
                      ],
                      if (state.recentEntries.isNotEmpty) ...[
                        _SectionHeader(
                          title: 'Actividad de hoy',
                          onSeeAll: () => context.go(AppRoutes.timeTracker),
                        ),
                        const SizedBox(height: 8),
                        ...state.recentEntries
                            .map((e) => _TimeEntryRow(entry: e)),
                      ],
                      if (state.activeProjects.isEmpty &&
                          state.activeIssues.isEmpty &&
                          state.recentEntries.isEmpty)
                        _EmptyDashboard(),
                    ]),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _ActiveTimerCard extends StatelessWidget {
  const _ActiveTimerCard({required this.entry});
  final TimeEntry entry;

  String _elapsed() {
    final diff = DateTime.now().difference(entry.startTime);
    final h = diff.inHours.toString().padLeft(2, '0');
    final m = (diff.inMinutes % 60).toString().padLeft(2, '0');
    final s = (diff.inSeconds % 60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      color: cs.primaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(Icons.timer, color: cs.onPrimaryContainer, size: 32),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Timer activo',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          color: cs.onPrimaryContainer,
                        ),
                  ),
                  Text(
                    _elapsed(),
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          color: cs.onPrimaryContainer,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'monospace',
                        ),
                  ),
                  if (entry.description != null)
                    Text(
                      entry.description!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: cs.onPrimaryContainer.withValues(alpha: 0.8),
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
            FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: cs.onPrimaryContainer,
                foregroundColor: cs.primaryContainer,
              ),
              onPressed: () => context.read<DashboardCubit>().stopTimer(),
              icon: const Icon(Icons.stop, size: 18),
              label: const Text('Detener'),
            ),
          ],
        ),
      ),
    );
  }
}

class _TodaySummaryCard extends StatelessWidget {
  const _TodaySummaryCard({required this.state});
  final DashboardState state;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final pct = (state.todayMinutes / 480).clamp(0.0, 1.0);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.schedule, color: cs.primary, size: 20),
                const SizedBox(width: 8),
                Text('Horas hoy',
                    style: Theme.of(context).textTheme.titleSmall),
                const Spacer(),
                Text(
                  state.todayFormatted,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: cs.primary,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: pct,
                minHeight: 8,
                backgroundColor: cs.surfaceContainerHighest,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '${(pct * 100).toStringAsFixed(0)}% de la jornada (8h)',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, this.onSeeAll});
  final String title;
  final VoidCallback? onSeeAll;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(title, style: Theme.of(context).textTheme.titleMedium),
        const Spacer(),
        if (onSeeAll != null)
          TextButton(onPressed: onSeeAll, child: const Text('Ver todos')),
      ],
    );
  }
}

class _IssueRow extends StatelessWidget {
  const _IssueRow({required this.issue});
  final Issue issue;

  @override
  Widget build(BuildContext context) {
    final priority = issue.issuePriority;
    final status = issue.issueStatus;
    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            Container(
              width: 3,
              height: 36,
              decoration: BoxDecoration(
                color: priority.color,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    issue.title,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    issue.projectName,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color:
                              Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                  ),
                ],
              ),
            ),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: status.color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                status.label,
                style: TextStyle(
                    fontSize: 11,
                    color: status.color,
                    fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProjectGrid extends StatelessWidget {
  const _ProjectGrid({required this.projects});
  final List<Project> projects;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        childAspectRatio: 2.2,
      ),
      itemCount: projects.length,
      itemBuilder: (_, i) => _ProjectChip(project: projects[i]),
    );
  }
}

class _ProjectChip extends StatelessWidget {
  const _ProjectChip({required this.project});
  final Project project;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Icon(Icons.folder_outlined, size: 16, color: cs.primary),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    project.name,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              project.projectStatus.label,
              style: TextStyle(
                  fontSize: 11,
                  color: project.projectStatus.color,
                  fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }
}

class _TimeEntryRow extends StatelessWidget {
  const _TimeEntryRow({required this.entry});
  final TimeEntry entry;

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('HH:mm');
    final dur = entry.durationMinutes != null
        ? '${entry.durationMinutes! ~/ 60}h ${entry.durationMinutes! % 60}m'
        : '—';
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: const Icon(Icons.access_time_outlined),
      title: Text(
        entry.description ?? 'Sin descripción',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(fmt.format(entry.startTime.toLocal())),
      trailing: Text(dur,
          style: Theme.of(context)
              .textTheme
              .bodyMedium
              ?.copyWith(fontWeight: FontWeight.w600)),
    );
  }
}

class _EmptyDashboard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 48),
        child: Column(
          children: [
            Icon(Icons.dashboard_outlined,
                size: 64,
                color: Theme.of(context).colorScheme.onSurfaceVariant),
            const SizedBox(height: 16),
            Text('Todo listo',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              'Seleccioná una empresa y comenzá a registrar tiempo',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
