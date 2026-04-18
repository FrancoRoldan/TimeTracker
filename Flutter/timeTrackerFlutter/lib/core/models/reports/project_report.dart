import 'package:json_annotation/json_annotation.dart';
import 'user_report.dart';

part 'project_report.g.dart';

@JsonSerializable()
class UserBreakdown {
  const UserBreakdown({
    required this.userId,
    required this.userName,
    required this.totalHours,
    required this.totalMinutes,
    required this.entriesCount,
  });

  factory UserBreakdown.fromJson(Map<String, dynamic> json) =>
      _$UserBreakdownFromJson(json);

  final int userId;
  final String userName;
  final double totalHours;
  final int totalMinutes;
  final int entriesCount;

  Map<String, dynamic> toJson() => _$UserBreakdownToJson(this);
}

@JsonSerializable()
class ProjectReport {
  const ProjectReport({
    required this.projectId,
    required this.projectName,
    required this.totalHours,
    required this.totalMinutes,
    required this.userBreakdown,
    required this.issueBreakdown,
    required this.dailyBreakdown,
    this.dateFrom,
    this.dateTo,
  });

  factory ProjectReport.fromJson(Map<String, dynamic> json) =>
      _$ProjectReportFromJson(json);

  final int projectId;
  final String projectName;
  final double totalHours;
  final int totalMinutes;
  final DateTime? dateFrom;
  final DateTime? dateTo;
  final List<UserBreakdown> userBreakdown;
  final List<IssueBreakdown> issueBreakdown;
  final List<DailyBreakdown> dailyBreakdown;

  Map<String, dynamic> toJson() => _$ProjectReportToJson(this);
}
