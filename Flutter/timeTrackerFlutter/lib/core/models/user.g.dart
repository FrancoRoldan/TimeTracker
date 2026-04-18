// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

User _$UserFromJson(Map<String, dynamic> json) => User(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      email: json['email'] as String,
    );

Map<String, dynamic> _$UserToJson(User instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'email': instance.email,
    };

CompanyMembership _$CompanyMembershipFromJson(Map<String, dynamic> json) =>
    CompanyMembership(
      companyId: (json['companyId'] as num).toInt(),
      companyName: json['companyName'] as String,
      companyCode: json['companyCode'] as String,
      role: json['role'] as String,
    );

Map<String, dynamic> _$CompanyMembershipToJson(CompanyMembership instance) =>
    <String, dynamic>{
      'companyId': instance.companyId,
      'companyName': instance.companyName,
      'companyCode': instance.companyCode,
      'role': instance.role,
    };

LoginResponse _$LoginResponseFromJson(Map<String, dynamic> json) =>
    LoginResponse(
      token: json['token'] as String,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
      companies: (json['companies'] as List<dynamic>)
          .map((e) => CompanyMembership.fromJson(e as Map<String, dynamic>))
          .toList(),
      selectedCompanyId: (json['selectedCompanyId'] as num?)?.toInt(),
    );

Map<String, dynamic> _$LoginResponseToJson(LoginResponse instance) =>
    <String, dynamic>{
      'token': instance.token,
      'user': instance.user,
      'companies': instance.companies,
      'selectedCompanyId': instance.selectedCompanyId,
    };

UserProfile _$UserProfileFromJson(Map<String, dynamic> json) => UserProfile(
      id: (json['id'] as num).toInt(),
      nombre: json['nombre'] as String,
      email: json['email'] as String,
      fechaCreacion: json['fechaCreacion'] == null
          ? null
          : DateTime.parse(json['fechaCreacion'] as String),
      fechaActualizacion: json['fechaActualizacion'] == null
          ? null
          : DateTime.parse(json['fechaActualizacion'] as String),
    );

Map<String, dynamic> _$UserProfileToJson(UserProfile instance) =>
    <String, dynamic>{
      'id': instance.id,
      'nombre': instance.nombre,
      'email': instance.email,
      'fechaCreacion': instance.fechaCreacion?.toIso8601String(),
      'fechaActualizacion': instance.fechaActualizacion?.toIso8601String(),
    };
