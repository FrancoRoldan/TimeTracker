import '../../../core/models/project.dart';
import '../../../core/network/api_client.dart';

class ProjectRepository {
  ProjectRepository({required this.apiClient});

  final ApiClient apiClient;

  Future<List<Project>> getProjects({int? companyId}) async {
    final response = await apiClient.get<List<dynamic>>(
      '/project',
      queryParameters: companyId != null ? {'companyId': companyId} : null,
    );
    return (response.data as List)
        .map((e) => Project.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Project> getProjectById(int id) async {
    final response = await apiClient.get<Map<String, dynamic>>('/project/$id');
    return Project.fromJson(response.data!);
  }

  Future<Project> createProject({
    required String name,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/project',
      data: {
        'name': name,
        'startDate': startDate?.toUtc().toIso8601String(),
        'endDate': endDate?.toUtc().toIso8601String(),
      },
    );
    return Project.fromJson(response.data!);
  }

  Future<Project> updateProject(
    int id, {
    String? name,
    DateTime? startDate,
    DateTime? endDate,
    int? status,
  }) async {
    final response = await apiClient.put<Map<String, dynamic>>(
      '/project/$id',
      data: {
        'name': name,
        'startDate': startDate?.toUtc().toIso8601String(),
        'endDate': endDate?.toUtc().toIso8601String(),
        'status': status,
      },
    );
    return Project.fromJson(response.data!);
  }

  Future<void> updateProjectStatus(int id, int status) =>
      apiClient.put('/project/$id/status', data: status);

  Future<void> deleteProject(int id) => apiClient.delete('/project/$id');
}
