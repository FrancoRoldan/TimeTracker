import 'package:flutter_bloc/flutter_bloc.dart';
import 'auth_state.dart';
import '../data/auth_repository.dart';

class AuthCubit extends Cubit<AuthState> {
  AuthCubit({required this.repository}) : super(const AuthInitial());

  final AuthRepository repository;

  /// Verifica si hay token guardado al iniciar la app
  Future<void> checkAuthStatus() async {
    final response = await repository.getStoredSession();
    if (response != null) {
      emit(AuthAuthenticated(loginResponse: response));
    } else {
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> login(String email, String password) async {
    emit(const AuthLoading());
    try {
      final response = await repository.login(email, password);
      emit(AuthAuthenticated(loginResponse: response));
    } catch (e) {
      emit(AuthError(message: e.toString()));
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    required int companyId,
  }) async {
    emit(const AuthLoading());
    try {
      final response = await repository.register(
        name: name,
        email: email,
        password: password,
        companyId: companyId,
      );
      emit(AuthAuthenticated(loginResponse: response));
    } catch (e) {
      emit(AuthError(message: e.toString()));
    }
  }

  Future<void> logout() async {
    await repository.logout();
    emit(const AuthUnauthenticated());
  }
}
