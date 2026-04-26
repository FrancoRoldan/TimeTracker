import '../../../core/models/company.dart';
import '../../../core/network/api_client.dart';

class CompanyRepository {
  CompanyRepository({required this.apiClient});

  final ApiClient apiClient;

  Future<List<Company>> getCompanies() async {
    final response = await apiClient.get<List<dynamic>>('/company');
    return (response.data as List)
        .map((e) => Company.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Company> getCompanyById(int id) async {
    final response =
        await apiClient.get<Map<String, dynamic>>('/company/$id');
    return Company.fromJson(response.data!);
  }

  Future<Company> createCompany(String name, String code) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/company',
      data: {'name': name, 'code': code},
    );
    return Company.fromJson(response.data!);
  }

  Future<Company> updateCompany(int id, {String? name, String? code}) async {
    final response = await apiClient.put<Map<String, dynamic>>(
      '/company/$id',
      data: {'name': name, 'code': code},
    );
    return Company.fromJson(response.data!);
  }

  Future<void> deleteCompany(int id) =>
      apiClient.delete('/company/$id');

  Future<List<CompanyUser>> getCompanyUsers(int companyId) async {
    final response =
        await apiClient.get<List<dynamic>>('/company/$companyId/users');
    return (response.data as List)
        .map((e) => CompanyUser.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> addUserToCompany(
      int companyId, int userId, String role, double? hourlyRate) =>
      apiClient.post('/company/$companyId/users', data: {
        'userId': userId,
        'role': role,
        'hourlyRate': hourlyRate,
      });

  Future<void> removeUserFromCompany(int companyId, int userId) =>
      apiClient.delete('/company/$companyId/users/$userId');

  Future<void> updateUserInCompany(
      int companyId, int userId, String? role, double? hourlyRate) =>
      apiClient.put('/company/$companyId/users/$userId', data: {
        'role': role,
        'hourlyRate': hourlyRate,
      });

  Future<List<AvailableUser>> getAvailableUsers(int companyId) async {
    final response = await apiClient
        .get<List<dynamic>>('/company/$companyId/users/available');
    return (response.data as List)
        .map((e) => AvailableUser.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> joinCompany(int companyId, String role, double? hourlyRate) =>
      apiClient.post('/company/join', data: {
        'companyId': companyId,
        'role': role,
        'hourlyRate': hourlyRate,
      });

  Future<void> resetMemberPassword(int userId, String newPassword) =>
      apiClient.put('/users/reset-password', data: {
        'userId': userId,
        'newPassword': newPassword,
      });
}
