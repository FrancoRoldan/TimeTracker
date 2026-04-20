import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/enums/user_role.dart';
import '../../../../core/models/company.dart';
import '../../../../core/models/user.dart';
import '../../../../shared/widgets/confirm_dialog.dart';
import '../../bloc/company_cubit.dart';
import '../../bloc/company_state.dart';
import '../widgets/collaborator_dialog.dart';

class CompanyDetailScreen extends StatefulWidget {
  const CompanyDetailScreen({super.key});

  @override
  State<CompanyDetailScreen> createState() => _CompanyDetailScreenState();
}

class _CompanyDetailScreenState extends State<CompanyDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final cubit = context.read<CompanyCubit>();
      final state = cubit.state;
      if (state is CompanyLoaded) {
        final companyId = state.selectedCompany?.companyId;
        if (companyId != null) {
          cubit.loadMembers(companyId);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocConsumer<CompanyCubit, CompanyState>(
        listener: (context, state) {
          if (state is CompanyError) {
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
          if (state is! CompanyLoaded) {
            return const Center(child: CircularProgressIndicator());
          }
          final selected = state.selectedCompany;
          if (selected == null) {
            return const Center(
              child: Text('No hay empresa seleccionada'),
            );
          }
          final isAdmin = selected.userRole.isAdmin;
          final companyId = selected.companyId;

          return RefreshIndicator(
            onRefresh: () =>
                context.read<CompanyCubit>().loadMembers(companyId),
            child: CustomScrollView(
              slivers: [
                SliverAppBar(
                  title: Text(selected.companyName),
                  floating: true,
                  snap: true,
                ),
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      _CompanyInfoCard(selected: selected, isAdmin: isAdmin),
                      const SizedBox(height: 24),
                      _MembersSection(
                        state: state,
                        companyId: companyId,
                        isAdmin: isAdmin,
                      ),
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

class _CompanyInfoCard extends StatelessWidget {
  const _CompanyInfoCard({required this.selected, required this.isAdmin});

  final CompanyMembership selected;
  final bool isAdmin;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: cs.primaryContainer,
                  child: Icon(Icons.business, color: cs.onPrimaryContainer, size: 28),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        selected.companyName,
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: cs.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              selected.companyCode,
                              style: Theme.of(context)
                                  .textTheme
                                  .labelMedium
                                  ?.copyWith(fontFamily: 'monospace'),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: selected.userRole.color.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              selected.userRole.label,
                              style: TextStyle(
                                fontSize: 12,
                                color: selected.userRole.color,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MembersSection extends StatelessWidget {
  const _MembersSection({
    required this.state,
    required this.companyId,
    required this.isAdmin,
  });

  final CompanyLoaded state;
  final int companyId;
  final bool isAdmin;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Colaboradores',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const Spacer(),
            if (isAdmin && state.availableUsers.isNotEmpty)
              FilledButton.icon(
                onPressed: () => showDialog(
                  context: context,
                  builder: (_) => BlocProvider.value(
                    value: context.read<CompanyCubit>(),
                    child: AddCollaboratorDialog(
                      companyId: companyId,
                      availableUsers: state.availableUsers,
                    ),
                  ),
                ),
                icon: const Icon(Icons.person_add_outlined, size: 18),
                label: const Text('Agregar'),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (state.membersLoading)
          const Center(child: CircularProgressIndicator())
        else if (state.members.isEmpty)
          _EmptyMembers()
        else
          ...state.members.map(
            (member) => _MemberTile(
              member: member,
              companyId: companyId,
              isAdmin: isAdmin,
            ),
          ),
      ],
    );
  }
}

class _EmptyMembers extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Column(
          children: [
            Icon(Icons.group_outlined,
                size: 48,
                color: Theme.of(context).colorScheme.onSurfaceVariant),
            const SizedBox(height: 12),
            Text('Sin colaboradores',
                style: Theme.of(context).textTheme.bodyLarge),
          ],
        ),
      ),
    );
  }
}

class _MemberTile extends StatelessWidget {
  const _MemberTile({
    required this.member,
    required this.companyId,
    required this.isAdmin,
  });

  final CompanyUser member;
  final int companyId;
  final bool isAdmin;

  @override
  Widget build(BuildContext context) {
    final role = member.userRole;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: role.color.withValues(alpha: 0.15),
          child: Icon(role.icon, color: role.color, size: 20),
        ),
        title: Text(member.userName),
        subtitle: Text(member.userEmail,
            style: Theme.of(context).textTheme.bodySmall),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: role.color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                role.label,
                style: TextStyle(
                  fontSize: 11,
                  color: role.color,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            if (member.hourlyRate != null) ...[
              const SizedBox(width: 8),
              Text(
                '\$${member.hourlyRate!.toStringAsFixed(0)}/h',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            if (isAdmin) ...[
              const SizedBox(width: 4),
              PopupMenuButton<String>(
                itemBuilder: (_) => [
                  const PopupMenuItem(value: 'edit', child: Text('Editar')),
                  const PopupMenuItem(
                    value: 'remove',
                    child: Text('Eliminar', style: TextStyle(color: Colors.red)),
                  ),
                ],
                onSelected: (action) async {
                  if (action == 'edit') {
                    showDialog(
                      context: context,
                      builder: (_) => BlocProvider.value(
                        value: context.read<CompanyCubit>(),
                        child: EditCollaboratorDialog(
                          companyId: companyId,
                          member: member,
                        ),
                      ),
                    );
                  } else if (action == 'remove') {
                    final confirmed = await showConfirmDialog(
                      context,
                      title: 'Eliminar colaborador',
                      message:
                          '¿Eliminás a "${member.userName}" de la empresa?',
                    );
                    if (confirmed && context.mounted) {
                      context
                          .read<CompanyCubit>()
                          .removeMember(companyId, member.userId);
                    }
                  }
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}
