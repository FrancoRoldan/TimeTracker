import 'package:equatable/equatable.dart';
import '../../../core/models/project.dart';

sealed class ProjectState extends Equatable {
  const ProjectState();
  @override
  List<Object?> get props => [];
}

final class ProjectInitial extends ProjectState { const ProjectInitial(); }
final class ProjectLoading extends ProjectState { const ProjectLoading(); }

final class ProjectLoaded extends ProjectState {
  const ProjectLoaded({required this.projects, this.selected});
  final List<Project> projects;
  final Project? selected;
  @override
  List<Object?> get props => [projects, selected];
}

final class ProjectError extends ProjectState {
  const ProjectError({required this.message});
  final String message;
  @override
  List<Object?> get props => [message];
}
