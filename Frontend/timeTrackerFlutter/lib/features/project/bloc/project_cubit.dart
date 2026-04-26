import 'package:flutter_bloc/flutter_bloc.dart';
import 'project_state.dart';
import '../data/project_repository.dart';
import '../../../core/models/project.dart';

class ProjectCubit extends Cubit<ProjectState> {
  ProjectCubit({required this.repository}) : super(const ProjectInitial());

  final ProjectRepository repository;

  Future<void> loadProjects({int? companyId}) async {
    emit(const ProjectLoading());
    try {
      final projects = await repository.getProjects(companyId: companyId);
      emit(ProjectLoaded(projects: projects));
    } catch (e) {
      emit(ProjectError(message: e.toString()));
    }
  }

  Future<void> selectProject(int id) async {
    try {
      final project = await repository.getProjectById(id);
      final current = state;
      final projects = current is ProjectLoaded ? current.projects : <Project>[];
      emit(ProjectLoaded(projects: projects, selected: project));
    } catch (e) {
      emit(ProjectError(message: e.toString()));
    }
  }

  Future<void> createProject({
    required String name,
    DateTime? startDate,
    DateTime? endDate,
    int status = 1,
    int? companyId,
  }) async {
    try {
      await repository.createProject(
          name: name, startDate: startDate, endDate: endDate, status: status);
      await loadProjects(companyId: companyId);
    } catch (e) {
      emit(ProjectError(message: e.toString()));
    }
  }

  Future<void> updateProject(
    int id, {
    String? name,
    DateTime? startDate,
    DateTime? endDate,
    int? status,
    int? companyId,
  }) async {
    try {
      await repository.updateProject(id,
          name: name, startDate: startDate, endDate: endDate, status: status);
      await loadProjects(companyId: companyId);
    } catch (e) {
      emit(ProjectError(message: e.toString()));
    }
  }

  Future<void> deleteProject(int id, {int? companyId}) async {
    try {
      await repository.deleteProject(id);
      await loadProjects(companyId: companyId);
    } catch (e) {
      emit(ProjectError(message: e.toString()));
    }
  }
}
