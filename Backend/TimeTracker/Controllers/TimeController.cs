using Core.Services.TimeTracking;
using Data.Dtos.TimeEntry;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
        public async Task<IActionResult> StartTimer([FromBody] StartTimerRequest request)
        {
            try
            {
                var result = await _timeTrackingService.StartTimerAsync(request);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error, errors = result.Errors });

                return StatusCode(201, result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting timer");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPost("stop")]
        public async Task<IActionResult> StopTimer()
        {
            try
            {
                var result = await _timeTrackingService.StopTimerAsync();

                if (!result.IsSuccess)
                    return result.Error == "No active timer found"
                        ? NotFound(new { error = result.Error })
                        : BadRequest(new { error = result.Error });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping timer");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveTimer()
        {
            try
            {
                var result = await _timeTrackingService.GetActiveTimerAsync();

                if (!result.IsSuccess)
                    return NotFound(new { error = result.Error });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active timer");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPost("manual")]
        public async Task<IActionResult> AddManualEntry([FromBody] AddManualEntryRequest request)
        {
            try
            {
                var result = await _timeTrackingService.AddManualEntryAsync(request);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error, errors = result.Errors });

                return StatusCode(201, result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding manual entry");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("entries")]
        public async Task<IActionResult> GetMyEntries(
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            [FromQuery] int? projectId,
            [FromQuery] int? issueId)
        {
            try
            {
                var result = await _timeTrackingService.GetUserEntriesAsync(dateFrom, dateTo, projectId, issueId);

                if (!result.IsSuccess)
                    return BadRequest(new { error = result.Error });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting entries");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("entries/{id}")]
        public async Task<IActionResult> GetEntryById(int id)
        {
            try
            {
                var result = await _timeTrackingService.GetEntryByIdAsync(id);

                if (!result.IsSuccess)
                    return result.Error!.Contains("access") ? Forbid() : NotFound(new { error = result.Error });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting entry");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPut("entries/{id}")]
        public async Task<IActionResult> UpdateEntry(int id, [FromBody] UpdateTimeEntryRequest request)
        {
            try
            {
                var result = await _timeTrackingService.UpdateEntryAsync(id, request);

                if (!result.IsSuccess)
                    return result.Error!.Contains("access") ? Forbid() : BadRequest(new { error = result.Error });

                return Ok(result.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating entry");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpDelete("entries/{id}")]
        public async Task<IActionResult> DeleteEntry(int id)
        {
            try
            {
                var result = await _timeTrackingService.DeleteEntryAsync(id);

                if (!result.IsSuccess)
                    return result.Error!.Contains("access") ? Forbid() : NotFound(new { error = result.Error });

                return Ok(new { message = "Time entry deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting entry");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}
