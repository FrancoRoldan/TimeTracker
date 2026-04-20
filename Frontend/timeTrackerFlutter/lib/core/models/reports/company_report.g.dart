// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'company_report.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CompanyReport _$CompanyReportFromJson(Map<String, dynamic> json) =>
    CompanyReport(
      companyId: (json['companyId'] as num).toInt(),
      companyName: json['companyName'] as String,
      totalHours: (json['totalHours'] as num).toDouble(),
      totalMinutes: (json['totalMinutes'] as num).toInt(),
      userBreakdown: (json['userBreakdown'] as List<dynamic>)
          .map((e) => UserBreakdown.fromJson(e as Map<String, dynamic>))
          .toList(),
      projectBreakdown: (json['projectBreakdown'] as List<dynamic>)
          .map((e) => ProjectBreakdown.fromJson(e as Map<String, dynamic>))
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

Map<String, dynamic> _$CompanyReportToJson(CompanyReport instance) =>
    <String, dynamic>{
      'companyId': instance.companyId,
      'companyName': instance.companyName,
      'totalHours': instance.totalHours,
      'totalMinutes': instance.totalMinutes,
      'dateFrom': instance.dateFrom?.toIso8601String(),
      'dateTo': instance.dateTo?.toIso8601String(),
      'userBreakdown': instance.userBreakdown,
      'projectBreakdown': instance.projectBreakdown,
      'dailyBreakdown': instance.dailyBreakdown,
    };
