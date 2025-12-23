using Core.Services;
using Data.Dtos.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TimeTracker.Controllers
{
    [Route("api/users")]
    [ApiController]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UserController> _logger;

        public UserController(IUserService userService, ILogger<UserController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        [HttpGet("profile/{id}")]
        public async Task<IActionResult> GetUserProfile(int id)
        {
            try
            {
                var userProfile = await _userService.GetUserProfileAsync(id);

                if (userProfile == null)
                    return NotFound(new { error = "Usuario no encontrado" });

                return Ok(userProfile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user profile");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPut("update")]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequest request)
        {
            try
            {
                var result = await _userService.UpdateUserAsync(request);

                if (!result.success)
                    return BadRequest(new { error = result.message });

                return Ok(new { message = result.message, user = result.user });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPut("update-password")]
        public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordRequest request)
        {
            try
            {
                var result = await _userService.UpdatePasswordAsync(request);

                if (!result.success)
                    return BadRequest(new { error = result.message });

                return Ok(new { message = result.message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating password");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpPut("reset-password")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try
            {
                var result = await _userService.ResetPasswordAsync(request);

                if (!result.success)
                    return BadRequest(new { error = result.message });

                return Ok(new { message = result.message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting password");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}
