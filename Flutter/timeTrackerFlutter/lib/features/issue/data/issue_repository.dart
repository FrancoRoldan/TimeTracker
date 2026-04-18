import '../../../core/models/issue.dart';
import '../../../core/network/api_client.dart';

class IssueRepository {
  IssueRepository({required this.apiClient});

  final ApiClient apiClient;

  Future<List<Issue>> getIssuesByProject(int projectId) async {
    final response = await apiClient.get<List<dynamic>>(
      '/issue/project/$projectId',
    );
    return (response.data as List)
        .map((e) => Issue.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Issue>> getMyIssues({int? companyId}) async {
    final response = await apiClient.get<List<dynamic>>(
      '/issue/assigned-to-me',
      queryParameters: companyId != null ? {'companyId': companyId} : null,
    );
    return (response.data as List)
        .map((e) => Issue.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Issue>> getIssuesWithFilters({
    int? status,
    int? type,
    int? priority,
    int? projectId,
    int? companyId,
  }) async {
    final response = await apiClient.get<List<dynamic>>(
      '/issue/my-companies',
      queryParameters: {
        if (status != null) 'status': status,
        if (type != null) 'type': type,
        if (priority != null) 'priority': priority,
        if (projectId != null) 'projectId': projectId,
        if (companyId != null) 'companyId': companyId,
      },
    );
    return (response.data as List)
        .map((e) => Issue.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Issue> getIssueById(int id) async {
    final response = await apiClient.get<Map<String, dynamic>>('/issue/$id');
    return Issue.fromJson(response.data!);
  }

  Future<Issue> createIssue({
    required int projectId,
    required String title,
    required int type,
    required int status,
    required int priority,
    String? description,
    double? estimatedHours,
    int? assignedUserId,
  }) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/issue',
      data: {
        'projectId': projectId,
        'title': title,
        'description': description,
        'type': type,
        'status': status,
        'priority': priority,
        'estimatedHours': estimatedHours,
        'assignedUserId': assignedUserId,
      },
    );
    return Issue.fromJson(response.data!);
  }

  Future<Issue> updateIssue(
    int id, {
    int? projectId,
    String? title,
    String? description,
    int? status,
    int? priority,
    double? estimatedHours,
    int? assignedUserId,
  }) async {
    final response = await apiClient.put<Map<String, dynamic>>(
      '/issue/$id',
      data: {
        'projectId': projectId,
        'title': title,
        'description': description,
        'status': status,
        'priority': priority,
        'estimatedHours': estimatedHours,
        'assignedUserId': assignedUserId,
      },
    );
    return Issue.fromJson(response.data!);
  }

  Future<Issue> updateIssueStatus(int id, int status) async {
    final response = await apiClient.put<Map<String, dynamic>>(
      '/issue/$id/status',
      data: status,
    );
    return Issue.fromJson(response.data!);
  }

  Future<Issue> assignIssue(int id, int userId) async {
    final response = await apiClient.put<Map<String, dynamic>>(
      '/issue/$id/assign',
      data: userId,
    );
    return Issue.fromJson(response.data!);
  }

  Future<void> deleteIssue(int id) => apiClient.delete('/issue/$id');
}
