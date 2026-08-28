using Core.Services.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimeTracker.Extensions;

namespace TimeTracker.Controllers
{
    [Route("api/reports")]
    [ApiController]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IReportingService _reportingService;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(IReportingService reportingService, ILogger<ReportsController> logger)
        {
            _reportingService = reportingService;
            _logger = logger;
        }

        [HttpGet("user")]
        public async Task<IActionResult> GetMyReport(
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            [FromQuery] int? projectId,
            [FromQuery] int? issueId)
        {
            var result = await _reportingService.GetUserReportAsync(null, dateFrom, dateTo, projectId, issueId);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpGet("user/{userId}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetUserReport(
            int userId,
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            [FromQuery] int? projectId,
            [FromQuery] int? issueId)
        {
            var result = await _reportingService.GetUserReportAsync(userId, dateFrom, dateTo, projectId, issueId);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetProjectReport(
            int projectId,
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            [FromQuery] int? issueId)
        {
            var result = await _reportingService.GetProjectReportAsync(projectId, dateFrom, dateTo, issueId);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpGet("company/{companyId}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetCompanyReport(
            int companyId,
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            [FromQuery] int? projectId,
            [FromQuery] int? issueId)
        {
            var result = await _reportingService.GetCompanyReportAsync(companyId, dateFrom, dateTo, projectId, issueId);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }
    }
}
