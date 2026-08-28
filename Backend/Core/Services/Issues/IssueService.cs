using Core.Common;
using Core.Observability;
using Core.Services.Tenant;
using Data.Dtos.Issue;
using Data.Enums;
using Data.Interfaces;
using Data.Models;
using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using Pipelines.Sockets.Unofficial.Arenas;

namespace Core.Services.Issues
{
    public class IssueService : IIssueService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITenantService _tenantService;
        private readonly IValidator<CreateIssueRequest> _createValidator;

        public IssueService(
            IUnitOfWork unitOfWork,
            ITenantService tenantService,
            IValidator<CreateIssueRequest> createValidator)
        {
            _unitOfWork = unitOfWork;
            _tenantService = tenantService;
            _createValidator = createValidator;
        }

        public async Task<Result<IssueResponse>> CreateIssueAsync(CreateIssueRequest request)
        {
            var validationResult = await _createValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return Result<IssueResponse>.Failure(
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList()
                );
            }

            // Verify project exists and belongs to user's company
            var companyId = _tenantService.GetTenantId();
            var project = await _unitOfWork.Projects.GetByIdAsync(request.ProjectId);

            if (project == null)
                return Result<IssueResponse>.NotFound("Project not found");

            if (project.CompanyId != companyId)
                return Result<IssueResponse>.Forbidden("You don't have access to this project");

            if (request.AssignedUserId.HasValue)
            {
                if (request.AssignedUserId.Value == -1)
                {
                    request.AssignedUserId = null;
                }
                else
                {
                    // Optimized: Use AsNoTracking for validation-only query
                    var userExists = await _unitOfWork.UserCompanies
                        .Query()
                        .AsNoTracking()
                        .AnyAsync(uc => uc.UserId == request.AssignedUserId.Value && uc.CompanyId == companyId);

                    if (!userExists)
                        return Result<IssueResponse>.Forbidden("User does not belong to this company");
                }
            }

            var issue = request.Adapt<Issue>();
            issue.CompanyId = companyId;

            await _unitOfWork.Issues.AddAsync(issue);
            await _unitOfWork.SaveChangesAsync();

            TimeTrackerTelemetry.IssuesCreated.Add(1, TimeTrackerTelemetry.TenantTag(companyId));

