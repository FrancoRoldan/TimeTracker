import 'package:json_annotation/json_annotation.dart';
import '../enums/user_role.dart';

part 'company.g.dart';

@JsonSerializable()
class Company {
  const Company({
    required this.id,
    required this.name,
    required this.code,
    required this.isActive,
    required this.createdAt,
  });

  factory Company.fromJson(Map<String, dynamic> json) =>
      _$CompanyFromJson(json);

  final int id;
  final String name;
  final String code;
  final bool isActive;
  final DateTime createdAt;

  Map<String, dynamic> toJson() => _$CompanyToJson(this);
}

@JsonSerializable()
class CompanyUser {
  const CompanyUser({
    required this.userId,
    required this.userName,
    required this.userEmail,
    required this.role,
    required this.joinedAt,
    this.hourlyRate,
  });

  factory CompanyUser.fromJson(Map<String, dynamic> json) =>
      _$CompanyUserFromJson(json);

  final int userId;
  final String userName;
  final String userEmail;
  final String role;
  final double? hourlyRate;
  final DateTime joinedAt;

  UserRole get userRole => UserRole.fromString(role);

  Map<String, dynamic> toJson() => _$CompanyUserToJson(this);
}

@JsonSerializable()
class AvailableUser {
  const AvailableUser({
    required this.id,
    required this.name,
    required this.email,
  });

  factory AvailableUser.fromJson(Map<String, dynamic> json) =>
      _$AvailableUserFromJson(json);

  final int id;
  final String name;
  final String email;

  Map<String, dynamic> toJson() => _$AvailableUserToJson(this);
}
