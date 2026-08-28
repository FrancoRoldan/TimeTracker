using Core.Services;
using Data.Dtos.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimeTracker.Extensions;

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
            var userProfile = await _userService.GetUserProfileAsync(id);

            if (userProfile == null)
                return NotFound(new { error = "Usuario no encontrado" });

            return Ok(userProfile);
        }

        [HttpPut("update")]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequest request)
        {
            var result = await _userService.UpdateUserAsync(request);

            if (!result.success)
                return BadRequest(new { error = result.message });

            return Ok(new { message = result.message, user = result.user });
        }

        [HttpPut("update-password")]
        public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordRequest request)
        {
            var result = await _userService.UpdatePasswordAsync(request);

            if (!result.success)
                return BadRequest(new { error = result.message });

            return Ok(new { message = result.message });
        }

        [HttpPut("reset-password")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var result = await _userService.ResetPasswordAsync(request);

            if (!result.success)
                return BadRequest(new { error = result.message });

            return Ok(new { message = result.message });
        }
    }
}
