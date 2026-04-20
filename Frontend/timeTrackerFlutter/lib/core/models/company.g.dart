// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'company.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Company _$CompanyFromJson(Map<String, dynamic> json) => Company(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      code: json['code'] as String,
      isActive: json['isActive'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$CompanyToJson(Company instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'code': instance.code,
      'isActive': instance.isActive,
      'createdAt': instance.createdAt.toIso8601String(),
    };

CompanyUser _$CompanyUserFromJson(Map<String, dynamic> json) => CompanyUser(
      userId: (json['userId'] as num).toInt(),
      userName: json['userName'] as String,
      userEmail: json['userEmail'] as String,
      role: json['role'] as String,
      joinedAt: DateTime.parse(json['joinedAt'] as String),
      hourlyRate: (json['hourlyRate'] as num?)?.toDouble(),
    );

Map<String, dynamic> _$CompanyUserToJson(CompanyUser instance) =>
    <String, dynamic>{
      'userId': instance.userId,
      'userName': instance.userName,
      'userEmail': instance.userEmail,
      'role': instance.role,
      'hourlyRate': instance.hourlyRate,
      'joinedAt': instance.joinedAt.toIso8601String(),
    };

AvailableUser _$AvailableUserFromJson(Map<String, dynamic> json) =>
    AvailableUser(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      email: json['email'] as String,
    );

Map<String, dynamic> _$AvailableUserToJson(AvailableUser instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'email': instance.email,
    };
