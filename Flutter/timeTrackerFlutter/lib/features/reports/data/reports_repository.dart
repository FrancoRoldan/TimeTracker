import '../../../core/models/reports/user_report.dart';
import '../../../core/models/reports/project_report.dart';
import '../../../core/models/reports/company_report.dart';
import '../../../core/network/api_client.dart';

class ReportsRepository {
  ReportsRepository({required this.apiClient});

  final ApiClient apiClient;

  Future<UserReport> getUserReport({
    DateTime? dateFrom,
    DateTime? dateTo,
    int? projectId,
    int? issueId,
  }) async {
    final response = await apiClient.get<Map<String, dynamic>>(
      '/reports/user',
      queryParameters: _buildQuery(
        dateFrom: dateFrom,
        dateTo: dateTo,
        projectId: projectId,
        issueId: issueId,
      ),
    );
    return UserReport.fromJson(response.data!);
  }

  Future<UserReport> getUserReportById(
    int userId, {
    DateTime? dateFrom,
    DateTime? dateTo,
    int? projectId,
    int? issueId,
  }) async {
    final response = await apiClient.get<Map<String, dynamic>>(
      '/reports/user/$userId',
      queryParameters: _buildQuery(
        dateFrom: dateFrom,
        dateTo: dateTo,
        projectId: projectId,
        issueId: issueId,
      ),
    );
    return UserReport.fromJson(response.data!);
  }

  Future<ProjectReport> getProjectReport(
    int projectId, {
    DateTime? dateFrom,
    DateTime? dateTo,
    int? issueId,
  }) async {
    final response = await apiClient.get<Map<String, dynamic>>(
      '/reports/project/$projectId',
      queryParameters: _buildQuery(
        dateFrom: dateFrom,
        dateTo: dateTo,
        issueId: issueId,
      ),
    );
    return ProjectReport.fromJson(response.data!);
  }

  Future<CompanyReport> getCompanyReport(
    int companyId, {
    DateTime? dateFrom,
    DateTime? dateTo,
    int? projectId,
    int? issueId,
  }) async {
    final response = await apiClient.get<Map<String, dynamic>>(
      '/reports/company/$companyId',
      queryParameters: _buildQuery(
        dateFrom: dateFrom,
        dateTo: dateTo,
        projectId: projectId,
        issueId: issueId,
      ),
    );
    return CompanyReport.fromJson(response.data!);
  }

  Map<String, dynamic> _buildQuery({
    DateTime? dateFrom,
    DateTime? dateTo,
    int? projectId,
    int? issueId,
  }) => {
    if (dateFrom != null) 'dateFrom': dateFrom.toUtc().toIso8601String(),
    if (dateTo != null) 'dateTo': dateTo.toUtc().toIso8601String(),
    if (projectId != null) 'projectId': projectId,
    if (issueId != null) 'issueId': issueId,
  };
}
