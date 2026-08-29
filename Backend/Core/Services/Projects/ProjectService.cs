using Core.Common;
using Core.Observability;
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

        /// <summary>
        /// Validates that the current user has access to the specified project
        /// </summary>
        private async Task<Result<int>> ValidateProjectOwnershipAsync(int projectId)
        {
            var currentUserId = _tenantService.GetCurrentUserId();
            if (currentUserId == null)
                return Result<int>.Unauthorized("User not authenticated");

            // Optimized: Get companies the user belongs to with AsNoTracking
            var userCompanyIds = await _unitOfWork.UserCompanies
                .Query()
                .AsNoTracking()
                .Where(uc => uc.UserId == currentUserId.Value)
                .Select(uc => uc.CompanyId)
                .ToListAsync();

            if (!userCompanyIds.Any())
                return Result<int>.Failure("User is not associated with any company");

            // Optimized: Verify project belongs to one of user's companies (AsNoTracking)
            var project = await _unitOfWork.Projects
                .Query()
                .AsNoTracking()
                .Where(p => p.Id == projectId && userCompanyIds.Contains(p.CompanyId))
                .FirstOrDefaultAsync();

            if (project == null)
                return Result<int>.NotFound("Project not found or you don't have access");

            return Result<int>.Success(project.CompanyId);
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

            TimeTrackerTelemetry.ProjectsCreated.Add(1, TimeTrackerTelemetry.TenantTag(companyId));

            // Optimized: Load only company name for response
            var companyName = await _unitOfWork.Companies
                .Query()
                .AsNoTracking()
                .Where(c => c.Id == companyId.Value)
                .Select(c => c.Name)
                .FirstOrDefaultAsync();

            var response = project.Adapt<ProjectResponse>();
            response = response with
            {
                CompanyName = companyName ?? string.Empty,
                IssueCount = 0
            };

            return Result<ProjectResponse>.Success(response);
        }

        public async Task<Result<ProjectResponse>> GetProjectByIdAsync(int id)
        {
            // Validate ownership
            var validationResult = await ValidateProjectOwnershipAsync(id);
            if (!validationResult.IsSuccess)
                return Result<ProjectResponse>.Failure(validationResult.Code, validationResult.Error!);

            // Optimized: Load project with only needed data
            var projectData = await _unitOfWork.Projects
                .Query()
                .AsNoTracking()
                .Where(p => p.Id == id)
                .Select(p => new
                {
                    Project = p,
                    CompanyName = p.Company.Name,
                    IssueCount = p.Issues.Count(i => !i.IsDeleted)
                })
                .FirstOrDefaultAsync();

            if (projectData == null)
                return Result<ProjectResponse>.NotFound("Project not found");

            var response = projectData.Project.Adapt<ProjectResponse>();
            response = response with
            {
                CompanyName = projectData.CompanyName ?? string.Empty,
                IssueCount = projectData.IssueCount
            };

            return Result<ProjectResponse>.Success(response);
        }

        /// <summary>
        /// Lista los proyectos de UNA empresa: la indicada en <paramref name="companyId"/>
        /// o, por defecto, la empresa activa de la request (cabecera X-Company-Id).
        ///
        /// Antes tenía dos ramas con sendos problemas de aislamiento multi-tenant:
        /// sin companyId devolvía los proyectos de TODAS las empresas del usuario
        /// —por eso el desplegable de carga manual mostraba proyectos ajenos—, y con
        /// companyId filtraba por el valor recibido sin comprobar que el usuario
        /// perteneciera a esa empresa.
        /// </summary>
        public async Task<Result<List<ProjectResponse>>> GetAllProjectsAsync(int? companyId)
        {
            var currentUserId = _tenantService.GetCurrentUserId();
            if (currentUserId == null)
                return Result<List<ProjectResponse>>.Unauthorized("User not authenticated");

            // La empresa activa sale del token validado contra X-Company-Id.
            var targetCompanyId = companyId ?? _tenantService.GetTenantId();
            if (targetCompanyId == null)
                return Result<List<ProjectResponse>>.Failure("No company selected");

            // Se comprueba la pertenencia en ambos casos, también cuando el id llega
            // por query string: es la request quien lo propone, no una fuente confiable.
            var belongsToCompany = await _unitOfWork.UserCompanies
                .Query()
                .AsNoTracking()
                .AnyAsync(uc => uc.UserId == currentUserId.Value
                             && uc.CompanyId == targetCompanyId.Value);

            if (!belongsToCompany)
                return Result<List<ProjectResponse>>.Forbidden("You don't have access to this company");

            // Proyección directa para no materializar todos los Issues.
            var projectsData = await _unitOfWork.Projects
                .Query()
                .AsNoTracking()
                .Where(p => p.CompanyId == targetCompanyId.Value)
                .Select(p => new
                {
                    Project = p,
                    CompanyName = p.Company.Name,
                    IssueCount = p.Issues.Count(i => !i.IsDeleted)
                })
                .ToListAsync();

            var projectResponses = projectsData.Select(pd =>
            {
                var response = pd.Project.Adapt<ProjectResponse>();
                return response with
                {
                    CompanyName = pd.CompanyName ?? string.Empty,
                    IssueCount = pd.IssueCount
                };
            }).ToList();

            return Result<List<ProjectResponse>>.Success(projectResponses);
        }

        public async Task<Result<ProjectResponse>> UpdateProjectAsync(int id, UpdateProjectRequest request)
        {
            // Validate ownership
            var validationResult = await ValidateProjectOwnershipAsync(id);
            if (!validationResult.IsSuccess)
                return Result<ProjectResponse>.Failure(validationResult.Code, validationResult.Error!);

            var project = await _unitOfWork.Projects.GetByIdAsync(id);
            if (project == null)
                return Result<ProjectResponse>.NotFound("Project not found");

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
            // Validate ownership
            var validationResult = await ValidateProjectOwnershipAsync(id);
            if (!validationResult.IsSuccess)
                return Result.Failure(validationResult.Code, validationResult.Error!);

            var project = await _unitOfWork.Projects.GetByIdAsync(id);
            if (project == null)
                return Result.NotFound("Project not found");

            _unitOfWork.Projects.Delete(project);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result> ChangeProjectStatusAsync(int id, ProjectStatus newStatus)
        {
            // Validate ownership
            var validationResult = await ValidateProjectOwnershipAsync(id);
            if (!validationResult.IsSuccess)
                return Result.Failure(validationResult.Code, validationResult.Error!);

            var project = await _unitOfWork.Projects.GetByIdAsync(id);
            if (project == null)
                return Result.NotFound("Project not found");

            project.Status = newStatus;
            _unitOfWork.Projects.Update(project);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }
    }
}
