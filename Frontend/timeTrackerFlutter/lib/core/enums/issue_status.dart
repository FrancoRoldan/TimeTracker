import 'package:flutter/material.dart';

enum IssueStatus {
  toDo(1),
  inProgress(2),
  testing(3),
  done(4);

  const IssueStatus(this.value);
  final int value;

  static IssueStatus fromValue(int value) =>
      IssueStatus.values.firstWhere((e) => e.value == value,
          orElse: () => IssueStatus.toDo);
}

extension IssueStatusExtension on IssueStatus {
  String get label => switch (this) {
        IssueStatus.toDo => 'Por hacer',
        IssueStatus.inProgress => 'En progreso',
        IssueStatus.testing => 'En pruebas',
        IssueStatus.done => 'Completado',
      };

  Color get color => switch (this) {
        IssueStatus.toDo => const Color(0xFF9E9E9E),
        IssueStatus.inProgress => const Color(0xFF2196F3),
        IssueStatus.testing => const Color(0xFFFF9800),
        IssueStatus.done => const Color(0xFF4CAF50),
      };

  Color get backgroundColor => switch (this) {
        IssueStatus.toDo => const Color(0xFFF5F5F5),
        IssueStatus.inProgress => const Color(0xFFE3F2FD),
        IssueStatus.testing => const Color(0xFFFFF3E0),
        IssueStatus.done => const Color(0xFFE8F5E9),
      };

  IconData get icon => switch (this) {
        IssueStatus.toDo => Icons.radio_button_unchecked,
        IssueStatus.inProgress => Icons.timelapse,
        IssueStatus.testing => Icons.bug_report,
        IssueStatus.done => Icons.check_circle,
      };
}
