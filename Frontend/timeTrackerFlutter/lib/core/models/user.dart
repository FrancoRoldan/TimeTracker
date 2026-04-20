import 'package:json_annotation/json_annotation.dart';
import '../enums/user_role.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  const User({required this.id, required this.name, required this.email});

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);

  final int id;
  final String name;
  final String email;

  Map<String, dynamic> toJson() => _$UserToJson(this);
}

@JsonSerializable()
class CompanyMembership {
  const CompanyMembership({
    required this.companyId,
    required this.companyName,
    required this.companyCode,
    required this.role,
  });

  factory CompanyMembership.fromJson(Map<String, dynamic> json) =>
      _$CompanyMembershipFromJson(json);

  final int companyId;
  final String companyName;
  final String companyCode;
  final String role;

  UserRole get userRole => UserRole.fromString(role);

  Map<String, dynamic> toJson() => _$CompanyMembershipToJson(this);
}

@JsonSerializable()
class LoginResponse {
  const LoginResponse({
    required this.token,
    required this.user,
    required this.companies,
    this.selectedCompanyId,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) =>
      _$LoginResponseFromJson(json);

  final String token;
  final User user;
  final List<CompanyMembership> companies;
  final int? selectedCompanyId;

  Map<String, dynamic> toJson() => _$LoginResponseToJson(this);
}

@JsonSerializable()
class UserProfile {
  const UserProfile({
    required this.id,
    required this.nombre,
    required this.email,
    this.fechaCreacion,
    this.fechaActualizacion,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) =>
      _$UserProfileFromJson(json);

  final int id;
  final String nombre;
  final String email;
  final DateTime? fechaCreacion;
  final DateTime? fechaActualizacion;

  Map<String, dynamic> toJson() => _$UserProfileToJson(this);
}
