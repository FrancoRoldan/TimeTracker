using Core.Services.TimeTracking;
using Data.Dtos.TimeEntry;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimeTracker.Extensions;

namespace TimeTracker.Controllers
{
    [Route("api/time")]
    [ApiController]
    [Authorize]
    public class TimeController : ControllerBase
    {
        private readonly ITimeTrackingService _timeTrackingService;
        private readonly ILogger<TimeController> _logger;

        public TimeController(ITimeTrackingService timeTrackingService, ILogger<TimeController> logger)
        {
            _timeTrackingService = timeTrackingService;
            _logger = logger;
        }

        [HttpPost("start")]
        [Authorize(Roles = "Admin,Manager,Developer")]
        public async Task<IActionResult> StartTimer([FromBody] StartTimerRequest request)
        {
            var result = await _timeTrackingService.StartTimerAsync(request);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return StatusCode(201, result.Value);
        }

        [HttpPost("stop")]
        [Authorize(Roles = "Admin,Manager,Developer")]
        public async Task<IActionResult> StopTimer()
        {
            var result = await _timeTrackingService.StopTimerAsync();

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveTimer()
        {
            var result = await _timeTrackingService.GetActiveTimerAsync();

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpPost("manual")]
        [Authorize(Roles = "Admin,Manager,Developer")]
        public async Task<IActionResult> AddManualEntry([FromBody] AddManualEntryRequest request)
        {
            var result = await _timeTrackingService.AddManualEntryAsync(request);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return StatusCode(201, result.Value);
        }

        [HttpGet("entries")]
        public async Task<IActionResult> GetMyEntries(
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            [FromQuery] int? projectId,
            [FromQuery] int? issueId)
        {
            var result = await _timeTrackingService.GetUserEntriesAsync(dateFrom, dateTo, projectId, issueId);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpGet("entries/paginated")]
        public async Task<IActionResult> GetMyEntriesPaginated(
            [FromQuery] int pageNumber = 0,
            [FromQuery] int pageSize = 10,
            [FromQuery] DateTime? dateFrom = null,
            [FromQuery] DateTime? dateTo = null,
            [FromQuery] int? projectId = null,
            [FromQuery] int? issueId = null,
            [FromQuery] string? searchTerm = null)
        {
            var result = await _timeTrackingService.GetUserEntriesPaginatedAsync(
                pageNumber, pageSize, dateFrom, dateTo, projectId, issueId, searchTerm);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpGet("entries/{id}")]
        public async Task<IActionResult> GetEntryById(int id)
        {
            var result = await _timeTrackingService.GetEntryByIdAsync(id);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpPut("entries/{id}")]
        [Authorize(Roles = "Admin,Manager,Developer")]
        public async Task<IActionResult> UpdateEntry(int id, [FromBody] UpdateTimeEntryRequest request)
        {
            var result = await _timeTrackingService.UpdateEntryAsync(id, request);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(result.Value);
        }

        [HttpDelete("entries/{id}")]
        [Authorize(Roles = "Admin,Manager,Developer")]
        public async Task<IActionResult> DeleteEntry(int id)
        {
            var result = await _timeTrackingService.DeleteEntryAsync(id);

            if (!result.IsSuccess)
                return this.ToErrorResponse(result);

            return Ok(new { message = "Time entry deleted successfully" });
        }
    }
}
