using Core.Common;
using Core.Observability;
using Core.Services.Tenant;
using Data.Dtos.Reports;
using Data.Enums;
using Data.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Core.Services.Reports
{
    public class ReportingService : IReportingService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITenantService _tenantService;

        public ReportingService(IUnitOfWork unitOfWork, ITenantService tenantService)
        {
            _unitOfWork = unitOfWork;
            _tenantService = tenantService;
        }

        public async Task<Result<UserReportResponse>> GetUserReportAsync(
            int? userId = null,
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            int? projectId = null,
            int? issueId = null)
        {
            var currentUserId = userId ?? _tenantService.GetCurrentUserId();
            if (currentUserId == null)
                return Result<UserReportResponse>.Unauthorized("User not authenticated");

            // If querying another user, verify permission
            if (userId.HasValue && userId != _tenantService.GetCurrentUserId())
            {
                var currentUserCompany = await _unitOfWork.UserCompanies
                    .Query()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(uc =>
                        uc.UserId == _tenantService.GetCurrentUserId() &&
                        uc.CompanyId == _tenantService.GetTenantId());

                if (currentUserCompany?.Role != UserRole.Admin &&
                    currentUserCompany?.Role != UserRole.Manager)
                {
                    return Result<UserReportResponse>.Forbidden(
                        "You don't have permission to view other users' reports"
                    );
                }
            }

            var companyId = _tenantService.GetTenantId();

            // Build query with filters - NO ENTITY LOADING, AsNoTracking
            var query = _unitOfWork.TimeEntries
                .Query()
                .AsNoTracking()
                .Where(te => te.UserId == currentUserId && te.EndTime != null && te.CompanyId == companyId);

            if (dateFrom.HasValue)
                query = query.Where(te => te.StartTime >= dateFrom.Value);

            if (dateTo.HasValue)
                query = query.Where(te => te.EndTime < dateTo.Value.Date.AddDays(1));

            if (projectId.HasValue)
                query = query.Where(te => te.Issue.ProjectId == projectId.Value);

            if (issueId.HasValue)
                query = query.Where(te => te.IssueId == issueId.Value);

            // CRITICAL: Project directly to DTOs - No entity materialization
            var dailyData = await query
                .GroupBy(te => te.StartTime.Date)
                .Select(g => new DailyBreakdown
                {
                    Date = g.Key,
                    TotalMinutes = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes),
                    TotalHours = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes) / 60m,
                    EntriesCount = g.Count()
                })
                .OrderBy(d => d.Date)
                .ToListAsync();

            var projectData = await query
                .GroupBy(te => new { te.Issue.ProjectId, te.Issue.Project.Name })
                .Select(g => new ProjectBreakdown
                {
                    ProjectId = g.Key.ProjectId,
                    ProjectName = g.Key.Name,
                    TotalMinutes = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes),
                    TotalHours = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes) / 60m,
                    EntriesCount = g.Count()
                })
                .ToListAsync();

            var issueData = await query
                .GroupBy(te => new { te.IssueId, te.Issue.Title, te.Issue.Project.Name })
                .Select(g => new IssueBreakdown
                {
                    IssueId = g.Key.IssueId??0,
                    IssueTitle = g.Key.Title,
                    ProjectName = g.Key.Name,
                    TotalMinutes = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes),
                    TotalHours = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes) / 60m,
                    EntriesCount = g.Count()
                })
                .ToListAsync();

            var issueTypeData = await query
                .GroupBy(te => te.Issue.Type)
                .Select(g => new IssueTypeBreakdown
                {
                    IssueType = g.Key,
                    TotalMinutes = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes),
                    TotalHours = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes) / 60m,
                    EntriesCount = g.Count()
                })
                .ToListAsync();

            var totalMinutes = dailyData.Sum(d => d.TotalMinutes);

            var user = await _unitOfWork.Users
                .Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == currentUserId.Value);

            var report = new UserReportResponse
            {
                UserId = currentUserId.Value,
                UserName = user?.Nombre ?? string.Empty,
                TotalMinutes = totalMinutes,
                TotalHours = totalMinutes / 60m,
                DateFrom = dateFrom,
                DateTo = dateTo,
                DailyBreakdown = dailyData,
                ProjectBreakdown = projectData,
                IssueBreakdown = issueData,
                IssueTypeBreakdown = issueTypeData
            };

            TimeTrackerTelemetry.ReportsGenerated.Add(
                1, new KeyValuePair<string, object?>("report.type", "user"));

            return Result<UserReportResponse>.Success(report);
        }

        public async Task<Result<ProjectReportResponse>> GetProjectReportAsync(
            int projectId,
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            int? issueId = null)
        {
            var companyId = _tenantService.GetTenantId();

            // Verify project exists and belongs to current company
            var project = await _unitOfWork.Projects
                .Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == projectId && p.CompanyId == companyId);

            if (project == null)
                return Result<ProjectReportResponse>.NotFound("Project not found");

            // Build query with filters - AsNoTracking
            var query = _unitOfWork.TimeEntries
                .Query()
                .AsNoTracking()
                .Where(te => te.Issue.ProjectId == projectId && te.EndTime != null && te.CompanyId == companyId);

            if (dateFrom.HasValue)
                query = query.Where(te => te.StartTime >= dateFrom.Value);

            if (dateTo.HasValue)
                query = query.Where(te => te.EndTime < dateTo.Value.Date.AddDays(1));

            if (issueId.HasValue)
                query = query.Where(te => te.IssueId == issueId.Value);

            // CRITICAL: Direct projection to DTOs
            var userBreakdown = await query
                .GroupBy(te => new { te.UserId, te.User.Nombre })
                .Select(g => new UserBreakdown
                {
                    UserId = g.Key.UserId,
                    UserName = g.Key.Nombre,
                    TotalMinutes = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes),
                    TotalHours = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes) / 60m,
                    EntriesCount = g.Count()
                })
                .ToListAsync();

            var issueBreakdown = await query
                .GroupBy(te => new { te.IssueId, te.Issue.Title, te.Issue.Project.Name })
                .Select(g => new IssueBreakdown
                {
                    IssueId = g.Key.IssueId??0,
                    IssueTitle = g.Key.Title,
                    ProjectName = g.Key.Name,
                    TotalMinutes = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes),
                    TotalHours = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes) / 60m,
                    EntriesCount = g.Count()
                })
                .ToListAsync();

            var dailyBreakdown = await query
                .GroupBy(te => te.StartTime.Date)
                .Select(g => new DailyBreakdown
                {
                    Date = g.Key,
                    TotalMinutes = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes),
                    TotalHours = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes) / 60m,
                    EntriesCount = g.Count()
                })
                .OrderBy(d => d.Date)
                .ToListAsync();

            var totalMinutes = dailyBreakdown.Sum(d => d.TotalMinutes);

            var report = new ProjectReportResponse
            {
                ProjectId = projectId,
                ProjectName = project.Name,
                TotalMinutes = totalMinutes,
                TotalHours = totalMinutes / 60m,
                DateFrom = dateFrom,
                DateTo = dateTo,
                UserBreakdown = userBreakdown,
                IssueBreakdown = issueBreakdown,
                DailyBreakdown = dailyBreakdown
            };

            TimeTrackerTelemetry.ReportsGenerated.Add(
                1, new KeyValuePair<string, object?>("report.type", "project"));

            return Result<ProjectReportResponse>.Success(report);
        }

        public async Task<Result<CompanyReportResponse>> GetCompanyReportAsync(
            int? companyId = null,
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            int? projectId = null,
            int? issueId = null)
        {
            // El reporte de empresa es el endpoint más pesado (§9): agrega TimeEntries
            // sin paginación, así que se le da su propio span.
            using var activity = TimeTrackerTelemetry.StartActivity("GenerateCompanyReport");

            var targetCompanyId = companyId ?? _tenantService.GetTenantId();
            if (targetCompanyId == null)
                return Result<CompanyReportResponse>.Failure("Company not specified");

            // Verify user has permission (Admin or Manager)
            var currentUserCompany = await _unitOfWork.UserCompanies
                .Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(uc =>
                    uc.UserId == _tenantService.GetCurrentUserId() &&
                    uc.CompanyId == targetCompanyId);

            if (currentUserCompany == null ||
                (currentUserCompany.Role != UserRole.Admin && currentUserCompany.Role != UserRole.Manager))
            {
                return Result<CompanyReportResponse>.Forbidden(
                    "You don't have permission to view company reports"
                );
            }

            var company = await _unitOfWork.Companies
                .Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == targetCompanyId);

            if (company == null)
                return Result<CompanyReportResponse>.NotFound("Company not found");

            // Build query with filters - AsNoTracking
            var query = _unitOfWork.TimeEntries
                .Query()
                .AsNoTracking()
                .Where(te => te.CompanyId == targetCompanyId && te.EndTime != null);

            if (dateFrom.HasValue)
                query = query.Where(te => te.StartTime >= dateFrom.Value);

            if (dateTo.HasValue)
                query = query.Where(te => te.EndTime < dateTo.Value.Date.AddDays(1));

            if (projectId.HasValue)
                query = query.Where(te => te.Issue.ProjectId == projectId.Value);

            if (issueId.HasValue)
                query = query.Where(te => te.IssueId == issueId.Value);

            // CRITICAL: Direct projection to DTOs
            var userBreakdown = await query
                .GroupBy(te => new { te.UserId, te.User.Nombre })
                .Select(g => new UserBreakdown
                {
                    UserId = g.Key.UserId,
                    UserName = g.Key.Nombre,
                    TotalMinutes = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes),
                    TotalHours = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes) / 60m,
                    EntriesCount = g.Count()
                })
                .ToListAsync();

            var projectBreakdown = await query
                .GroupBy(te => new { te.Issue.ProjectId, te.Issue.Project.Name })
                .Select(g => new ProjectBreakdown
                {
                    ProjectId = g.Key.ProjectId,
                    ProjectName = g.Key.Name,
                    TotalMinutes = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes),
                    TotalHours = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes) / 60m,
                    EntriesCount = g.Count()
                })
                .ToListAsync();

            var dailyBreakdown = await query
                .GroupBy(te => te.StartTime.Date)
                .Select(g => new DailyBreakdown
                {
                    Date = g.Key,
                    TotalMinutes = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes),
                    TotalHours = g.Sum(te => (int)(te.EndTime!.Value - te.StartTime).TotalMinutes) / 60m,
                    EntriesCount = g.Count()
                })
                .OrderBy(d => d.Date)
                .ToListAsync();

            var totalMinutes = dailyBreakdown.Sum(d => d.TotalMinutes);

            var report = new CompanyReportResponse
            {
                CompanyId = targetCompanyId.Value,
                CompanyName = company.Name,
                TotalMinutes = totalMinutes,
                TotalHours = totalMinutes / 60m,
                DateFrom = dateFrom,
                DateTo = dateTo,
                UserBreakdown = userBreakdown,
                ProjectBreakdown = projectBreakdown,
                DailyBreakdown = dailyBreakdown
            };

            TimeTrackerTelemetry.ReportsGenerated.Add(
                1, new KeyValuePair<string, object?>("report.type", "company"));

            return Result<CompanyReportResponse>.Success(report);
        }
    }
}
