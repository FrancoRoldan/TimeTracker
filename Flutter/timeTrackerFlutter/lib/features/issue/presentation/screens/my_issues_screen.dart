import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../bloc/issue_cubit.dart';
import '../../bloc/issue_state.dart';
import '../../../../core/enums/issue_status.dart';
import '../../../../core/storage/local_storage.dart';
import '../../../../core/models/company.dart';
import '../widgets/issue_tile.dart';
import '../widgets/issue_form_dialog.dart';
import '../../../../shared/widgets/confirm_dialog.dart';
import '../../../project/bloc/project_cubit.dart';
import '../../../project/bloc/project_state.dart';
import '../../../company/data/company_repository.dart';

class MyIssuesScreen extends StatefulWidget {
  const MyIssuesScreen({super.key});

  @override
  State<MyIssuesScreen> createState() => _MyIssuesScreenState();
}

class _MyIssuesScreenState extends State<MyIssuesScreen> {
  int? _filterStatus;
  int? _filterProjectId;
  List<CompanyUser> _companyUsers = [];

  @override
  void initState() {
    super.initState();
    final companyId = context.read<LocalStorage>().getSelectedCompanyId();
    context.read<IssueCubit>().loadMyIssues(companyId: companyId);
    _loadCompanyUsers();
  }

  Future<void> _loadCompanyUsers() async {
    final localStorage = context.read<LocalStorage>();
    final companyId = localStorage.getSelectedCompanyId();
    if (companyId != null) {
      try {
        final repository = context.read<CompanyRepository>();
        final users = await repository.getCompanyUsers(companyId);
        setState(() => _companyUsers = users);
      } catch (e) {
        // Silently fail - users are optional
      }
    }
  }

  void _applyFilter(int? status) {
    setState(() => _filterStatus = status);
    final cubit = context.read<IssueCubit>();
    final companyId = context.read<LocalStorage>().getSelectedCompanyId();
    if (status == null && _filterProjectId == null) {
      cubit.loadMyIssues(companyId: companyId);
    } else {
      cubit.loadIssuesWithFilters(
        status: status,
        projectId: _filterProjectId,
        companyId: companyId,
      );
    }
  }

  void _applyProjectFilter(int? projectId) {
    setState(() => _filterProjectId = projectId);
    final cubit = context.read<IssueCubit>();
    final companyId = context.read<LocalStorage>().getSelectedCompanyId();
    if (_filterStatus == null && projectId == null) {
      cubit.loadMyIssues(companyId: companyId);
    } else {
      cubit.loadIssuesWithFilters(
        status: _filterStatus,
        projectId: projectId,
        companyId: companyId,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis issues'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Actualizar',
            onPressed: () {
              final companyId = context
                  .read<LocalStorage>()
                  .getSelectedCompanyId();
              context.read<IssueCubit>().loadMyIssues(companyId: companyId);
            },
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(112),
          child: Column(
            children: [
              _ProjectFilterBar(
                selected: _filterProjectId,
                onSelected: _applyProjectFilter,
              ),
              _FilterBar(selected: _filterStatus, onSelected: _applyFilter),
            ],
          ),
        ),
      ),
      body: BlocConsumer<IssueCubit, IssueState>(
        listener: (context, state) {
          if (state is IssueError) {
            ScaffoldMessenger.of(context)
              ..hideCurrentSnackBar()
              ..showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: Theme.of(context).colorScheme.error,
                  behavior: SnackBarBehavior.floating,
                ),
              );
          }
        },
        builder: (context, state) {
          if (state is IssueLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state is IssueLoaded) {
            if (state.issues.isEmpty) {
              return const _EmptyView();
            }
            return ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: state.issues.length,
              itemBuilder: (context, i) {
                final issue = state.issues[i];
                final projectList =
                    context.read<ProjectCubit>().state is ProjectLoaded
                    ? (context.read<ProjectCubit>().state as ProjectLoaded)
                          .projects
                    : [];
                return IssueTile(
                  issue: issue,
                  onTap: () {},
                  onEdit: () => showDialog(
                    context: context,
                    builder: (_) => BlocProvider.value(
                      value: context.read<IssueCubit>(),
                      child: IssueFormDialog(
                        issue: issue,
                        projects: List.from(projectList),
                        companyUsers: _companyUsers,
                      ),
                    ),
                  ),
                  onDelete: () async {
                    final confirmed = await showConfirmDialog(
                      context,
                      title: 'Eliminar issue',
                      message:
                          '¿Eliminás "${issue.title}"? Esta acción no se puede deshacer.',
                    );
                    if (confirmed && context.mounted) {
                      context.read<IssueCubit>().deleteIssue(issue.id);
                    }
                  },
                );
              },
            );
          }
          return const Center(child: CircularProgressIndicator());
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          final projectState = context.read<ProjectCubit>().state;
          final projects = projectState is ProjectLoaded
              ? projectState.projects
              : [];
          showDialog(
            context: context,
            builder: (_) => BlocProvider.value(
              value: context.read<IssueCubit>(),
              child: IssueFormDialog(
                projects: List.from(projects),
                companyUsers: _companyUsers,
              ),
            ),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('Nuevo issue'),
      ),
    );
  }
}

class _ProjectFilterBar extends StatelessWidget {
  const _ProjectFilterBar({required this.selected, required this.onSelected});

  final int? selected;
  final ValueChanged<int?> onSelected;

  @override
  Widget build(BuildContext context) {
    final state = context.read<ProjectCubit>().state;
    final projects = state is ProjectLoaded ? state.projects : [];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          FilterChip(
            label: const Text('Todos los proyectos'),
            selected: selected == null,
            onSelected: (_) => onSelected(null),
          ),
          const SizedBox(width: 8),
          ...projects.map(
            (p) => Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(p.name),
                selected: selected == p.id,
                onSelected: (_) => onSelected(selected == p.id ? null : p.id),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterBar extends StatelessWidget {
  const _FilterBar({required this.selected, required this.onSelected});

  final int? selected;
  final ValueChanged<int?> onSelected;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          FilterChip(
            label: const Text('Todos'),
            selected: selected == null,
            onSelected: (_) => onSelected(null),
          ),
          const SizedBox(width: 8),
          ...IssueStatus.values.map(
            (s) => Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(s.label),
                selected: selected == s.value,
                onSelected: (_) =>
                    onSelected(selected == s.value ? null : s.value),
                selectedColor: s.color.withValues(alpha: 0.2),
                checkmarkColor: s.color,
                side: selected == s.value ? BorderSide(color: s.color) : null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.task_alt,
            size: 64,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 16),
          Text('Sin issues', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            'No tenés issues asignados',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
