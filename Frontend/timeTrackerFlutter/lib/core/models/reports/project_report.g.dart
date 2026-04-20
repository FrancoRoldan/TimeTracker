// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'project_report.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserBreakdown _$UserBreakdownFromJson(Map<String, dynamic> json) =>
    UserBreakdown(
      userId: (json['userId'] as num).toInt(),
      userName: json['userName'] as String,
      totalHours: (json['totalHours'] as num).toDouble(),
      totalMinutes: (json['totalMinutes'] as num).toInt(),
      entriesCount: (json['entriesCount'] as num).toInt(),
    );

Map<String, dynamic> _$UserBreakdownToJson(UserBreakdown instance) =>
    <String, dynamic>{
      'userId': instance.userId,
      'userName': instance.userName,
      'totalHours': instance.totalHours,
      'totalMinutes': instance.totalMinutes,
      'entriesCount': instance.entriesCount,
    };

ProjectReport _$ProjectReportFromJson(Map<String, dynamic> json) =>
    ProjectReport(
      projectId: (json['projectId'] as num).toInt(),
      projectName: json['projectName'] as String,
      totalHours: (json['totalHours'] as num).toDouble(),
      totalMinutes: (json['totalMinutes'] as num).toInt(),
      userBreakdown: (json['userBreakdown'] as List<dynamic>)
          .map((e) => UserBreakdown.fromJson(e as Map<String, dynamic>))
          .toList(),
      issueBreakdown: (json['issueBreakdown'] as List<dynamic>)
          .map((e) => IssueBreakdown.fromJson(e as Map<String, dynamic>))
          .toList(),
      dailyBreakdown: (json['dailyBreakdown'] as List<dynamic>)
          .map((e) => DailyBreakdown.fromJson(e as Map<String, dynamic>))
          .toList(),
      dateFrom: json['dateFrom'] == null
          ? null
          : DateTime.parse(json['dateFrom'] as String),
      dateTo: json['dateTo'] == null
          ? null
          : DateTime.parse(json['dateTo'] as String),
    );

Map<String, dynamic> _$ProjectReportToJson(ProjectReport instance) =>
    <String, dynamic>{
      'projectId': instance.projectId,
      'projectName': instance.projectName,
      'totalHours': instance.totalHours,
      'totalMinutes': instance.totalMinutes,
      'dateFrom': instance.dateFrom?.toIso8601String(),
      'dateTo': instance.dateTo?.toIso8601String(),
      'userBreakdown': instance.userBreakdown,
      'issueBreakdown': instance.issueBreakdown,
      'dailyBreakdown': instance.dailyBreakdown,
    };
