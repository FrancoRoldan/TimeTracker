import 'package:flutter_bloc/flutter_bloc.dart';
import 'time_entry_state.dart';
import '../data/time_entry_repository.dart';
import '../../../core/models/time_entry.dart';

class TimeEntryCubit extends Cubit<TimeEntryState> {
  TimeEntryCubit({required this.repository}) : super(const TimeEntryInitial());

  final TimeEntryRepository repository;

  Future<void> loadEntries({
    DateTime? dateFrom,
    DateTime? dateTo,
    int? projectId,
    int? issueId,
  }) async {
    emit(const TimeEntryLoading());
    try {
      final entries = await repository.getEntries(
        dateFrom: dateFrom,
        dateTo: dateTo,
        projectId: projectId,
        issueId: issueId,
      );
      final active = await repository.getActiveTimer();
      emit(TimeEntryLoaded(entries: entries, activeTimer: active));
    } catch (e) {
      // If 404 on entries, it just means no entries (not an error)
      if (e.toString().contains('404')) {
        emit(const TimeEntryLoaded(entries: [], activeTimer: null));
      } else {
        emit(TimeEntryError(message: e.toString()));
      }
    }
  }

  Future<void> loadPaginated({int page = 1, int pageSize = 20}) async {
    emit(const TimeEntryLoading());
    try {
      final paginated = await repository.getPaginatedEntries(
        pageNumber: page,
        pageSize: pageSize,
      );
      final active = await repository.getActiveTimer();
      emit(
        TimeEntryLoaded(
          entries: paginated.items,
          activeTimer: active,
          paginated: paginated,
        ),
      );
    } catch (e) {
      // If 404 on entries, it just means no entries (not an error)
      if (e.toString().contains('404')) {
        emit(const TimeEntryLoaded(entries: [], activeTimer: null));
      } else {
        emit(TimeEntryError(message: e.toString()));
      }
    }
  }

  Future<void> checkActiveTimer() async {
    try {
      final active = await repository.getActiveTimer();
      final current = state;
      final entries = current is TimeEntryLoaded
          ? current.entries
          : <TimeEntry>[];
      emit(TimeEntryLoaded(entries: entries, activeTimer: active));
    } catch (e) {
      // Ignore 404 errors when checking active timer (expected when no timer is running)
      if (!e.toString().contains('404')) {
        emit(TimeEntryError(message: e.toString()));
      }
    }
  }

  Future<void> startTimer({
    int? issueId,
    int? projectId,
    String? description,
  }) async {
    try {
      final entry = await repository.startTimer(
        issueId: issueId,
        projectId: projectId,
        description: description,
      );
      final current = state;
      final entries = current is TimeEntryLoaded
          ? current.entries
          : <TimeEntry>[];
      emit(TimeEntryLoaded(entries: entries, activeTimer: entry));
    } catch (e) {
      emit(TimeEntryError(message: e.toString()));
    }
  }

  Future<void> stopTimer() async {
    try {
      await repository.stopTimer();
      final current = state;
      final entries = current is TimeEntryLoaded
          ? current.entries
          : <TimeEntry>[];
      emit(TimeEntryLoaded(entries: entries));
      // Reload to get updated list with the completed entry
      await loadEntries();
    } catch (e) {
      emit(TimeEntryError(message: e.toString()));
    }
  }

  Future<void> addManualEntry({
    required DateTime startTime,
    required DateTime endTime,
    int? projectId,
    int? issueId,
    String? description,
  }) async {
    try {
      await repository.addManualEntry(
        startTime: startTime,
        endTime: endTime,
        projectId: projectId,
        issueId: issueId,
        description: description,
      );
      await loadEntries();
    } catch (e) {
      emit(TimeEntryError(message: e.toString()));
    }
  }

  Future<void> updateEntry(
    int id, {
    required int issueId,
    required DateTime startTime,
    required DateTime endTime,
    String? description,
  }) async {
    try {
      await repository.updateEntry(
        id,
        issueId: issueId,
        startTime: startTime,
        endTime: endTime,
        description: description,
      );
      await loadEntries();
    } catch (e) {
      emit(TimeEntryError(message: e.toString()));
    }
  }

  Future<void> deleteEntry(int id) async {
    try {
      await repository.deleteEntry(id);
      await loadEntries();
    } catch (e) {
      emit(TimeEntryError(message: e.toString()));
    }
  }
}
