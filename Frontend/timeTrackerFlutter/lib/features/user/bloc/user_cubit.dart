import 'package:flutter_bloc/flutter_bloc.dart';
import 'user_state.dart';
import '../data/user_repository.dart';

class UserCubit extends Cubit<UserState> {
  UserCubit({required this.repository}) : super(const UserInitial());

  final UserRepository repository;

  Future<void> loadProfile(int userId) async {
    emit(const UserLoading());
    try {
      final profile = await repository.getUserProfile(userId);
      emit(UserLoaded(profile: profile));
    } catch (e) {
      emit(UserError(message: e.toString()));
    }
  }

  Future<void> updateProfile({
    required int id,
    required String nombre,
    required String email,
  }) async {
    emit(const UserLoading());
    try {
      await repository.updateUser(id: id, nombre: nombre, email: email);
      emit(const UserUpdated(message: 'Perfil actualizado correctamente'));
      await loadProfile(id);
    } catch (e) {
      emit(UserError(message: e.toString()));
    }
  }

  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    emit(const UserLoading());
    try {
      await repository.updatePassword(
        oldPassword: oldPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      );
      emit(const UserUpdated(message: 'Contraseña actualizada correctamente'));
    } catch (e) {
      emit(UserError(message: e.toString()));
    }
  }
}
