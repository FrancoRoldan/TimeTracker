import 'package:flutter/material.dart';

enum ProjectStatus {
  active(0),
  onHold(1),
  closed(2);

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
        ProjectStatus.closed => 'Cerrado',
      };

  Color get color => switch (this) {
        ProjectStatus.active => const Color(0xFF4CAF50),
        ProjectStatus.onHold => const Color(0xFFFF9800),
        ProjectStatus.closed => const Color(0xFF9E9E9E),
      };

  IconData get icon => switch (this) {
        ProjectStatus.active => Icons.play_circle,
        ProjectStatus.onHold => Icons.pause_circle,
        ProjectStatus.closed => Icons.check_circle,
      };
}
