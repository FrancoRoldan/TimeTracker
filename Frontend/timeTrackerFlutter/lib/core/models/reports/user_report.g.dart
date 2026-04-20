// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_report.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DailyBreakdown _$DailyBreakdownFromJson(Map<String, dynamic> json) =>
    DailyBreakdown(
      date: json['date'] as String,
      totalHours: (json['totalHours'] as num).toDouble(),
      totalMinutes: (json['totalMinutes'] as num).toInt(),
      entriesCount: (json['entriesCount'] as num).toInt(),
    );

Map<String, dynamic> _$DailyBreakdownToJson(DailyBreakdown instance) =>
    <String, dynamic>{
      'date': instance.date,
      'totalHours': instance.totalHours,
      'totalMinutes': instance.totalMinutes,
      'entriesCount': instance.entriesCount,
    };

ProjectBreakdown _$ProjectBreakdownFromJson(Map<String, dynamic> json) =>
    ProjectBreakdown(
      projectId: (json['projectId'] as num).toInt(),
      projectName: json['projectName'] as String,
      totalHours: (json['totalHours'] as num).toDouble(),
      totalMinutes: (json['totalMinutes'] as num).toInt(),
      entriesCount: (json['entriesCount'] as num).toInt(),
    );

Map<String, dynamic> _$ProjectBreakdownToJson(ProjectBreakdown instance) =>
    <String, dynamic>{
      'projectId': instance.projectId,
      'projectName': instance.projectName,
      'totalHours': instance.totalHours,
      'totalMinutes': instance.totalMinutes,
      'entriesCount': instance.entriesCount,
    };

IssueBreakdown _$IssueBreakdownFromJson(Map<String, dynamic> json) =>
    IssueBreakdown(
      issueId: (json['issueId'] as num).toInt(),
      issueTitle: json['issueTitle'] as String,
      projectName: json['projectName'] as String,
      totalHours: (json['totalHours'] as num).toDouble(),
      totalMinutes: (json['totalMinutes'] as num).toInt(),
      entriesCount: (json['entriesCount'] as num).toInt(),
    );

Map<String, dynamic> _$IssueBreakdownToJson(IssueBreakdown instance) =>
    <String, dynamic>{
      'issueId': instance.issueId,
      'issueTitle': instance.issueTitle,
      'projectName': instance.projectName,
      'totalHours': instance.totalHours,
      'totalMinutes': instance.totalMinutes,
      'entriesCount': instance.entriesCount,
    };

IssueTypeBreakdown _$IssueTypeBreakdownFromJson(Map<String, dynamic> json) =>
    IssueTypeBreakdown(
      issueType: (json['issueType'] as num).toInt(),
      totalHours: (json['totalHours'] as num).toDouble(),
      totalMinutes: (json['totalMinutes'] as num).toInt(),
      entriesCount: (json['entriesCount'] as num).toInt(),
    );

Map<String, dynamic> _$IssueTypeBreakdownToJson(IssueTypeBreakdown instance) =>
    <String, dynamic>{
      'issueType': instance.issueType,
      'totalHours': instance.totalHours,
      'totalMinutes': instance.totalMinutes,
      'entriesCount': instance.entriesCount,
    };

UserReport _$UserReportFromJson(Map<String, dynamic> json) => UserReport(
      userId: (json['userId'] as num).toInt(),
      userName: json['userName'] as String,
      totalHours: (json['totalHours'] as num).toDouble(),
      totalMinutes: (json['totalMinutes'] as num).toInt(),
      dailyBreakdown: (json['dailyBreakdown'] as List<dynamic>)
          .map((e) => DailyBreakdown.fromJson(e as Map<String, dynamic>))
          .toList(),
      projectBreakdown: (json['projectBreakdown'] as List<dynamic>)
          .map((e) => ProjectBreakdown.fromJson(e as Map<String, dynamic>))
          .toList(),
      issueBreakdown: (json['issueBreakdown'] as List<dynamic>)
          .map((e) => IssueBreakdown.fromJson(e as Map<String, dynamic>))
          .toList(),
      issueTypeBreakdown: (json['issueTypeBreakdown'] as List<dynamic>)
          .map((e) => IssueTypeBreakdown.fromJson(e as Map<String, dynamic>))
          .toList(),
      dateFrom: json['dateFrom'] == null
          ? null
          : DateTime.parse(json['dateFrom'] as String),
      dateTo: json['dateTo'] == null
          ? null
          : DateTime.parse(json['dateTo'] as String),
    );

Map<String, dynamic> _$UserReportToJson(UserReport instance) =>
    <String, dynamic>{
      'userId': instance.userId,
      'userName': instance.userName,
      'totalHours': instance.totalHours,
      'totalMinutes': instance.totalMinutes,
      'dateFrom': instance.dateFrom?.toIso8601String(),
      'dateTo': instance.dateTo?.toIso8601String(),
      'dailyBreakdown': instance.dailyBreakdown,
      'projectBreakdown': instance.projectBreakdown,
      'issueBreakdown': instance.issueBreakdown,
      'issueTypeBreakdown': instance.issueTypeBreakdown,
    };
