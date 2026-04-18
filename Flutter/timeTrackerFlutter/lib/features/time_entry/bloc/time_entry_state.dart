import 'package:equatable/equatable.dart';
import '../../../core/models/time_entry.dart';
import '../../../core/models/paginated_result.dart';

sealed class TimeEntryState extends Equatable {
  const TimeEntryState();
  @override
  List<Object?> get props => [];
}

final class TimeEntryInitial extends TimeEntryState { const TimeEntryInitial(); }
final class TimeEntryLoading extends TimeEntryState { const TimeEntryLoading(); }

final class TimeEntryLoaded extends TimeEntryState {
  const TimeEntryLoaded({
    required this.entries,
    this.activeTimer,
    this.paginated,
  });
  final List<TimeEntry> entries;
  final TimeEntry? activeTimer;
  final PaginatedResult<TimeEntry>? paginated;

  bool get hasActiveTimer => activeTimer != null;

  @override
  List<Object?> get props => [entries, activeTimer, paginated];
}

final class TimeEntryError extends TimeEntryState {
  const TimeEntryError({required this.message});
  final String message;
  @override
  List<Object?> get props => [message];
}
