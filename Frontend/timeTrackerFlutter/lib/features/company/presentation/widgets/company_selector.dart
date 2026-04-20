import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/enums/user_role.dart';
import '../../../../core/models/user.dart';
import '../../bloc/company_cubit.dart';
import '../../bloc/company_state.dart';

class CompanySelectorWidget extends StatelessWidget {
  const CompanySelectorWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CompanyCubit, CompanyState>(
      builder: (context, state) {
        if (state is! CompanyLoaded) return const SizedBox.shrink();
        final memberships = state.memberships;
        final selected = state.selectedCompany;
        if (memberships.isEmpty) return const SizedBox.shrink();

        final child = InkWell(
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.business_outlined, size: 18),
                const SizedBox(width: 6),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 130),
                  child: Text(
                    selected?.companyName ?? 'Seleccionar empresa',
                    style: Theme.of(context).textTheme.bodyMedium,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (memberships.length > 1)
                  const Icon(Icons.arrow_drop_down, size: 18),
              ],
            ),
          ),
        );

        if (memberships.length <= 1) return child;

        return PopupMenuButton<CompanyMembership>(
          tooltip: 'Cambiar empresa activa',
          onSelected: (company) =>
              context.read<CompanyCubit>().selectCompany(company),
          itemBuilder: (_) => memberships
              .map((c) => PopupMenuItem<CompanyMembership>(
                    value: c,
                    child: Row(
                      children: [
                        Icon(
                          c.companyId == selected?.companyId
                              ? Icons.radio_button_checked
                              : Icons.radio_button_unchecked,
                          size: 18,
                          color: c.companyId == selected?.companyId
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                        const SizedBox(width: 10),
                        Expanded(child: Text(c.companyName)),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color:
                                c.userRole.color.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            c.userRole.label,
                            style: TextStyle(
                              fontSize: 10,
                              color: c.userRole.color,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ))
              .toList(),
          child: child,
        );
      },
    );
  }
}
