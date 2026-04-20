import 'package:flutter/material.dart';
import '../../../../core/models/issue.dart';
import '../../../../core/enums/issue_status.dart';
import '../../../../core/enums/issue_type.dart';
import '../../../../core/enums/issue_priority.dart';
import '../../../../shared/widgets/status_chip.dart';

class IssueTile extends StatelessWidget {
  const IssueTile({
    required this.issue,
    required this.onTap,
    required this.onEdit,
    required this.onDelete,
    super.key,
  });

  final Issue issue;
  final VoidCallback onTap;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final priority = issue.issuePriority;
    final status = issue.issueStatus;
    final type = issue.issueType;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 48,
                decoration: BoxDecoration(
                  color: priority.color,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(type.icon, size: 14,
                            color: Theme.of(context).colorScheme.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Text(
                          type.label,
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                              ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          issue.projectName,
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                color: Theme.of(context).colorScheme.primary,
                              ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      issue.title,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (issue.assignedUserName != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.person_outline, size: 12),
                          const SizedBox(width: 4),
                          Text(
                            issue.assignedUserName!,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  StatusChip(
                    label: status.label,
                    color: status.color,
                    icon: status.icon,
                  ),
                  const SizedBox(height: 4),
                  PopupMenuButton<String>(
                    onSelected: (v) {
                      if (v == 'edit') onEdit();
                      if (v == 'delete') onDelete();
                    },
                    itemBuilder: (_) => const [
                      PopupMenuItem(
                        value: 'edit',
                        child: ListTile(
                          leading: Icon(Icons.edit_outlined),
                          title: Text('Editar'),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                      PopupMenuItem(
                        value: 'delete',
                        child: ListTile(
                          leading: Icon(Icons.delete_outline),
                          title: Text('Eliminar'),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ],
                    child: const Icon(Icons.more_vert, size: 18),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
