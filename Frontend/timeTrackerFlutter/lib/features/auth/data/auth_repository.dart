import '../../../core/models/user.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';

class AuthRepository {
  AuthRepository({required this.apiClient, required this.localStorage});

  final ApiClient apiClient;
  final LocalStorage localStorage;

  Future<LoginResponse> login(String email, String password) async {
    try {
      final response = await apiClient.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      final loginResponse =
          LoginResponse.fromJson(response.data!);
      await localStorage.saveToken(loginResponse.token);
      await localStorage.saveUser(loginResponse.user);
      await localStorage.saveCompanies(loginResponse.companies);
      if (loginResponse.companies.isNotEmpty) {
        await localStorage.saveSelectedCompany(loginResponse.companies.first);
      }
      return loginResponse;
    } on ApiException {
      rethrow;
    }
  }

  Future<LoginResponse> register({
    required String name,
    required String email,
    required String password,
    required int companyId,
  }) async {
    try {
      final response = await apiClient.post<Map<String, dynamic>>(
        '/auth/register',
        data: {
          'name': name,
          'email': email,
          'password': password,
          'companyId': companyId,
        },
      );
      final loginResponse = LoginResponse.fromJson(response.data!);
      await localStorage.saveToken(loginResponse.token);
      await localStorage.saveUser(loginResponse.user);
      await localStorage.saveCompanies(loginResponse.companies);
      return loginResponse;
    } on ApiException {
      rethrow;
    }
  }

  /// Reconstruye la sesión desde storage sin llamar al servidor
  Future<LoginResponse?> getStoredSession() async {
    final token = await localStorage.getToken();
    final user = localStorage.getUser();
    final companies = localStorage.getCompanies();
    if (token == null || user == null) return null;
    return LoginResponse(token: token, user: user, companies: companies);
  }

  Future<void> logout() => localStorage.clearAll();

  /// Refresca el JWT obteniendo el listado actualizado de empresas del servidor.
  /// Necesario después de crear una nueva empresa para incluirla en CompanyIds.
  Future<void> refreshToken() async {
    try {
      final response = await apiClient.post<Map<String, dynamic>>('/auth/refresh');
      final newToken = response.data!['token'] as String;
      await localStorage.saveToken(newToken);
    } catch (_) {
      // Silently ignore refresh failures — existing token still works
    }
  }
}
