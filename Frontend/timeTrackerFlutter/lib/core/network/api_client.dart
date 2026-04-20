import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../storage/local_storage.dart';
import 'auth_interceptor.dart';

class ApiClient {
  ApiClient({required LocalStorage localStorage}) {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: ApiConstants.connectTimeout,
        receiveTimeout: ApiConstants.receiveTimeout,
        headers: {ApiConstants.headerContentType: 'application/json'},
      ),
    );

    _dio.interceptors.add(
      AuthInterceptor(localStorage: localStorage, dio: _dio),
    );
  }

  late final Dio _dio;

  // ── GET ───────────────────────────────────────────────────────────────────

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.get<T>(path,
          queryParameters: queryParameters, options: options);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  // ── POST ──────────────────────────────────────────────────────────────────

  Future<Response<T>> post<T>(
    String path, {
    Object? data,
    Options? options,
  }) async {
    try {
      return await _dio.post<T>(path, data: data, options: options);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  // ── PUT ───────────────────────────────────────────────────────────────────

  Future<Response<T>> put<T>(
    String path, {
    Object? data,
    Options? options,
  }) async {
    try {
      return await _dio.put<T>(path, data: data, options: options);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────

  Future<Response<T>> delete<T>(
    String path, {
    Options? options,
  }) async {
    try {
      return await _dio.delete<T>(path, options: options);
    } on DioException catch (e) {
      throw ApiException.fromDioException(e);
    }
  }
}

/// Excepción tipada para errores de API
class ApiException implements Exception {
  const ApiException({
    required this.statusCode,
    required this.message,
  });

  factory ApiException.fromDioException(DioException e) {
    final statusCode = e.response?.statusCode ?? 0;
    final data = e.response?.data;
    String message;

    // Intentar extraer el mensaje de la respuesta del backend
    if (data is Map) {
      if (data['message'] != null && (data['message'] as String).isNotEmpty) {
        message = data['message'] as String;
      } else if (data['errors'] != null) {
        final errors = data['errors'];
        if (errors is Map) {
          final msgs = errors.values
              .expand((v) => v is List ? v.cast<String>() : [v.toString()])
              .toList();
          message = msgs.join('\n');
        } else {
          message = errors.toString();
        }
      } else if (data['title'] != null) {
        // ASP.NET ProblemDetails
        message = data['title'] as String;
      } else {
        message = _fallback(statusCode);
      }
    } else if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      message = 'Sin conexión con el servidor. Verificá que el backend esté corriendo.';
    } else if (e.type == DioExceptionType.connectionError) {
      message = 'No se pudo conectar al servidor. Verificá tu red o la URL del backend.';
    } else {
      message = _fallback(statusCode);
    }

    return ApiException(statusCode: statusCode, message: message);
  }

  static String _fallback(int statusCode) => switch (statusCode) {
        400 => 'Datos inválidos. Revisá los campos ingresados.',
        401 => 'Email o contraseña incorrectos.',
        403 => 'No tenés permisos para realizar esta acción.',
        404 => 'El recurso solicitado no existe.',
        409 => 'Ya existe un registro con esos datos.',
        422 => 'Los datos enviados no son válidos.',
        500 => 'Error interno del servidor. Intentá nuevamente.',
        0 => 'Sin conexión. Verificá tu red.',
        _ => 'Error inesperado (código $statusCode).',
      };

  final int statusCode;
  final String message;

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
