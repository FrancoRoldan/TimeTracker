import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../bloc/issue_cubit.dart';
import '../../bloc/issue_state.dart';
import '../../../../core/enums/issue_status.dart';
import '../../../../core/enums/user_role.dart';
import '../../../../core/models/company.dart';
import '../../../company/presentation/widgets/company_selector.dart';
import '../../../../core/storage/local_storage.dart';
import '../widgets/issue_tile.dart';
import '../widgets/issue_form_dialog.dart';
import '../../../../shared/widgets/confirm_dialog.dart';
import '../../../project/bloc/project_cubit.dart';
import '../../../project/bloc/project_state.dart';
import '../../../company/bloc/company_cubit.dart';
import '../../../company/bloc/company_state.dart';
import '../../../company/data/company_repository.dart';

class IssuesScreen extends StatefulWidget {
  const IssuesScreen({super.key});

  @override
  State<IssuesScreen> createState() => _IssuesScreenState();
}

class _IssuesScreenState extends State<IssuesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int? _filterStatus;
  int? _filterProjectId;
  List<CompanyUser> _companyUsers = [];
  int? _lastCompanyId;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(_onTabChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) => _reload());
  }

  @override
  void dispose() {
    _tabController
      ..removeListener(_onTabChanged)
      ..dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) _reload();
  }

  int? get _companyId =>
      context.read<LocalStorage>().getSelectedCompanyId();

  Future<void> _reload() async {
    final cid = _companyId;
    final cubit = context.read<IssueCubit>();
    if (_tabController.index == 0) {
      if (_filterStatus == null && _filterProjectId == null) {
        cubit.loadMyIssues(companyId: cid);
      } else {
        cubit.loadIssuesWithFilters(
          status: _filterStatus,
          projectId: _filterProjectId,
          companyId: cid,
        );
      }
    } else {
      cubit.loadIssuesWithFilters(
        status: _filterStatus,
        projectId: _filterProjectId,
        companyId: cid,
      );
    }
    if (cid != null && cid != _lastCompanyId) {
      _lastCompanyId = cid;
      _loadCompanyUsers(cid);
    }
  }

  Future<void> _loadCompanyUsers(int companyId) async {
    try {
      final users =
          await context.read<CompanyRepository>().getCompanyUsers(companyId);
      if (mounted) setState(() => _companyUsers = users);
    } catch (_) {}
  }

  void _applyStatusFilter(int? status) {
    setState(() => _filterStatus = status);
    _reload();
  }

  void _applyProjectFilter(int? projectId) {
    setState(() => _filterProjectId = projectId);
    _reload();
  }

  @override
  Widget build(BuildContext context) {
    final companyState = context.watch<CompanyCubit>().state;
    final isManager = companyState is CompanyLoaded &&
        (companyState.selectedCompany?.userRole.canManage ?? false);

    return BlocListener<CompanyCubit, CompanyState>(
      listenWhen: (p, c) =>
          c is CompanyLoaded &&
          p is CompanyLoaded &&
          p.selectedCompany?.companyId != c.selectedCompany?.companyId,
      listener: (_, __) {
        setState(() {
          _filterStatus = null;
          _filterProjectId = null;
          _companyUsers = [];
          _lastCompanyId = null;
        });
        _reload();
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Issues'),
          actions: [
            const CompanySelectorWidget(),
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _reload,
            ),
          ],
          bottom: PreferredSize(
            preferredSize: Size.fromHeight(isManager ? 144 : 112),
            child: Column(
              children: [
                if (isManager)
                  TabBar(
                    controller: _tabController,
                    tabs: const [
                      Tab(text: 'Mis issues'),
                      Tab(text: 'Todos'),
                    ],
                  ),
                _ProjectFilterBar(
                  selected: _filterProjectId,
                  onSelected: _applyProjectFilter,
                ),
                _StatusFilterBar(
                  selected: _filterStatus,
                  onSelected: _applyStatusFilter,
                ),
              ],
            ),
          ),
        ),
        body: BlocConsumer<IssueCubit, IssueState>(
          listener: (context, state) {
            if (state is IssueError) {
              ScaffoldMessenger.of(context)
                ..hideCurrentSnackBar()
                ..showSnackBar(SnackBar(
                  content: Text(state.message),
                  backgroundColor: Theme.of(context).colorScheme.error,
                  behavior: SnackBarBehavior.floating,
                ));
            }
          },
          builder: (context, state) {
            if (state is IssueLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is IssueLoaded) {
              if (state.issues.isEmpty) return const _EmptyView();
              return RefreshIndicator(
                onRefresh: _reload,
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: state.issues.length,
                  itemBuilder: (context, i) {
                    final issue = state.issues[i];
                    final projects =
                        context.read<ProjectCubit>().state is ProjectLoaded
                            ? (context.read<ProjectCubit>().state
                                    as ProjectLoaded)
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
                            projects: List.from(projects),
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
                ),
              );
            }
            return const Center(child: CircularProgressIndicator());
          },
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () {
            final projects = context.read<ProjectCubit>().state is ProjectLoaded
                ? (context.read<ProjectCubit>().state as ProjectLoaded).projects
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
    return BlocBuilder<ProjectCubit, ProjectState>(
      builder: (context, state) {
        final projects = state is ProjectLoaded ? state.projects : [];
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Row(
            children: [
              FilterChip(
                label: const Text('Todos los proyectos'),
                selected: selected == null,
                onSelected: (_) => onSelected(null),
              ),
              ...projects.map((p) => Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: FilterChip(
                      label: Text(p.name),
                      selected: selected == p.id,
                      onSelected: (_) =>
                          onSelected(selected == p.id ? null : p.id),
                    ),
                  )),
            ],
          ),
        );
      },
    );
  }
}

class _StatusFilterBar extends StatelessWidget {
  const _StatusFilterBar({required this.selected, required this.onSelected});
  final int? selected;
  final ValueChanged<int?> onSelected;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        children: [
          FilterChip(
            label: const Text('Todos'),
            selected: selected == null,
            onSelected: (_) => onSelected(null),
          ),
          ...IssueStatus.values.map((s) => Padding(
                padding: const EdgeInsets.only(left: 8),
                child: FilterChip(
                  label: Text(s.label),
                  selected: selected == s.value,
                  onSelected: (_) =>
                      onSelected(selected == s.value ? null : s.value),
                  selectedColor: s.color.withValues(alpha: 0.2),
                  checkmarkColor: s.color,
                  side: selected == s.value ? BorderSide(color: s.color) : null,
                ),
              )),
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
          Icon(Icons.task_alt,
              size: 64,
              color: Theme.of(context).colorScheme.onSurfaceVariant),
          const SizedBox(height: 16),
          Text('Sin issues', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            'No hay issues para mostrar',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
        ],
      ),
    );
  }
}
