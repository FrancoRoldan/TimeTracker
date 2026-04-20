import 'package:flutter/material.dart';

enum UserRole {
  admin(1),
  manager(2),
  developer(3),
  viewer(4);

  const UserRole(this.value);
  final int value;

  static UserRole fromValue(int value) =>
      UserRole.values.firstWhere((e) => e.value == value,
          orElse: () => UserRole.viewer);

  static UserRole fromString(String role) =>
      UserRole.values.firstWhere(
        (e) => e.name.toLowerCase() == role.toLowerCase(),
        orElse: () => UserRole.viewer,
      );
}

extension UserRoleExtension on UserRole {
  String get label => switch (this) {
        UserRole.admin => 'Administrador',
        UserRole.manager => 'Gerente',
        UserRole.developer => 'Desarrollador',
        UserRole.viewer => 'Visor',
      };

  Color get color => switch (this) {
        UserRole.admin => const Color(0xFFF44336),
        UserRole.manager => const Color(0xFFFF9800),
        UserRole.developer => const Color(0xFF2196F3),
        UserRole.viewer => const Color(0xFF9E9E9E),
      };

  IconData get icon => switch (this) {
        UserRole.admin => Icons.admin_panel_settings,
        UserRole.manager => Icons.manage_accounts,
        UserRole.developer => Icons.code,
        UserRole.viewer => Icons.visibility,
      };

  bool get canEdit => this == UserRole.admin || this == UserRole.manager || this == UserRole.developer;
  bool get canManage => this == UserRole.admin || this == UserRole.manager;
  bool get isAdmin => this == UserRole.admin;
}
