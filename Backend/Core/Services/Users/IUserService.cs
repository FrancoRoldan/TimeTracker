using Data.Dtos.User;
using Data.Models;

namespace Core.Services
{
    public interface IUserService
    {
        Task<(User? user, List<UserCompany> companies)> AuthenticateAsync(string email, string password);
        Task<List<UserCompany>> GetUserCompaniesAsync(int userId);
        Task<UserProfileResponse?> GetUserProfileAsync(int userId);
        Task<(bool success, string message, UserProfileResponse? user)> UpdateUserAsync(UpdateUserRequest request);
        Task<(bool success, string message)> UpdatePasswordAsync(UpdatePasswordRequest request);
        Task<(bool success, string message)> ResetPasswordAsync(ResetPasswordRequest request);
    }
}
