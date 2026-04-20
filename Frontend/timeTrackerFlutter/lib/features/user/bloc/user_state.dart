import 'package:equatable/equatable.dart';
import '../../../core/models/user.dart';

sealed class UserState extends Equatable {
  const UserState();
  @override
  List<Object?> get props => [];
}

final class UserInitial extends UserState { const UserInitial(); }
final class UserLoading extends UserState { const UserLoading(); }

final class UserLoaded extends UserState {
  const UserLoaded({required this.profile});
  final UserProfile profile;
  @override
  List<Object?> get props => [profile.id];
}

final class UserUpdated extends UserState {
  const UserUpdated({required this.message});
  final String message;
  @override
  List<Object?> get props => [message];
}

final class UserError extends UserState {
  const UserError({required this.message});
  final String message;
  @override
  List<Object?> get props => [message];
}
