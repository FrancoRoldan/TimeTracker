import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
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

  String _formatDate(DateTime? date) {
    if (date == null) return 'Sin fecha';
    return DateFormat('d MMM yyyy', 'es').format(date);
  }

  @override
  Widget build(BuildContext context) {
    final status = project.projectStatus;
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row: folder icon + name + status chip
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 8, 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.folder, color: colorScheme.primary, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        project.name,
                        style: textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      StatusChip(
                        label: status.label,
                        color: status.color,
                        icon: status.icon,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Info rows
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                _InfoRow(
                  icon: Icons.event,
                  label: 'Inicio:',
                  value: project.startDate != null
                      ? _formatDate(project.startDate)
                      : 'Sin fecha de inicio',
                  muted: project.startDate == null,
                  colorScheme: colorScheme,
                  textTheme: textTheme,
                ),
                const SizedBox(height: 6),
                _InfoRow(
                  icon: Icons.event,
                  label: 'Fin:',
                  value: project.endDate != null
                      ? _formatDate(project.endDate)
                      : 'Sin fecha de fin',
                  muted: project.endDate == null,
                  colorScheme: colorScheme,
                  textTheme: textTheme,
                ),
                const SizedBox(height: 6),
                _InfoRow(
                  icon: Icons.schedule,
                  label: 'Creado:',
                  value: _formatDate(project.createdAt),
                  colorScheme: colorScheme,
                  textTheme: textTheme,
                ),
              ],
            ),
          ),

          const Divider(height: 20, indent: 16, endIndent: 16),

          // Action buttons
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 0, 8, 8),
            child: Row(
              children: [
                TextButton.icon(
                  onPressed: onTap,
                  icon: const Icon(Icons.visibility, size: 18),
                  label: const Text('Ver'),
                  style: TextButton.styleFrom(
                    foregroundColor: colorScheme.primary,
                  ),
                ),
                TextButton.icon(
                  onPressed: onEdit,
                  icon: const Icon(Icons.edit, size: 18),
                  label: const Text('Editar'),
                ),
                TextButton.icon(
                  onPressed: onDelete,
                  icon: const Icon(Icons.delete, size: 18),
                  label: const Text('Eliminar'),
                  style: TextButton.styleFrom(
                    foregroundColor: colorScheme.error,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.colorScheme,
    required this.textTheme,
    this.muted = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool muted;
  final ColorScheme colorScheme;
  final TextTheme textTheme;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: colorScheme.primary),
        const SizedBox(width: 6),
        Text(
          label,
          style: textTheme.bodySmall?.copyWith(
            fontWeight: FontWeight.w500,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(width: 4),
        Expanded(
          child: Text(
            value,
            style: textTheme.bodySmall?.copyWith(
              color: muted
                  ? colorScheme.onSurfaceVariant.withValues(alpha: 0.6)
                  : colorScheme.onSurfaceVariant,
              fontStyle: muted ? FontStyle.italic : FontStyle.normal,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
