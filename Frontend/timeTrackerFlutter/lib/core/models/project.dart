import 'package:json_annotation/json_annotation.dart';
import '../enums/project_status.dart';

part 'project.g.dart';

@JsonSerializable()
class Project {
  const Project({
    required this.id,
    required this.companyId,
    required this.companyName,
    required this.name,
    required this.status,
    required this.issueCount,
    required this.createdAt,
    this.startDate,
    this.endDate,
  });

  factory Project.fromJson(Map<String, dynamic> json) =>
      _$ProjectFromJson(json);

  final int id;
  final int companyId;
  final String companyName;
  final String name;
  final DateTime? startDate;
  final DateTime? endDate;
  final int status;
  final int issueCount;
  final DateTime createdAt;

  ProjectStatus get projectStatus => ProjectStatus.fromValue(status);

  Map<String, dynamic> toJson() => _$ProjectToJson(this);
}
