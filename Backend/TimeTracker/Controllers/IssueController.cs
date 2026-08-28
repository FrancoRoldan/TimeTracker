using Core.Services.Issues;
using Data.Dtos.Issue;
using Data.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimeTracker.Extensions;

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
            var result = await _issueService.CreateIssueAsync(request);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return CreatedAtAction(nameof(GetIssueById), new { id = result.Value!.Id }, result.Value);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetIssueById(int id)
        {
            var result = await _issueService.GetIssueByIdAsync(id);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetIssuesByProject(int projectId)
        {
            var result = await _issueService.GetIssuesByProjectAsync(projectId);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpGet("assigned-to-me")]
        public async Task<IActionResult> GetAssignedIssues([FromQuery] int? companyId = null)
        {
            var result = await _issueService.GetAssignedIssuesAsync(companyId);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpGet("project/{projectId}/assigned-to-me")]
        public async Task<IActionResult> GetProjectAssignedIssues(int projectId)
        {
            var result = await _issueService.GetProjectAssignedIssuesAsync(projectId);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpGet("my-companies")]
        public async Task<IActionResult> GetUserIssuesWithFilters(
            [FromQuery] int? companyId = null,
            [FromQuery] IssueStatus? status = null,
            [FromQuery] IssueType? type = null,
            [FromQuery] IssuePriority? priority = null)
        {
            var result = await _issueService.GetUserIssuesWithFiltersAsync(companyId,status, type, priority);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager,Developer")]
        public async Task<IActionResult> UpdateIssue(int id, [FromBody] UpdateIssueRequest request)
        {
            var result = await _issueService.UpdateIssueAsync(id, request);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpPut("{id}/assign")]
        [Authorize(Roles = "Admin,Manager,Developer")]
        public async Task<IActionResult> AssignIssue(int id, [FromBody] int userId)
        {
            var result = await _issueService.AssignIssueAsync(id, userId);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,Manager,Developer")]
        public async Task<IActionResult> ChangeStatus(int id, [FromBody] IssueStatus newStatus)
        {
            var result = await _issueService.ChangeIssueStatusAsync(id, newStatus);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager,Developer")]
        public async Task<IActionResult> DeleteIssue(int id)
        {
            var result = await _issueService.DeleteIssueAsync(id);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(new { message = "Issue deleted successfully" });
        }
    }
}
