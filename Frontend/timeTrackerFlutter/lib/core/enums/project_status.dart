import 'package:flutter/material.dart';

enum ProjectStatus {
  active(1),
  onHold(2),
  completed(3),
  cancelled(4);

  const ProjectStatus(this.value);
  final int value;

  static ProjectStatus fromValue(int value) =>
      ProjectStatus.values.firstWhere((e) => e.value == value,
          orElse: () => ProjectStatus.active);
}

extension ProjectStatusExtension on ProjectStatus {
  String get label => switch (this) {
        ProjectStatus.active => 'Activo',
        ProjectStatus.onHold => 'En pausa',
        ProjectStatus.completed => 'Completado',
        ProjectStatus.cancelled => 'Cancelado',
      };

  Color get color => switch (this) {
        ProjectStatus.active => const Color(0xFF4CAF50),
        ProjectStatus.onHold => const Color(0xFFFF9800),
        ProjectStatus.completed => const Color(0xFF2196F3),
        ProjectStatus.cancelled => const Color(0xFF757575),
      };

  IconData get icon => switch (this) {
        ProjectStatus.active => Icons.play_circle,
        ProjectStatus.onHold => Icons.pause_circle,
        ProjectStatus.completed => Icons.check_circle,
        ProjectStatus.cancelled => Icons.cancel,
      };
}
