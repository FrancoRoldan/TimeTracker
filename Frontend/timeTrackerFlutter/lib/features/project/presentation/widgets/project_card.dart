import 'package:flutter/material.dart';
import '../../../../core/models/project.dart';
import '../../../../core/enums/project_status.dart';
import '../../../../shared/widgets/status_chip.dart';

class ProjectCard extends StatelessWidget {
  const ProjectCard({
    required this.project,
    required this.onTap,
    required this.onEdit,
    required this.onDelete,
    super.key,
  });

  final Project project;
  final VoidCallback onTap;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final status = project.projectStatus;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      project.name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
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
                  ),
                ],
              ),
              const SizedBox(height: 8),
              StatusChip(
                label: status.label,
                color: status.color,
                icon: status.icon,
              ),
              const Spacer(),
              const Divider(height: 20),
              Row(
                children: [
                  const Icon(Icons.task_alt, size: 14),
                  const SizedBox(width: 4),
                  Text(
                    '${project.issueCount} issues',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  if (project.endDate != null) ...[
                    const Spacer(),
                    const Icon(Icons.event, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      '${project.endDate!.day}/${project.endDate!.month}/${project.endDate!.year}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
