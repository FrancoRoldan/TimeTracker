import '../../../core/models/time_entry.dart';
import '../../../core/models/paginated_result.dart';
import '../../../core/network/api_client.dart';

class TimeEntryRepository {
  TimeEntryRepository({required this.apiClient});

  final ApiClient apiClient;

  Future<TimeEntry> startTimer({
    int? issueId,
    int? projectId,
    String? description,
  }) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/time/start',
      data: {
        'issueId': issueId,
        'projectId': projectId,
        'description': description,
      },
    );
    return TimeEntry.fromJson(response.data!);
  }

  Future<TimeEntry> stopTimer() async {
    final response = await apiClient.post<Map<String, dynamic>>('/time/stop');
    return TimeEntry.fromJson(response.data!);
  }

  Future<TimeEntry?> getActiveTimer() async {
    try {
      final response = await apiClient.get<Map<String, dynamic>>(
        '/time/active',
      );
      return TimeEntry.fromJson(response.data!);
    } on ApiException catch (e) {
      if (e.isNotFound) return null;
      rethrow;
    }
  }

  Future<TimeEntry> addManualEntry({
    required DateTime startTime,
    required DateTime endTime,
    int? projectId,
    int? issueId,
    String? description,
  }) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/time/manual',
      data: {
        'startTime': startTime.toUtc().toIso8601String(),
        'endTime': endTime.toUtc().toIso8601String(),
        'projectId': projectId,
        'issueId': issueId,
        'description': description,
      },
    );
    return TimeEntry.fromJson(response.data!);
  }

  Future<List<TimeEntry>> getEntries({
    DateTime? dateFrom,
    DateTime? dateTo,
    int? projectId,
    int? issueId,
  }) async {
    final response = await apiClient.get<List<dynamic>>(
      '/time/entries',
      queryParameters: {
        if (dateFrom != null) 'dateFrom': dateFrom.toUtc().toIso8601String(),
        if (dateTo != null) 'dateTo': dateTo.toUtc().toIso8601String(),
        if (projectId != null) 'projectId': projectId,
        if (issueId != null) 'issueId': issueId,
      },
    );
    return (response.data as List)
        .map((e) => TimeEntry.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<PaginatedResult<TimeEntry>> getPaginatedEntries({
    int pageNumber = 1,
    int pageSize = 20,
    DateTime? dateFrom,
    DateTime? dateTo,
    int? projectId,
    int? issueId,
    String? searchTerm,
  }) async {
    final response = await apiClient.get<Map<String, dynamic>>(
      '/time/entries/paginated',
      queryParameters: {
        'pageNumber': pageNumber,
        'pageSize': pageSize,
        if (dateFrom != null) 'dateFrom': dateFrom.toUtc().toIso8601String(),
        if (dateTo != null) 'dateTo': dateTo.toUtc().toIso8601String(),
        if (projectId != null) 'projectId': projectId,
        if (issueId != null) 'issueId': issueId,
        if (searchTerm != null) 'searchTerm': searchTerm,
      },
    );
    return PaginatedResult.fromJson(
      response.data!,
      (e) => TimeEntry.fromJson(e as Map<String, dynamic>),
    );
  }

  Future<TimeEntry> updateEntry(
    int id, {
    int? projectId,
    int? issueId,
    DateTime? startTime,
    DateTime? endTime,
    String? description,
  }) async {
    final response = await apiClient.put<Map<String, dynamic>>(
      '/time/entries/$id',
      data: {
        'projectId': projectId,
        'issueId': issueId,
        'startTime': startTime?.toUtc().toIso8601String(),
        'endTime': endTime?.toUtc().toIso8601String(),
        'description': description,
      },
    );
    return TimeEntry.fromJson(response.data!);
  }

  Future<void> deleteEntry(int id) => apiClient.delete('/time/entries/$id');
}
