using Core.Common;
using Data.Dtos.Project;
using Data.Enums;

namespace Core.Services.Projects
{
    public interface IProjectService
    {
        Task<Result<ProjectResponse>> CreateProjectAsync(CreateProjectRequest request);
        Task<Result<ProjectResponse>> GetProjectByIdAsync(int id);
        Task<Result<List<ProjectResponse>>> GetAllProjectsAsync(int? companyId);
        Task<Result<ProjectResponse>> UpdateProjectAsync(int id, UpdateProjectRequest request);
        Task<Result> DeleteProjectAsync(int id);
        Task<Result> ChangeProjectStatusAsync(int id, ProjectStatus newStatus);
    }
}
