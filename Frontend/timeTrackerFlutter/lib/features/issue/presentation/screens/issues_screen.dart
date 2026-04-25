import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../bloc/issue_cubit.dart';
import '../../bloc/issue_state.dart';
import '../../../../core/enums/issue_status.dart';
import '../../../../core/enums/issue_type.dart';
import '../../../../core/enums/issue_priority.dart';
import '../../../../core/models/company.dart';
import '../../../../core/models/issue.dart';
import '../../../../core/models/project.dart';
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
  const IssuesScreen({super.key, this.initialProjectId});

  final int? initialProjectId;

  @override
  State<IssuesScreen> createState() => _IssuesScreenState();
}

class _IssuesScreenState extends State<IssuesScreen> {
  final _searchController = TextEditingController();
  String _search = '';
  int? _filterStatus;
  int? _filterType;
  int? _filterPriority;
  List<CompanyUser> _companyUsers = [];

  bool get _isProjectMode => widget.initialProjectId != null;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(
      () => setState(() => _search = _searchController.text.toLowerCase()),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _reload();
      _loadCompanyUsers();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  int? get _companyId => context.read<LocalStorage>().getSelectedCompanyId();

  Future<void> _reload() async {
    final cubit = context.read<IssueCubit>();
    if (_isProjectMode) {
      cubit.loadIssuesByProject(widget.initialProjectId!);
    } else {
      cubit.loadMyIssues(companyId: _companyId);
    }
  }

  Future<void> _loadCompanyUsers() async {
    final cid = _companyId;
    if (cid == null) return;
    try {
      final users =
          await context.read<CompanyRepository>().getCompanyUsers(cid);
      if (mounted) setState(() => _companyUsers = users);
    } catch (_) {}
  }

  List<Issue> _applyFilters(List<Issue> issues) {
    return issues.where((issue) {
      if (_search.isNotEmpty &&
          !issue.title.toLowerCase().contains(_search)) {
        return false;
      }
      if (_filterStatus != null && issue.status != _filterStatus) return false;
      if (_filterType != null && issue.type != _filterType) return false;
      if (_filterPriority != null && issue.priority != _filterPriority) {
        return false;
      }
      return true;
    }).toList();
  }

  bool get _hasActiveFilters =>
      _search.isNotEmpty ||
      _filterStatus != null ||
      _filterType != null ||
      _filterPriority != null;

  Project? get _currentProject {
    if (!_isProjectMode) return null;
    final ps = context.read<ProjectCubit>().state;
    if (ps is ProjectLoaded) {
      try {
        return ps.projects
            .firstWhere((p) => p.id == widget.initialProjectId);
      } catch (_) {}
    }
    return null;
  }

  List<Project> _allProjects() {
    final ps = context.read<ProjectCubit>().state;
    return ps is ProjectLoaded ? ps.projects : [];
  }

  void _openCreateDialog() {
    showDialog(
      context: context,
      builder: (_) => BlocProvider.value(
        value: context.read<IssueCubit>(),
        child: IssueFormDialog(
          projects: _isProjectMode && _currentProject != null
              ? [_currentProject!]
              : _allProjects(),
          companyUsers: _companyUsers,
          fixedProjectId: widget.initialProjectId,
        ),
      ),
    );
  }

  void _openEditDialog(Issue issue) {
    showDialog(
      context: context,
      builder: (_) => BlocProvider.value(
        value: context.read<IssueCubit>(),
        child: IssueFormDialog(
          issue: issue,
          projects: _isProjectMode && _currentProject != null
              ? [_currentProject!]
              : _allProjects(),
          companyUsers: _companyUsers,
          fixedProjectId: widget.initialProjectId,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final title =
        _isProjectMode ? (_currentProject?.name ?? 'Issues') : 'Incidencias';

    return BlocListener<CompanyCubit, CompanyState>(
      listenWhen: (p, c) =>
          c is CompanyLoaded &&
          p is CompanyLoaded &&
          p.selectedCompany?.companyId != c.selectedCompany?.companyId,
      listener: (_, __) {
        setState(() {
          _filterStatus = null;
          _filterType = null;
          _filterPriority = null;
          _searchController.clear();
          _companyUsers = [];
        });
        _reload();
        _loadCompanyUsers();
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(title),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _reload,
            ),
          ],
        ),
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _FiltersBar(
              searchController: _searchController,
              filterStatus: _filterStatus,
              filterType: _filterType,
              filterPriority: _filterPriority,
              onStatusChanged: (v) => setState(() => _filterStatus = v),
              onTypeChanged: (v) => setState(() => _filterType = v),
              onPriorityChanged: (v) => setState(() => _filterPriority = v),
            ),
            Expanded(
              child: BlocConsumer<IssueCubit, IssueState>(
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
                    final filtered = _applyFilters(state.issues);
                    if (filtered.isEmpty) {
                      return _EmptyView(hasFilters: _hasActiveFilters);
                    }
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                          child: Text(
                            '${filtered.length} ${filtered.length == 1 ? 'incidencia' : 'incidencias'}',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .onSurfaceVariant,
                                ),
                          ),
                        ),
                        Expanded(
                          child: RefreshIndicator(
                            onRefresh: _reload,
                            child: ListView.builder(
                              padding:
                                  const EdgeInsets.only(bottom: 80, top: 4),
                              itemCount: filtered.length,
                              itemBuilder: (context, i) {
                                final issue = filtered[i];
                                return IssueTile(
                                  issue: issue,
                                  onTap: () {},
                                  onEdit: () => _openEditDialog(issue),
                                  onDelete: () async {
                                    final confirmed = await showConfirmDialog(
                                      context,
                                      title: 'Eliminar issue',
                                      message:
                                          '¿Eliminás "${issue.title}"? Esta acción no se puede deshacer.',
                                    );
                                    if (confirmed && context.mounted) {
                                      context
                                          .read<IssueCubit>()
                                          .deleteIssue(issue.id);
                                    }
                                  },
                                );
                              },
                            ),
                          ),
                        ),
                      ],
                    );
                  }
                  return const Center(child: CircularProgressIndicator());
                },
              ),
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: _openCreateDialog,
          icon: const Icon(Icons.add),
          label: const Text('Nueva issue'),
        ),
      ),
    );
  }
}

