// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'project.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Project _$ProjectFromJson(Map<String, dynamic> json) => Project(
      id: (json['id'] as num).toInt(),
      companyId: (json['companyId'] as num).toInt(),
      companyName: json['companyName'] as String,
      name: json['name'] as String,
      status: (json['status'] as num).toInt(),
      issueCount: (json['issueCount'] as num).toInt(),
      createdAt: DateTime.parse(json['createdAt'] as String),
      startDate: json['startDate'] == null
          ? null
          : DateTime.parse(json['startDate'] as String),
      endDate: json['endDate'] == null
          ? null
          : DateTime.parse(json['endDate'] as String),
    );

Map<String, dynamic> _$ProjectToJson(Project instance) => <String, dynamic>{
      'id': instance.id,
      'companyId': instance.companyId,
      'companyName': instance.companyName,
      'name': instance.name,
      'startDate': instance.startDate?.toIso8601String(),
      'endDate': instance.endDate?.toIso8601String(),
      'status': instance.status,
      'issueCount': instance.issueCount,
      'createdAt': instance.createdAt.toIso8601String(),
    };
