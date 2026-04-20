import 'package:json_annotation/json_annotation.dart';
import '../../enums/issue_type.dart';

part 'user_report.g.dart';

@JsonSerializable()
class DailyBreakdown {
  const DailyBreakdown({
    required this.date,
    required this.totalHours,
    required this.totalMinutes,
    required this.entriesCount,
  });

  factory DailyBreakdown.fromJson(Map<String, dynamic> json) =>
      _$DailyBreakdownFromJson(json);

  final String date;
  final double totalHours;
  final int totalMinutes;
  final int entriesCount;

  Map<String, dynamic> toJson() => _$DailyBreakdownToJson(this);
}

@JsonSerializable()
class ProjectBreakdown {
  const ProjectBreakdown({
    required this.projectId,
    required this.projectName,
    required this.totalHours,
    required this.totalMinutes,
    required this.entriesCount,
  });

  factory ProjectBreakdown.fromJson(Map<String, dynamic> json) =>
      _$ProjectBreakdownFromJson(json);

  final int projectId;
  final String projectName;
  final double totalHours;
  final int totalMinutes;
  final int entriesCount;

  Map<String, dynamic> toJson() => _$ProjectBreakdownToJson(this);
}

@JsonSerializable()
class IssueBreakdown {
  const IssueBreakdown({
    required this.issueId,
    required this.issueTitle,
    required this.projectName,
    required this.totalHours,
    required this.totalMinutes,
    required this.entriesCount,
  });

  factory IssueBreakdown.fromJson(Map<String, dynamic> json) =>
      _$IssueBreakdownFromJson(json);

  final int issueId;
  final String issueTitle;
  final String projectName;
  final double totalHours;
  final int totalMinutes;
  final int entriesCount;

  Map<String, dynamic> toJson() => _$IssueBreakdownToJson(this);
}

@JsonSerializable()
class IssueTypeBreakdown {
  const IssueTypeBreakdown({
    required this.issueType,
    required this.totalHours,
    required this.totalMinutes,
    required this.entriesCount,
  });

  factory IssueTypeBreakdown.fromJson(Map<String, dynamic> json) =>
      _$IssueTypeBreakdownFromJson(json);

  final int issueType;
  final double totalHours;
  final int totalMinutes;
  final int entriesCount;

  String get label => IssueType.fromValue(issueType).label;

  Map<String, dynamic> toJson() => _$IssueTypeBreakdownToJson(this);
}

@JsonSerializable()
class UserReport {
  const UserReport({
    required this.userId,
    required this.userName,
    required this.totalHours,
    required this.totalMinutes,
    required this.dailyBreakdown,
    required this.projectBreakdown,
    required this.issueBreakdown,
    required this.issueTypeBreakdown,
    this.dateFrom,
    this.dateTo,
  });

  factory UserReport.fromJson(Map<String, dynamic> json) =>
      _$UserReportFromJson(json);

  final int userId;
  final String userName;
  final double totalHours;
  final int totalMinutes;
  final DateTime? dateFrom;
  final DateTime? dateTo;
  final List<DailyBreakdown> dailyBreakdown;
  final List<ProjectBreakdown> projectBreakdown;
  final List<IssueBreakdown> issueBreakdown;
  final List<IssueTypeBreakdown> issueTypeBreakdown;

  Map<String, dynamic> toJson() => _$UserReportToJson(this);
}
