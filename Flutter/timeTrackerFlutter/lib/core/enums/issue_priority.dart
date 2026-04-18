import 'package:flutter/material.dart';

enum IssuePriority {
  low(1),
  medium(2),
  high(3),
  critical(4);

  const IssuePriority(this.value);
  final int value;

  static IssuePriority fromValue(int value) =>
      IssuePriority.values.firstWhere((e) => e.value == value,
          orElse: () => IssuePriority.medium);
}

extension IssuePriorityExtension on IssuePriority {
  String get label => switch (this) {
        IssuePriority.low => 'Baja',
        IssuePriority.medium => 'Media',
        IssuePriority.high => 'Alta',
        IssuePriority.critical => 'Crítica',
      };

  Color get color => switch (this) {
        IssuePriority.low => const Color(0xFF4CAF50),
        IssuePriority.medium => const Color(0xFFFF9800),
        IssuePriority.high => const Color(0xFFF44336),
        IssuePriority.critical => const Color(0xFF9C27B0),
      };

  IconData get icon => switch (this) {
        IssuePriority.low => Icons.arrow_downward,
        IssuePriority.medium => Icons.remove,
        IssuePriority.high => Icons.arrow_upward,
        IssuePriority.critical => Icons.priority_high,
      };
}
