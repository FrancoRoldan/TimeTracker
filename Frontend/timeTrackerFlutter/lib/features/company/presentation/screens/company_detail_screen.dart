import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/enums/user_role.dart';
import '../../../../core/models/company.dart';
import '../../../../core/models/user.dart';
import '../../../../shared/widgets/confirm_dialog.dart';
import '../../bloc/company_cubit.dart';
import '../../bloc/company_state.dart';
import '../widgets/collaborator_dialog.dart';
import '../widgets/company_form_dialog.dart';

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
        if (companyId != null) cubit.loadMembers(companyId);
      }
    });
  }

  void _showCreateDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => BlocProvider.value(
        value: context.read<CompanyCubit>(),
        child: const CompanyFormDialog(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      body: BlocConsumer<CompanyCubit, CompanyState>(
        listenWhen: (prev, curr) {
          if (curr is CompanyError) return true;
          if (prev is CompanyLoaded && curr is CompanyLoaded) {
            return prev.selectedCompany?.companyId !=
                curr.selectedCompany?.companyId;
          }
          return false;
        },
        listener: (context, state) {
          if (state is CompanyError) {
            ScaffoldMessenger.of(context)
              ..hideCurrentSnackBar()
              ..showSnackBar(SnackBar(
                content: Text(state.message),
                backgroundColor: cs.error,
                behavior: SnackBarBehavior.floating,
              ));
          } else if (state is CompanyLoaded) {
            final id = state.selectedCompany?.companyId;
            if (id != null) context.read<CompanyCubit>().loadMembers(id);
          }
        },
        builder: (context, state) {
          if (state is CompanyLoading || state is CompanyInitial) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is CompanyError) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.error_outline, size: 48, color: cs.error),
                  const SizedBox(height: 12),
                  Text(state.message, textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () =>
                        context.read<CompanyCubit>().initFromStorage(),
                    child: const Text('Reintentar'),
                  ),
                ],
              ),
            );
          }

          final loaded = state as CompanyLoaded;
          final memberships = loaded.memberships;
          final selected = loaded.selectedCompany;

          if (memberships.isEmpty) {
            return _EmptyCompanies(
              onCreateTap: () => _showCreateDialog(context),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              final id = selected?.companyId;
              if (id != null) {
                await context.read<CompanyCubit>().loadMembers(id);
              }
            },
            child: CustomScrollView(
              slivers: [
                const SliverAppBar(
                  title: Text('Empresas'),
                  floating: true,
                  snap: true,
                ),
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      Text(
                        'Mis empresas',
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                      ),
                      const SizedBox(height: 12),
                      ...memberships.map(
                        (m) => _MembershipCard(
                          membership: m,
                          isSelected: m.companyId == selected?.companyId,
                          onTap: () =>
                              context.read<CompanyCubit>().selectCompany(m),
                        ),
                      ),
                      if (selected != null) ...[
                        const SizedBox(height: 24),
                        const Divider(),
                        const SizedBox(height: 12),
                        _CompanyInfoCard(
                          selected: selected,
                          isAdmin: selected.userRole.isAdmin,
                        ),
                        const SizedBox(height: 24),
                        _MembersSection(
                          state: loaded,
                          companyId: selected.companyId,
                          isAdmin: selected.userRole.isAdmin,
                        ),
                      ],
                    ]),
                  ),
                ),
              ],
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateDialog(context),
        icon: const Icon(Icons.add),
        label: const Text('Nueva empresa'),
      ),
    );
  }
}

// ── Membership card ───────────────────────────────────────────────────────────

class _MembershipCard extends StatelessWidget {
  const _MembershipCard({
    required this.membership,
    required this.isSelected,
    required this.onTap,
  });

  final CompanyMembership membership;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: isSelected
            ? BorderSide(color: cs.primary, width: 2)
            : BorderSide.none,
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: isSelected
              ? cs.primaryContainer
              : cs.surfaceContainerHighest,
          child: Icon(
            Icons.business,
            color: isSelected ? cs.onPrimaryContainer : cs.onSurfaceVariant,
            size: 20,
          ),
        ),
        title: Text(
          membership.companyName,
          style: TextStyle(
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            color: isSelected ? cs.primary : null,
          ),
        ),
        subtitle: Text(membership.companyCode),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: membership.userRole.color.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            membership.userRole.label,
            style: TextStyle(
              fontSize: 11,
              color: membership.userRole.color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        onTap: onTap,
      ),
    );
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────

class _EmptyCompanies extends StatelessWidget {
  const _EmptyCompanies({required this.onCreateTap});

  final VoidCallback onCreateTap;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.business_outlined,
            size: 72,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 16),
          Text(
            'No tenés empresas',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'Creá tu primera empresa para empezar',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: onCreateTap,
            icon: const Icon(Icons.add),
            label: const Text('Crear empresa'),
          ),
        ],
      ),
    );
  }
}

// ── Company info card ─────────────────────────────────────────────────────────

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
        child: Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: cs.primaryContainer,
              child:
                  Icon(Icons.business, color: cs.onPrimaryContainer, size: 28),
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
                          color: selected.userRole.color
                              .withValues(alpha: 0.15),
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
      ),
    );
  }
}

// ── Members section ───────────────────────────────────────────────────────────

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
                    child:
                        Text('Eliminar', style: TextStyle(color: Colors.red)),
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
