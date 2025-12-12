using Core.Common;
using Data.Dtos.Issue;
using Data.Enums;

namespace Core.Services.Issues
{
    public interface IIssueService
    {
        Task<Result<IssueResponse>> CreateIssueAsync(CreateIssueRequest request);
        Task<Result<IssueResponse>> GetIssueByIdAsync(int id);
        Task<Result<List<IssueResponse>>> GetIssuesByProjectAsync(int projectId);
        Task<Result<List<IssueResponse>>> GetAssignedIssuesAsync(int? companyId = null);
        Task<Result<List<IssueResponse>>> GetProjectAssignedIssuesAsync(int projectId);
        Task<Result<List<IssueResponse>>> GetUserIssuesWithFiltersAsync(int? companyId,IssueStatus? status = null, IssueType? type = null, IssuePriority? priority = null);
        Task<Result<IssueResponse>> UpdateIssueAsync(int id, UpdateIssueRequest request);
        Task<Result<IssueResponse>> AssignIssueAsync(int issueId, int userId);
        Task<Result<IssueResponse>> ChangeIssueStatusAsync(int issueId, IssueStatus newStatus);
        Task<Result> DeleteIssueAsync(int id);
    }
}
