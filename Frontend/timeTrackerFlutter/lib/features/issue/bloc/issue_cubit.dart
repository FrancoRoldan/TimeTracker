import 'package:flutter_bloc/flutter_bloc.dart';
import 'issue_state.dart';
import '../data/issue_repository.dart';
import '../../../core/models/issue.dart';

class IssueCubit extends Cubit<IssueState> {
  IssueCubit({required this.repository}) : super(const IssueInitial());

  final IssueRepository repository;

  int? _lastProjectId;
  int? _lastCompanyId;
  bool _lastWasMyIssues = false;

  Future<void> _reload() async {
    if (_lastWasMyIssues) {
      await loadMyIssues(companyId: _lastCompanyId);
    } else if (_lastProjectId != null) {
      await loadIssuesByProject(_lastProjectId!);
    }
  }

  Future<void> loadMyIssues({int? companyId}) async {
    _lastWasMyIssues = true;
    _lastCompanyId = companyId;
    _lastProjectId = null;
    emit(const IssueLoading());
    try {
      final issues = await repository.getMyIssues(companyId: companyId);
      emit(IssueLoaded(issues: issues));
    } catch (e) {
      emit(IssueError(message: e.toString()));
    }
  }

  Future<void> loadIssuesByProject(int projectId) async {
    _lastWasMyIssues = false;
    _lastProjectId = projectId;
    _lastCompanyId = null;
    emit(const IssueLoading());
    try {
      final issues = await repository.getIssuesByProject(projectId);
      emit(IssueLoaded(issues: issues));
    } catch (e) {
      emit(IssueError(message: e.toString()));
    }
  }

  Future<void> loadIssuesWithFilters({
    int? status,
    int? type,
    int? priority,
    int? projectId,
    int? companyId,
  }) async {
    _lastWasMyIssues = true;
    _lastCompanyId = companyId;
    emit(const IssueLoading());
    try {
      final issues = await repository.getIssuesWithFilters(
        status: status,
        type: type,
        priority: priority,
        projectId: projectId,
        companyId: companyId,
      );
      emit(IssueLoaded(issues: issues));
    } catch (e) {
      emit(IssueError(message: e.toString()));
    }
  }

  Future<void> selectIssue(int id) async {
    try {
      final issue = await repository.getIssueById(id);
      final current = state;
      final issues = current is IssueLoaded ? current.issues : <Issue>[];
      emit(IssueLoaded(issues: issues, selected: issue));
    } catch (e) {
      emit(IssueError(message: e.toString()));
    }
  }

  Future<void> createIssue({
    required int projectId,
    required String title,
    required int type,
    required int status,
    required int priority,
    String? description,
    double? estimatedHours,
    int? assignedUserId,
  }) async {
    try {
      await repository.createIssue(
        projectId: projectId,
        title: title,
        type: type,
        status: status,
        priority: priority,
        description: description,
        estimatedHours: estimatedHours,
        assignedUserId: assignedUserId,
      );
      await _reload();
    } catch (e) {
      emit(IssueError(message: e.toString()));
    }
  }

  Future<void> updateIssue(
    int id, {
    int? projectId,
    String? title,
    String? description,
    int? status,
    int? priority,
    double? estimatedHours,
    int? assignedUserId,
  }) async {
    try {
      await repository.updateIssue(
        id,
        projectId: projectId,
        title: title,
        description: description,
        status: status,
        priority: priority,
        estimatedHours: estimatedHours,
        assignedUserId: assignedUserId,
      );
      await _reload();
    } catch (e) {
      emit(IssueError(message: e.toString()));
    }
  }

  Future<void> updateStatus(int id, int status) async {
    try {
      final updated = await repository.updateIssueStatus(id, status);
      final current = state;
      if (current is IssueLoaded) {
        final issues = current.issues
            .map((i) => i.id == id ? updated : i)
            .toList();
        emit(IssueLoaded(issues: issues, selected: updated));
      }
    } catch (e) {
      emit(IssueError(message: e.toString()));
    }
  }

  Future<void> deleteIssue(int id) async {
    try {
      await repository.deleteIssue(id);
      await _reload();
    } catch (e) {
      emit(IssueError(message: e.toString()));
    }
  }
}
