import 'package:equatable/equatable.dart';
import '../../../core/models/time_entry.dart';
import '../../../core/models/issue.dart';
import '../../../core/models/project.dart';

class DashboardState extends Equatable {
  const DashboardState({
    this.isLoading = false,
    this.activeTimer,
    this.todayMinutes = 0,
    this.activeIssues = const [],
    this.activeProjects = const [],
    this.recentEntries = const [],
    this.error,
  });

  final bool isLoading;
  final TimeEntry? activeTimer;
  final int todayMinutes;
  final List<Issue> activeIssues;
  final List<Project> activeProjects;
  final List<TimeEntry> recentEntries;
  final String? error;

  String get todayFormatted {
    final h = todayMinutes ~/ 60;
    final m = todayMinutes % 60;
    return '${h}h ${m.toString().padLeft(2, '0')}m';
  }

  DashboardState copyWith({
    bool? isLoading,
    TimeEntry? activeTimer,
    bool clearTimer = false,
    int? todayMinutes,
    List<Issue>? activeIssues,
    List<Project>? activeProjects,
    List<TimeEntry>? recentEntries,
    String? error,
  }) =>
      DashboardState(
        isLoading: isLoading ?? this.isLoading,
        activeTimer: clearTimer ? null : activeTimer ?? this.activeTimer,
        todayMinutes: todayMinutes ?? this.todayMinutes,
        activeIssues: activeIssues ?? this.activeIssues,
        activeProjects: activeProjects ?? this.activeProjects,
        recentEntries: recentEntries ?? this.recentEntries,
        error: error,
      );

  @override
  List<Object?> get props => [
        isLoading,
        activeTimer,
        todayMinutes,
        activeIssues,
        activeProjects,
        recentEntries,
        error,
      ];
}
