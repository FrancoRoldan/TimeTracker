using Core.Services.Issues;
using Data.Dtos.Issue;
using Data.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TimeTracker.Controllers
{
    [Route("api/issue")]
    [ApiController]
    [Authorize]
    public class IssueController : ControllerBase
    {
        private readonly IIssueService _issueService;
        private readonly ILogger<IssueController> _logger;

        public IssueController(IIssueService issueService, ILogger<IssueController> logger)
        {
            _issueService = issueService;
            _logger = logger;
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager,Developer")]
        public async Task<IActionResult> CreateIssue([FromBody] CreateIssueRequest request)
        {
            try
            {
                var result = await _issueService.CreateIssueAsync(request);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error, errors = result.Errors });

                return CreatedAtAction(nameof(GetIssueById), new { id = result.Value!.Id }, result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating issue");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetIssueById(int id)
        {
            try
            {
                var result = await _issueService.GetIssueByIdAsync(id);

                if (!result.IsSuccess)
                    return NotFound(new { error = result.Error });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting issue");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetIssuesByProject(int projectId)
        {
            try
            {
                var result = await _issueService.GetIssuesByProjectAsync(projectId);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting issues");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("assigned-to-me")]
        public async Task<IActionResult> GetAssignedIssues([FromQuery] int? companyId = null)
        {
            try
            {
                var result = await _issueService.GetAssignedIssuesAsync(companyId);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting assigned issues");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("my-companies")]
        public async Task<IActionResult> GetUserIssuesWithFilters(
            [FromQuery] int? companyId = null,
            [FromQuery] IssueStatus? status = null,
            [FromQuery] IssueType? type = null,
            [FromQuery] IssuePriority? priority = null)
        {
            try
            {
                var result = await _issueService.GetUserIssuesWithFiltersAsync(companyId,status, type, priority);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user issues with filters");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager,Developer")]
        public async Task<IActionResult> UpdateIssue(int id, [FromBody] UpdateIssueRequest request)
        {
            try
            {
                var result = await _issueService.UpdateIssueAsync(id, request);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating issue");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPut("{id}/assign")]
        [Authorize(Roles = "Admin,Manager,Developer")]
        public async Task<IActionResult> AssignIssue(int id, [FromBody] int userId)
        {
            try
            {
                var result = await _issueService.AssignIssueAsync(id, userId);

                if (!result.IsSuccess)
                    return result.Error!.Contains("not belong") ? Forbid() : BadRequest(new { error = result.Error });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning issue");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,Manager,Developer")]
        public async Task<IActionResult> ChangeStatus(int id, [FromBody] IssueStatus newStatus)
        {
            try
            {
                var result = await _issueService.ChangeIssueStatusAsync(id, newStatus);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing issue status");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager,Developer")]
        public async Task<IActionResult> DeleteIssue(int id)
        {
            try
            {
                var result = await _issueService.DeleteIssueAsync(id);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error });

                return Ok(new { message = "Issue deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting issue");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}
