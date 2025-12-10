using Core.Common;
using Core.Services.Tenant;
using Data.Dtos.Project;
using Data.Enums;
using Data.Interfaces;
using Data.Models;
using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Core.Services.Projects
{
    public class ProjectService : IProjectService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITenantService _tenantService;
        private readonly IValidator<CreateProjectRequest> _createValidator;

        public ProjectService(
            IUnitOfWork unitOfWork,
            ITenantService tenantService,
            IValidator<CreateProjectRequest> createValidator)
        {
            _unitOfWork = unitOfWork;
            _tenantService = tenantService;
            _createValidator = createValidator;
        }

        public async Task<Result<ProjectResponse>> CreateProjectAsync(CreateProjectRequest request)
        {
            var validationResult = await _createValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                return Result<ProjectResponse>.Failure(
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList()
                );
            }

            var companyId = _tenantService.GetTenantId();
            if (companyId == null)
                return Result<ProjectResponse>.Failure("User is not associated with a company");

            var project = request.Adapt<Project>();
            project.CompanyId = companyId.Value;
            project.Status = ProjectStatus.Active;

            await _unitOfWork.Projects.AddAsync(project);
            await _unitOfWork.SaveChangesAsync();

            // Load company name for response
            var company = await _unitOfWork.Companies.GetByIdAsync(companyId.Value);
            var response = project.Adapt<ProjectResponse>();
            response = response with
            {
                CompanyName = company?.Name ?? string.Empty,
                IssueCount = 0
            };

            return Result<ProjectResponse>.Success(response);
        }

        public async Task<Result<ProjectResponse>> GetProjectByIdAsync(int id)
        {
            var project = await _unitOfWork.Projects
                .Query()
                .Include(p => p.Company)
                .Include(p => p.Issues)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return Result<ProjectResponse>.Failure("Project not found");

            var response = project.Adapt<ProjectResponse>();
            response = response with
            {
                CompanyName = project.Company?.Name ?? string.Empty,
                IssueCount = project.Issues.Count
            };

            return Result<ProjectResponse>.Success(response);
        }

        public async Task<Result<List<ProjectResponse>>> GetAllProjectsAsync(int? companyId)
        {
            List<Project> projects;

            if (companyId.HasValue)
            {
                projects = await _unitOfWork.Projects
                    .Query()
                    .Where(p => p.CompanyId == companyId.Value)
                    .Include(p => p.Company)
                    .Include(p => p.Issues)
                    .ToListAsync();
            }
            else
            {
                var currentUserId = _tenantService.GetCurrentUserId();
                if (currentUserId == null)
                {
                    return Result<List<ProjectResponse>>.Failure("User not authenticated");
                }

                // Obtener compañías del usuario
                var userCompanyIds = await _unitOfWork.UserCompanies
                    .Query()
                    .Where(uc => uc.UserId == currentUserId.Value)
                    .Select(uc => uc.CompanyId)
                    .ToListAsync();

                if (!userCompanyIds.Any())
                {
                    return Result<List<ProjectResponse>>.Success(new List<ProjectResponse>());
                }

                // Obtener proyectos de esas compañías
                projects = await _unitOfWork.Projects
                    .Query()
                    .Where(p => userCompanyIds.Contains(p.CompanyId))
                    .Include(p => p.Company)
                    .Include(p => p.Issues)
                    .ToListAsync();
            }

            var responses = projects.Select(p =>
            {
                var response = p.Adapt<ProjectResponse>();
                return response with
                {
                    CompanyName = p.Company?.Name ?? string.Empty,
                    IssueCount = p.Issues.Count
                };
            }).ToList();

            return Result<List<ProjectResponse>>.Success(responses);
        }

        public async Task<Result<ProjectResponse>> UpdateProjectAsync(int id, UpdateProjectRequest request)
        {
            var project = await _unitOfWork.Projects.GetByIdAsync(id);
            if (project == null)
                return Result<ProjectResponse>.Failure("Project not found");

            if (!string.IsNullOrEmpty(request.Name))
                project.Name = request.Name;

            if (request.StartDate.HasValue)
                project.StartDate = request.StartDate;

            if (request.EndDate.HasValue)
                project.EndDate = request.EndDate;

            if (request.Status.HasValue)
                project.Status = request.Status.Value;

            _unitOfWork.Projects.Update(project);
            await _unitOfWork.SaveChangesAsync();

            return await GetProjectByIdAsync(id);
        }

        public async Task<Result> DeleteProjectAsync(int id)
        {
            var project = await _unitOfWork.Projects.GetByIdAsync(id);
            if (project == null)
                return Result.Failure("Project not found");

            _unitOfWork.Projects.Delete(project);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result> ChangeProjectStatusAsync(int id, ProjectStatus newStatus)
        {
            var project = await _unitOfWork.Projects.GetByIdAsync(id);
            if (project == null)
                return Result.Failure("Project not found");

            project.Status = newStatus;
            _unitOfWork.Projects.Update(project);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }
    }
}
