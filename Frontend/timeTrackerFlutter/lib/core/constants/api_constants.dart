class ApiConstants {
  ApiConstants._();

  // Cambiar a URL de producción en release
  static const String baseUrl = 'http://localhost:3001/api';

  static const String headerAuthorization = 'Authorization';
  static const String headerCompanyId = 'X-Company-Id';
  static const String headerContentType = 'Content-Type';

  // Storage keys
  static const String keyToken = 'auth_token';
  static const String keyUser = 'auth_user';
  static const String keyCompanies = 'auth_companies';
  static const String keySelectedCompany = 'selected_company';
  static const String keyTheme = 'app_theme';
  static const String keyDarkMode = 'dark_mode';

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