// ── Filters bar ───────────────────────────────────────────────────────────────

class _FiltersBar extends StatelessWidget {
  const _FiltersBar({
    required this.searchController,
    required this.filterStatus,
    required this.filterType,
    required this.filterPriority,
    required this.onStatusChanged,
    required this.onTypeChanged,
    required this.onPriorityChanged,
  });

  final TextEditingController searchController;
  final int? filterStatus;
  final int? filterType;
  final int? filterPriority;
  final ValueChanged<int?> onStatusChanged;
  final ValueChanged<int?> onTypeChanged;
  final ValueChanged<int?> onPriorityChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Column(
        children: [
          TextField(
            controller: searchController,
            decoration: InputDecoration(
              hintText: 'Buscar incidencias...',
              prefixIcon: const Icon(Icons.search, size: 20),
              suffixIcon: searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 18),
                      onPressed: searchController.clear,
                    )
                  : null,
              isDense: true,
              border: const OutlineInputBorder(),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _FilterDropdown<int?>(
                  hint: 'Estado',
                  value: filterStatus,
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Todos')),
                    ...IssueStatus.values.map((s) => DropdownMenuItem(
                          value: s.value,
                          child: Text(s.label),
                        )),
                  ],
                  onChanged: onStatusChanged,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _FilterDropdown<int?>(
                  hint: 'Tipo',
                  value: filterType,
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Todos')),
                    ...IssueType.values.map((t) => DropdownMenuItem(
                          value: t.value,
                          child: Text(t.label),
                        )),
                  ],
                  onChanged: onTypeChanged,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _FilterDropdown<int?>(
                  hint: 'Prioridad',
                  value: filterPriority,
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Todas')),
                    ...IssuePriority.values.map((p) => DropdownMenuItem(
                          value: p.value,
                          child: Text(p.label),
                        )),
                  ],
                  onChanged: onPriorityChanged,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FilterDropdown<T> extends StatelessWidget {
  const _FilterDropdown({
    required this.hint,
    required this.value,
    required this.items,
    required this.onChanged,
  });

  final String hint;
  final T value;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return DropdownButtonHideUnderline(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          border: Border.all(
            color: value != null ? cs.primary : cs.outline,
            width: value != null ? 1.5 : 1,
          ),
          borderRadius: BorderRadius.circular(8),
          color: value != null
              ? cs.primaryContainer.withValues(alpha: 0.3)
              : null,
        ),
        child: DropdownButton<T>(
          value: value,
          hint: Text(hint,
              style: Theme.of(context).textTheme.bodySmall,
              overflow: TextOverflow.ellipsis),
          isExpanded: true,
          isDense: true,
          items: items,
          onChanged: onChanged,
          style: Theme.of(context).textTheme.bodySmall,
          icon: const Icon(Icons.arrow_drop_down, size: 18),
        ),
      ),
    );
  }
}

// ── Empty view ────────────────────────────────────────────────────────────────

class _EmptyView extends StatelessWidget {
  const _EmptyView({required this.hasFilters});

  final bool hasFilters;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: cs.tertiaryContainer,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.assignment_outlined,
                      size: 64, color: cs.onTertiaryContainer),
                  const SizedBox(height: 16),
                  Text(
                    'No se encontraron incidencias',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: cs.onTertiaryContainer,
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    hasFilters
                        ? 'Probá ajustando los filtros'
                        : 'Creá tu primera incidencia con el botón +',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: cs.onTertiaryContainer.withValues(alpha: 0.8),
                        ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
