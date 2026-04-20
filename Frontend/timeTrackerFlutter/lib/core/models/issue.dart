import 'package:json_annotation/json_annotation.dart';
import '../enums/issue_status.dart';
import '../enums/issue_type.dart';
import '../enums/issue_priority.dart';

part 'issue.g.dart';

@JsonSerializable()
class Issue {
  const Issue({
    required this.id,
    required this.projectId,
    required this.projectName,
    required this.title,
    required this.type,
    required this.status,
    required this.priority,
    required this.createdAt,
    required this.updatedAt,
    this.description,
    this.estimatedHours,
    this.assignedUserId,
    this.assignedUserName,
  });

  factory Issue.fromJson(Map<String, dynamic> json) => _$IssueFromJson(json);

  final int id;
  final int projectId;
  final String projectName;
  final String title;
  final String? description;
  final int type;
  final int status;
  final int priority;
  final double? estimatedHours;
  final int? assignedUserId;
  final String? assignedUserName;
  final DateTime createdAt;
  final DateTime updatedAt;

  IssueType get issueType => IssueType.fromValue(type);
  IssueStatus get issueStatus => IssueStatus.fromValue(status);
  IssuePriority get issuePriority => IssuePriority.fromValue(priority);

  Map<String, dynamic> toJson() => _$IssueToJson(this);
}
