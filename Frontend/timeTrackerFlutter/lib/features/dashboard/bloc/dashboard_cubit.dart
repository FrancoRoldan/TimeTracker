import 'package:flutter_bloc/flutter_bloc.dart';
import 'dashboard_state.dart';
import '../../../core/models/time_entry.dart';
import '../../../core/models/issue.dart';
import '../../../core/models/project.dart';
import '../../../core/storage/local_storage.dart';
import '../../../features/time_entry/data/time_entry_repository.dart';
import '../../../features/issue/data/issue_repository.dart';
import '../../../features/project/data/project_repository.dart';

class DashboardCubit extends Cubit<DashboardState> {
  DashboardCubit({
    required this.timeEntryRepository,
    required this.issueRepository,
    required this.projectRepository,
    required this.localStorage,
  }) : super(const DashboardState());

  final TimeEntryRepository timeEntryRepository;
  final IssueRepository issueRepository;
  final ProjectRepository projectRepository;
  final LocalStorage localStorage;

  Future<void> load() async {
    emit(state.copyWith(isLoading: true));
    final companyId = localStorage.getSelectedCompanyId();
    try {
      final now = DateTime.now();
      final todayStart = DateTime(now.year, now.month, now.day);

      final results = await Future.wait([
        timeEntryRepository.getActiveTimer().catchError((_) => null),
        timeEntryRepository
            .getEntries(dateFrom: todayStart, dateTo: now)
            .catchError((_) => <TimeEntry>[]),
        issueRepository.getMyIssues(companyId: companyId).catchError((_) => <Issue>[]),
        projectRepository.getProjects(companyId: companyId).catchError((_) => <Project>[]),
      ]);

      final activeTimer = results[0] as dynamic;
      final todayEntries = results[1] as List<dynamic>;
      final allIssues = results[2] as List<dynamic>;
      final allProjects = results[3] as List<dynamic>;

      final todayMinutes = todayEntries.fold<int>(
        0,
        (sum, e) => sum + ((e.durationMinutes as int?) ?? 0),
      );

      final activeIssues = allIssues
          .where((i) => i.status != 4) // exclude Done (status=4)
          .take(5)
          .toList();

      final activeProjects = allProjects
          .where((p) => p.status == 1) // Active
          .take(6)
          .toList();

      final recentEntries = todayEntries.take(5).toList();

      emit(DashboardState(
        isLoading: false,
        activeTimer: activeTimer,
        todayMinutes: todayMinutes,
        activeIssues: List.from(activeIssues),
        activeProjects: List.from(activeProjects),
        recentEntries: List.from(recentEntries),
      ));
    } catch (e) {
      emit(state.copyWith(isLoading: false, error: e.toString()));
    }
  }

  Future<void> stopTimer() async {
    try {
      await timeEntryRepository.stopTimer();
      emit(state.copyWith(clearTimer: true));
      await load();
    } catch (e) {
      emit(state.copyWith(error: e.toString()));
    }
  }
}
