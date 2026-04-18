import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../storage/local_storage.dart';

class AuthInterceptor extends Interceptor {
  AuthInterceptor({required this.localStorage, required this.dio});

  final LocalStorage localStorage;
  // Referencia al Dio principal para reintentar requests después de refresh
  final Dio dio;

  bool _isRefreshing = false;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // No agregar token a los endpoints de auth
    final isAuthEndpoint = options.path.contains('/auth/login') ||
        options.path.contains('/auth/register');

    if (!isAuthEndpoint) {
      final token = await localStorage.getToken();
      if (token != null) {
        options.headers[ApiConstants.headerAuthorization] = 'Bearer $token';
      }

      final companyId = localStorage.getSelectedCompanyId();
      if (companyId != null) {
        options.headers[ApiConstants.headerCompanyId] = companyId.toString();
      }
    }

    return handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final isAuthEndpoint = err.requestOptions.path.contains('/auth/login') ||
        err.requestOptions.path.contains('/auth/register') ||
        err.requestOptions.path.contains('/auth/refresh');

    // No intentar refresh en endpoints de auth — el 401 es credenciales incorrectas
    if (err.response?.statusCode == 401 && !_isRefreshing && !isAuthEndpoint) {
      _isRefreshing = true;

      try {
        final token = await localStorage.getToken();
        if (token == null) {
          await _clearAndReject(err, handler);
          return;
        }

        // Intentar refresh
        final refreshDio = Dio(BaseOptions(baseUrl: ApiConstants.baseUrl));
        final response = await refreshDio.post(
          '/auth/refresh',
          options: Options(
            headers: {ApiConstants.headerAuthorization: 'Bearer $token'},
          ),
        );

        final newToken = response.data['token'] as String;
        await localStorage.saveToken(newToken);

        // Reintentar la request original con el nuevo token
        final retryOptions = err.requestOptions;
        retryOptions.headers[ApiConstants.headerAuthorization] =
            'Bearer $newToken';
        final retryResponse = await dio.fetch(retryOptions);
        return handler.resolve(retryResponse);
      } catch (_) {
        await _clearAndReject(err, handler);
      } finally {
        _isRefreshing = false;
      }
    } else {
      return handler.next(err);
    }
  }

  Future<void> _clearAndReject(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    await localStorage.clearAll();
    return handler.next(err);
  }
}
