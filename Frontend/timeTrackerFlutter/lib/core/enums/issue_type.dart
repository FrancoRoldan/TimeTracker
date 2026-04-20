import 'package:flutter/material.dart';

enum IssueType {
  userStory(1),
  bug(2),
  task(3);

  const IssueType(this.value);
  final int value;

  static IssueType fromValue(int value) =>
      IssueType.values.firstWhere((e) => e.value == value,
          orElse: () => IssueType.task);
}

extension IssueTypeExtension on IssueType {
  String get label => switch (this) {
        IssueType.userStory => 'Historia de usuario',
        IssueType.bug => 'Bug',
        IssueType.task => 'Tarea',
      };

  Color get color => switch (this) {
        IssueType.userStory => const Color(0xFF9C27B0),
        IssueType.bug => const Color(0xFFF44336),
        IssueType.task => const Color(0xFF2196F3),
      };

  IconData get icon => switch (this) {
        IssueType.userStory => Icons.person,
        IssueType.bug => Icons.bug_report,
        IssueType.task => Icons.task_alt,
      };
}
