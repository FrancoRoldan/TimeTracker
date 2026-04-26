import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../bloc/project_cubit.dart';
import '../../bloc/project_state.dart';
import '../widgets/project_card.dart';
import '../widgets/project_form_dialog.dart';
import '../../../../shared/widgets/confirm_dialog.dart';
import '../../../../core/storage/local_storage.dart';
import '../../../company/bloc/company_cubit.dart';
import '../../../company/bloc/company_state.dart';

class ProjectListScreen extends StatefulWidget {
  const ProjectListScreen({super.key});

  @override
  State<ProjectListScreen> createState() => _ProjectListScreenState();
}

class _ProjectListScreenState extends State<ProjectListScreen> {
  void _reload(BuildContext context) {
    final companyId = context.read<LocalStorage>().getSelectedCompanyId();
    context.read<ProjectCubit>().loadProjects(companyId: companyId);
  }

  @override
  void initState() {
    super.initState();
    _reload(context);
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<CompanyCubit, CompanyState>(
      listenWhen: (p, c) =>
          c is CompanyLoaded &&
          p is CompanyLoaded &&
          p.selectedCompany?.companyId != c.selectedCompany?.companyId,
      listener: (ctx, _) => _reload(ctx),
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Proyectos'),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              tooltip: 'Actualizar',
              onPressed: () => _reload(context),
            ),
          ],
        ),
        body: BlocConsumer<ProjectCubit, ProjectState>(
          listener: (context, state) {
            if (state is ProjectError) {
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
            if (state is ProjectLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is ProjectError && state is! ProjectLoaded) {
              return _ErrorView(message: state.message);
            }
            if (state is ProjectLoaded) {
              if (state.projects.isEmpty) return const _EmptyView();
              return RefreshIndicator(
                onRefresh: () async => _reload(context),
                child: _ProjectGrid(projects: state.projects),
              );
            }
            return const Center(child: CircularProgressIndicator());
          },
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => showDialog(
            context: context,
            builder: (_) => BlocProvider.value(
              value: context.read<ProjectCubit>(),
              child: const ProjectFormDialog(),
            ),
          ),
          icon: const Icon(Icons.add),
          label: const Text('Nuevo proyecto'),
        ),
      ),
    );
  }
}

class _ProjectGrid extends StatelessWidget {
  const _ProjectGrid({required this.projects});

  final List projects;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final crossCount = constraints.maxWidth > 900
            ? 4
            : constraints.maxWidth > 600
            ? 3
            : constraints.maxWidth > 400
            ? 2
            : 1;
        return GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossCount,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.2,
          ),
          itemCount: projects.length,
          itemBuilder: (context, i) {
            final project = projects[i];
            return ProjectCard(
              project: project,
              onTap: () => context.go('/issues?projectId=${project.id}'),
              onEdit: () => showDialog(
                context: context,
                builder: (_) => BlocProvider.value(
                  value: context.read<ProjectCubit>(),
                  child: ProjectFormDialog(project: project),
                ),
              ),
              onDelete: () async {
                final confirmed = await showConfirmDialog(
                  context,
                  title: 'Eliminar proyecto',
                  message:
                      '¿Eliminás "${project.name}"? Esta acción no se puede deshacer.',
                );
                if (confirmed && context.mounted) {
                  context.read<ProjectCubit>().deleteProject(project.id);
                }
              },
            );
          },
        );
      },
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
            Icons.folder_open,
            size: 64,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 16),
          Text('Sin proyectos', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            'Creá tu primer proyecto con el botón +',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, size: 48),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () => context.read<ProjectCubit>().loadProjects(),
            child: const Text('Reintentar'),
          ),
        ],
      ),
    );
  }
}