            return await GetIssueByIdAsync(issue.Id);
        }

        public async Task<Result<IssueResponse>> GetIssueByIdAsync(int id)
        {
            // Get current user to validate access
            var currentUserId = _tenantService.GetCurrentUserId();
            if (currentUserId == null)
                return Result<IssueResponse>.Unauthorized("User not authenticated");

            // Optimized: AsNoTracking for read-only query
            var issue = await _unitOfWork.Issues
                .Query()
                .AsNoTracking()
                .Include(i => i.Project)
                .Include(i => i.AssignedUser)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (issue == null)
                return Result<IssueResponse>.NotFound("Issue not found");

            // Validate user has access to the issue's company
            if (!issue.CompanyId.HasValue)
                return Result<IssueResponse>.Failure("Issue has no company assigned");

            var userCompanyIds = await _unitOfWork.UserCompanies
                .Query()
                .AsNoTracking()
                .Where(uc => uc.UserId == currentUserId.Value)
                .Select(uc => uc.CompanyId)
                .ToListAsync();

            if (!userCompanyIds.Contains(issue.CompanyId.Value))
                return Result<IssueResponse>.Forbidden("You don't have access to this issue");

            var response = issue.Adapt<IssueResponse>();
            response = response with
            {
                ProjectName = issue.Project?.Name ?? string.Empty,
                AssignedUserName = issue.AssignedUser?.Nombre
            };

            return Result<IssueResponse>.Success(response);
        }

        public async Task<Result<List<IssueResponse>>> GetIssuesByProjectAsync(int projectId)
        {
            // Validate user has access to the project
            var currentUserId = _tenantService.GetCurrentUserId();
            if (currentUserId == null)
                return Result<List<IssueResponse>>.Unauthorized("User not authenticated");

            // Optimized: Get user company IDs with AsNoTracking
            var userCompanyIds = await _unitOfWork.UserCompanies
                .Query()
                .AsNoTracking()
                .Where(uc => uc.UserId == currentUserId.Value)
                .Select(uc => uc.CompanyId)
                .ToListAsync();

            // Optimized: Validate project access with AsNoTracking
            var projectExists = await _unitOfWork.Projects
                .Query()
                .AsNoTracking()
                .AnyAsync(p => p.Id == projectId && userCompanyIds.Contains(p.CompanyId));

            if (!projectExists)
                return Result<List<IssueResponse>>.NotFound("Project not found or you don't have access");

            // Optimized: AsNoTracking for read-only query
            var issues = await _unitOfWork.Issues
                .Query()
                .AsNoTracking()
                .Where(i => i.ProjectId == projectId)
                .Include(i => i.Project)
                .Include(i => i.AssignedUser)
                .ToListAsync();

            var responses = issues.Select(i =>
            {
                var response = i.Adapt<IssueResponse>();
                return response with
                {
                    ProjectName = i.Project?.Name ?? string.Empty,
                    AssignedUserName = i.AssignedUser?.Nombre
                };
            }).ToList();

            return Result<List<IssueResponse>>.Success(responses);
        }

        public async Task<Result<List<IssueResponse>>> GetAssignedIssuesAsync(int? companyId = null)
        {
            var userId = _tenantService.GetCurrentUserId();
            if (userId == null)
                return Result<List<IssueResponse>>.Unauthorized("User not authenticated");

            // Optimized: AsNoTracking for read-only query
            IQueryable<Issue> query = _unitOfWork.Issues
                .Query()
                .AsNoTracking()
                .Where(i => i.AssignedUserId == userId.Value);

            if (companyId.HasValue)
            {
                query = query.Where(i => i.Project.CompanyId == companyId.Value);
            }

            var issues = await query
                .Include(i => i.Project)
                .Include(i => i.AssignedUser)
                .ToListAsync();

            var responses = issues.Select(i =>
            {
                var response = i.Adapt<IssueResponse>();
                return response with
                {
                    ProjectName = i.Project?.Name ?? string.Empty,
                    AssignedUserName = i.AssignedUser?.Nombre
                };
            }).ToList();

            return Result<List<IssueResponse>>.Success(responses);
        }

        public async Task<Result<List<IssueResponse>>> GetProjectAssignedIssuesAsync(int projectId)
        {
            var userId = _tenantService.GetCurrentUserId();
            if (userId == null)
                return Result<List<IssueResponse>>.Unauthorized("User not authenticated");

            // Optimized: AsNoTracking for read-only query
            IQueryable<Issue> query = _unitOfWork.Issues
                .Query()
                .AsNoTracking()
                .Where(i => i.AssignedUserId == userId.Value && i.ProjectId == projectId);

            var issues = await query
                .Include(i => i.Project)
                .Include(i => i.AssignedUser)
                .ToListAsync();

            var responses = issues.Select(i =>
            {
                var response = i.Adapt<IssueResponse>();
                return response with
                {
                    ProjectName = i.Project?.Name ?? string.Empty,
                    AssignedUserName = i.AssignedUser?.Nombre
                };
            }).ToList();

            return Result<List<IssueResponse>>.Success(responses);
        }

        public async Task<Result<List<IssueResponse>>> GetUserIssuesWithFiltersAsync(int? companyId, IssueStatus? status = null, IssueType? type = null, IssuePriority? priority = null)
        {
            List<int> projectIds;

            if (companyId.HasValue)
            {
                projectIds = await _unitOfWork.Projects
                    .Query()
                    .Where(p => p.CompanyId == companyId.Value)
                    .Select(p => p.Id)
                    .ToListAsync();

                if (!projectIds.Any())
                    return Result<List<IssueResponse>>.Success(new List<IssueResponse>());
            }
            else
            {
                var userId = _tenantService.GetCurrentUserId();
                if (userId == null)
                    return Result<List<IssueResponse>>.Unauthorized("User not authenticated");

                // Optimized: Get user company IDs directly with AsNoTracking
                var companyIds = await _unitOfWork.UserCompanies
                    .Query()
                    .AsNoTracking()
                    .Where(uc => uc.UserId == userId)
                    .Select(uc => uc.CompanyId)
                    .ToListAsync();

                if (!companyIds.Any())
                    return Result<List<IssueResponse>>.Success(new List<IssueResponse>());

                // Optimized: Get project IDs with AsNoTracking
                projectIds = await _unitOfWork.Projects
                    .Query()
                    .AsNoTracking()
                    .Where(p => companyIds.Contains(p.CompanyId))
                    .Select(p => p.Id)
                    .ToListAsync();

                if (!projectIds.Any())
                    return Result<List<IssueResponse>>.Success(new List<IssueResponse>());
            }

            // Optimized: Build query with AsNoTracking
            IQueryable<Issue> query = _unitOfWork.Issues
                .Query()
                .AsNoTracking()
                .Where(i => projectIds.Contains(i.ProjectId));

            // Apply optional filters
            if (status.HasValue)
                query = query.Where(i => i.Status == status.Value);

            if (type.HasValue)
                query = query.Where(i => i.Type == type.Value);

            if (priority.HasValue)
                query = query.Where(i => i.Priority == priority.Value);

            // Optimized: Get issues with relations (AsNoTracking already applied)
            var issues = await query
                .Include(i => i.Project)
                    .ThenInclude(p => p.Company)
                .Include(i => i.AssignedUser)
                .ToListAsync();

            // Mapear a Response
            var responses = issues.Select(i =>
            {
                var response = i.Adapt<IssueResponse>();
                return response with
                {
                    ProjectName = i.Project?.Name ?? string.Empty,
                    AssignedUserName = i.AssignedUser?.Nombre
                };
            }).ToList();

            return Result<List<IssueResponse>>.Success(responses);
        }

        public async Task<Result<IssueResponse>> UpdateIssueAsync(int id, UpdateIssueRequest request)
        {
            // Validate access first
            var accessValidation = await ValidateUserAccessToIssueAsync(id);
            if (!accessValidation.IsSuccess)
                return Result<IssueResponse>.Failure(accessValidation.Code, accessValidation.Error!);

            var issue = await _unitOfWork.Issues.GetByIdAsync(id);
            if (issue == null)
                return Result<IssueResponse>.NotFound("Issue not found");

            if (!string.IsNullOrEmpty(request.Title))
                issue.Title = request.Title;

            if (request.Description != null)
                issue.Description = request.Description;

            if (request.Status.HasValue)
                issue.Status = request.Status.Value;

            if (request.Priority.HasValue)
                issue.Priority = request.Priority.Value;

            if (request.EstimatedHours.HasValue)
                issue.EstimatedHours = request.EstimatedHours.Value;

            if (request.AssignedUserId.HasValue)
            {
                // -1 is a sentinel value meaning "unassign"
                if (request.AssignedUserId.Value == -1)
                {
                    issue.AssignedUserId = null;
                }
                else
                {
                    // Optimized: Verify user belongs to same company with AsNoTracking
                    var companyId = _tenantService.GetTenantId();
                    var userExists = await _unitOfWork.UserCompanies
                        .Query()
                        .AsNoTracking()
                        .AnyAsync(uc => uc.UserId == request.AssignedUserId.Value && uc.CompanyId == companyId);

                    if (!userExists)
                        return Result<IssueResponse>.Forbidden("User does not belong to this company");

                    issue.AssignedUserId = request.AssignedUserId.Value;
                }
            }

            _unitOfWork.Issues.Update(issue);
            await _unitOfWork.SaveChangesAsync();

            return await GetIssueByIdAsync(id);
        }

        public async Task<Result<IssueResponse>> AssignIssueAsync(int issueId, int userId)
        {
            // Validate access first
            var accessValidation = await ValidateUserAccessToIssueAsync(issueId);
            if (!accessValidation.IsSuccess)
                return Result<IssueResponse>.Failure(accessValidation.Code, accessValidation.Error!);

            var issue = await _unitOfWork.Issues
                .Query()
                .Include(i => i.Project)
                .FirstOrDefaultAsync(i => i.Id == issueId);

            if (issue == null)
                return Result<IssueResponse>.NotFound("Issue not found");

            // CRITICAL: Verify user belongs to same company (optimized)
            var companyId = _tenantService.GetTenantId();
            var userExists = await _unitOfWork.UserCompanies
                .Query()
                .AsNoTracking()
                .AnyAsync(uc => uc.UserId == userId && uc.CompanyId == companyId);

            if (!userExists)
                return Result<IssueResponse>.Forbidden("User does not belong to this company");

            issue.AssignedUserId = userId;
            _unitOfWork.Issues.Update(issue);
            await _unitOfWork.SaveChangesAsync();

            return await GetIssueByIdAsync(issueId);
        }

        public async Task<Result<IssueResponse>> ChangeIssueStatusAsync(int issueId, IssueStatus newStatus)
        {
            // Validate access first
            var accessValidation = await ValidateUserAccessToIssueAsync(issueId);
            if (!accessValidation.IsSuccess)
                return Result<IssueResponse>.Failure(accessValidation.Code, accessValidation.Error!);

            var issue = await _unitOfWork.Issues.GetByIdAsync(issueId);
            if (issue == null)
                return Result<IssueResponse>.NotFound("Issue not found");

            issue.Status = newStatus;
            _unitOfWork.Issues.Update(issue);
            await _unitOfWork.SaveChangesAsync();

            if (newStatus == IssueStatus.Done)
            {
                TimeTrackerTelemetry.IssuesCompleted.Add(
                    1, TimeTrackerTelemetry.TenantTag(issue.CompanyId));
            }

            return await GetIssueByIdAsync(issueId);
        }

        public async Task<Result> DeleteIssueAsync(int id)
        {
            // Validate access first
            var accessValidation = await ValidateUserAccessToIssueAsync(id);
            if (!accessValidation.IsSuccess)
                return Result.Failure(accessValidation.Code, accessValidation.Error!);

            var issue = await _unitOfWork.Issues.GetByIdAsync(id);
            if (issue == null)
                return Result.NotFound("Issue not found");

            _unitOfWork.Issues.Delete(issue);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        /// <summary>
        /// Validates that the current user has access to the specified issue
        /// </summary>
        private async Task<Result> ValidateUserAccessToIssueAsync(int issueId)
        {
            var currentUserId = _tenantService.GetCurrentUserId();
            if (currentUserId == null)
                return Result.Unauthorized("User not authenticated");

            var issue = await _unitOfWork.Issues
                .Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == issueId);

            if (issue == null)
                return Result.NotFound("Issue not found");

            if (!issue.CompanyId.HasValue)
                return Result.Failure("Issue has no company assigned");

            var userCompanyIds = await _unitOfWork.UserCompanies
                .Query()
                .AsNoTracking()
                .Where(uc => uc.UserId == currentUserId.Value)
                .Select(uc => uc.CompanyId)
                .ToListAsync();

            if (!userCompanyIds.Contains(issue.CompanyId.Value))
                return Result.Forbidden("You don't have access to this issue");

            return Result.Success();
        }
    }
}
