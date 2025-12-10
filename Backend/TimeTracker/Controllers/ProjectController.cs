using Core.Services.Projects;
using Data.Dtos.Project;
using Data.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
        public async Task<IActionResult> CreateProject([FromBody] CreateProjectRequest request)
        {
            try
            {
                var result = await _projectService.CreateProjectAsync(request);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error, errors = result.Errors });

                return CreatedAtAction(nameof(GetProjectById), new { id = result.Value!.Id }, result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating project");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProjectById(int id)
        {
            try
            {
                var result = await _projectService.GetProjectByIdAsync(id);

                if (!result.IsSuccess)
                    return NotFound(new { error = result.Error });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAllProjects([FromQuery] int? companyId = null)
        {
            try
            {
                var result = await _projectService.GetAllProjectsAsync(companyId);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting projects");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProject(int id, [FromBody] UpdateProjectRequest request)
        {
            try
            {
                var result = await _projectService.UpdateProjectAsync(id, request);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating project");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> ChangeStatus(int id, [FromBody] ProjectStatus newStatus)
        {
            try
            {
                var result = await _projectService.ChangeProjectStatusAsync(id, newStatus);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error });

                return Ok(new { message = "Project status updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing project status");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            try
            {
                var result = await _projectService.DeleteProjectAsync(id);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error });

                return Ok(new { message = "Project deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting project");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}
