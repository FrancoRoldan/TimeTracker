// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'issue.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Issue _$IssueFromJson(Map<String, dynamic> json) => Issue(
      id: (json['id'] as num).toInt(),
      projectId: (json['projectId'] as num).toInt(),
      projectName: json['projectName'] as String,
      title: json['title'] as String,
      type: (json['type'] as num).toInt(),
      status: (json['status'] as num).toInt(),
      priority: (json['priority'] as num).toInt(),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      description: json['description'] as String?,
      estimatedHours: (json['estimatedHours'] as num?)?.toDouble(),
      assignedUserId: (json['assignedUserId'] as num?)?.toInt(),
      assignedUserName: json['assignedUserName'] as String?,
    );

Map<String, dynamic> _$IssueToJson(Issue instance) => <String, dynamic>{
      'id': instance.id,
      'projectId': instance.projectId,
      'projectName': instance.projectName,
      'title': instance.title,
      'description': instance.description,
      'type': instance.type,
      'status': instance.status,
      'priority': instance.priority,
      'estimatedHours': instance.estimatedHours,
      'assignedUserId': instance.assignedUserId,
      'assignedUserName': instance.assignedUserName,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };
