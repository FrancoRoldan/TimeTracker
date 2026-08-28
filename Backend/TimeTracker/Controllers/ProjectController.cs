using Core.Services.Projects;
using Data.Dtos.Project;
using Data.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimeTracker.Extensions;

namespace TimeTracker.Controllers
{
    [Route("api/project")]
    [ApiController]
    [Authorize]
    public class ProjectController : ControllerBase
    {
        private readonly IProjectService _projectService;
        private readonly ILogger<ProjectController> _logger;

        public ProjectController(IProjectService projectService, ILogger<ProjectController> logger)
        {
            _projectService = projectService;
            _logger = logger;
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateProject([FromBody] CreateProjectRequest request)
        {
            var result = await _projectService.CreateProjectAsync(request);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return CreatedAtAction(nameof(GetProjectById), new { id = result.Value!.Id }, result.Value);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProjectById(int id)
        {
            var result = await _projectService.GetProjectByIdAsync(id);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllProjects([FromQuery] int? companyId = null)
        {
            var result = await _projectService.GetAllProjectsAsync(companyId);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateProject(int id, [FromBody] UpdateProjectRequest request)
        {
            var result = await _projectService.UpdateProjectAsync(id, request);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> ChangeStatus(int id, [FromBody] ProjectStatus newStatus)
        {
            var result = await _projectService.ChangeProjectStatusAsync(id, newStatus);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(new { message = "Project status updated successfully" });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var result = await _projectService.DeleteProjectAsync(id);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(new { message = "Project deleted successfully" });
        }
    }
}
