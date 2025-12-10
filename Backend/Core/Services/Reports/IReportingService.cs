using Core.Common;
using Data.Dtos.Reports;

namespace Core.Services.Reports
{
    public interface IReportingService
    {
        Task<Result<UserReportResponse>> GetUserReportAsync(
            int? userId = null,
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            int? projectId = null,
            int? issueId = null);

        Task<Result<ProjectReportResponse>> GetProjectReportAsync(
            int projectId,
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            int? issueId = null);

        Task<Result<CompanyReportResponse>> GetCompanyReportAsync(
            int? companyId = null,
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            int? projectId = null,
            int? issueId = null);
    }
}
