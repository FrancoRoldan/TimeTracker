import '../../../core/models/user.dart';
import '../../../core/network/api_client.dart';

class UserRepository {
  UserRepository({required this.apiClient});

  final ApiClient apiClient;

  Future<UserProfile> getUserProfile(int userId) async {
    final response =
        await apiClient.get<Map<String, dynamic>>('/users/profile/$userId');
    return UserProfile.fromJson(response.data!);
  }

  Future<void> updateUser({
    required int id,
    required String nombre,
    required String email,
  }) =>
      apiClient.put('/users/update', data: {
        'id': id,
        'nombre': nombre,
        'email': email,
      });

  Future<void> updatePassword({
    required String oldPassword,
    required String newPassword,
    required String confirmPassword,
  }) =>
      apiClient.put('/users/update-password', data: {
        'oldPassword': oldPassword,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
      });

  Future<void> resetPassword({
    required int userId,
    required String newPassword,
  }) =>
      apiClient.put('/users/reset-password', data: {
        'userId': userId,
        'newPassword': newPassword,
      });
}
