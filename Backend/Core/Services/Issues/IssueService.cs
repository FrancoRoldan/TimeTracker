using Core.Common;
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
                return Result<IssueResponse>.Failure("Project not found");

            if (project.CompanyId != companyId)
                return Result<IssueResponse>.Failure("You don't have access to this project");

            var issue = request.Adapt<Issue>();
            issue.Status = IssueStatus.ToDo;
            issue.CompanyId = companyId;

            await _unitOfWork.Issues.AddAsync(issue);
            await _unitOfWork.SaveChangesAsync();

            return await GetIssueByIdAsync(issue.Id);
        }

        public async Task<Result<IssueResponse>> GetIssueByIdAsync(int id)
        {
            var issue = await _unitOfWork.Issues
                .Query()
                .Include(i => i.Project)
                .Include(i => i.AssignedUser)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (issue == null)
                return Result<IssueResponse>.Failure("Issue not found");

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
            var issues = await _unitOfWork.Issues
                .Query()
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
                return Result<List<IssueResponse>>.Failure("User not authenticated");

            IQueryable<Issue> query = _unitOfWork.Issues
                .Query()
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

        public async Task<Result<List<IssueResponse>>> GetUserIssuesWithFiltersAsync(int? companyId,IssueStatus? status = null, IssueType? type = null, IssuePriority? priority = null)
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
                    return Result<List<IssueResponse>>.Failure("User not authenticated");

                // Obtener compañías del usuario
                var userCompanies = await _unitOfWork.UserCompanies
                    .Query()
                    .Where(uc => uc.UserId == userId)
                    .ToListAsync();

                if (!userCompanies.Any())
                    return Result<List<IssueResponse>>.Success(new List<IssueResponse>());

                var companyIds = userCompanies
                    .Select(uc => uc.CompanyId)
                    .ToList();

                // Obtener proyectos de esas compañías
                projectIds = await _unitOfWork.Projects
                    .Query()
                    .Where(p => companyIds.Contains(p.CompanyId))
                    .Select(p => p.Id)
                    .ToListAsync();

                if (!projectIds.Any())
                    return Result<List<IssueResponse>>.Success(new List<IssueResponse>());
            }

            // Construir la query base de Issues
            IQueryable<Issue> query = _unitOfWork.Issues
                .Query()
                .Where(i => projectIds.Contains(i.ProjectId));

            // Aplicar filtros opcionales
            if (status.HasValue)
                query = query.Where(i => i.Status == status.Value);

            if (type.HasValue)
                query = query.Where(i => i.Type == type.Value);

            if (priority.HasValue)
                query = query.Where(i => i.Priority == priority.Value);

            // Obtener issues con sus relaciones
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
            var issue = await _unitOfWork.Issues.GetByIdAsync(id);
            if (issue == null)
                return Result<IssueResponse>.Failure("Issue not found");

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
                    // Verify user belongs to same company
                    var companyId = _tenantService.GetTenantId();
                    var userCompany = await _unitOfWork.UserCompanies.FindAsync(
                        uc => uc.UserId == request.AssignedUserId.Value && uc.CompanyId == companyId
                    );

                    if (userCompany == null)
                        return Result<IssueResponse>.Failure("User does not belong to this company");

                    issue.AssignedUserId = request.AssignedUserId.Value;
                }
            }

            _unitOfWork.Issues.Update(issue);
            await _unitOfWork.SaveChangesAsync();

            return await GetIssueByIdAsync(id);
        }

        public async Task<Result<IssueResponse>> AssignIssueAsync(int issueId, int userId)
        {
            var issue = await _unitOfWork.Issues
                .Query()
                .Include(i => i.Project)
                .FirstOrDefaultAsync(i => i.Id == issueId);

            if (issue == null)
                return Result<IssueResponse>.Failure("Issue not found");

            // CRITICAL: Verify user belongs to same company
            var companyId = _tenantService.GetTenantId();
            var userCompany = await _unitOfWork.UserCompanies.FindAsync(
                uc => uc.UserId == userId && uc.CompanyId == companyId
            );

            if (userCompany == null)
                return Result<IssueResponse>.Failure("User does not belong to this company");

            issue.AssignedUserId = userId;
            _unitOfWork.Issues.Update(issue);
            await _unitOfWork.SaveChangesAsync();

            return await GetIssueByIdAsync(issueId);
        }

        public async Task<Result<IssueResponse>> ChangeIssueStatusAsync(int issueId, IssueStatus newStatus)
        {
            var issue = await _unitOfWork.Issues.GetByIdAsync(issueId);
            if (issue == null)
                return Result<IssueResponse>.Failure("Issue not found");

            issue.Status = newStatus;
            _unitOfWork.Issues.Update(issue);
            await _unitOfWork.SaveChangesAsync();

            return await GetIssueByIdAsync(issueId);
        }

        public async Task<Result> DeleteIssueAsync(int id)
        {
            var issue = await _unitOfWork.Issues.GetByIdAsync(id);
            if (issue == null)
                return Result.Failure("Issue not found");

            _unitOfWork.Issues.Delete(issue);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }
    }
}
