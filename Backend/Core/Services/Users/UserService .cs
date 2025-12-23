using Core.Security;
using Data.Dtos;
using Data.Dtos.User;
using Data.Interfaces;
using Data.Models;
using Mapster;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Core.Services
{
    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordHasher _passwordHasher;

        public UserService(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
        {
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
        }

        public async Task<(User? user, List<UserCompany> companies)> AuthenticateAsync(string email, string password)
        {
            var user = await _unitOfWork.Users.FindAsync(u => u.Email == email);

            if (user == null || !_passwordHasher.VerifyPassword(password, user.Password))
            {
                return (null, new List<UserCompany>());
            }

            // Get user's companies
            var companies = await _unitOfWork.UserCompanies
                .Query()
                .Include(uc => uc.Company)
                .Where(uc => uc.UserId == user.Id)
                .ToListAsync();

            return (user, companies);
        }

        public async Task<List<UserCompany>> GetUserCompaniesAsync(int userId)
        {
            // Get user's companies with company details
            var companies = await _unitOfWork.UserCompanies
                .Query()
                .Include(uc => uc.Company)
                .Where(uc => uc.UserId == userId)
                .ToListAsync();

            return companies;
        }

        public async Task<UserProfileResponse?> GetUserProfileAsync(int userId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);

            if (user == null || user.IsDeleted)
            {
                return null;
            }

            return new UserProfileResponse
            {
                Id = user.Id,
                Nombre = user.Nombre,
                Email = user.Email,
                FechaCreacion = user.CreatedAt,
                FechaActualizacion = user.UpdatedAt,
                UsuarioCreacion = user.CreatedBy,
                UsuarioActualizacion = user.UpdatedBy
            };
        }

        public async Task<(bool success, string message, UserProfileResponse? user)> UpdateUserAsync(UpdateUserRequest request)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(request.Id);

            if (user == null || user.IsDeleted)
            {
                return (false, "Usuario no encontrado", null);
            }

            // Check if email is already in use by another user
            var existingUser = await _unitOfWork.Users.FindAsync(u => u.Email == request.Email && u.Id != request.Id);
            if (existingUser != null)
            {
                return (false, "El email ya está en uso por otro usuario", null);
            }

            user.Nombre = request.Nombre;
            user.Email = request.Email;
            user.UpdatedBy = request.UsuarioActualizacion;
            user.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            var userProfile = new UserProfileResponse
            {
                Id = user.Id,
                Nombre = user.Nombre,
                Email = user.Email,
                FechaCreacion = user.CreatedAt,
                FechaActualizacion = user.UpdatedAt,
                UsuarioCreacion = user.CreatedBy,
                UsuarioActualizacion = user.UpdatedBy
            };

            return (true, "Usuario actualizado exitosamente", userProfile);
        }

        public async Task<(bool success, string message)> UpdatePasswordAsync(UpdatePasswordRequest request)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(request.UserId);

            if (user == null || user.IsDeleted)
            {
                return (false, "Usuario no encontrado");
            }

            // Verify current password
            if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.Password))
            {
                return (false, "La contraseña actual es incorrecta");
            }

            // Hash new password
            user.Password = _passwordHasher.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return (true, "Contraseña actualizada exitosamente");
        }

        public async Task<(bool success, string message)> ResetPasswordAsync(ResetPasswordRequest request)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(request.UserId);

            if (user == null || user.IsDeleted)
            {
                return (false, "Usuario no encontrado");
            }

            // Hash new password (no need to verify old password for admin reset)
            user.Password = _passwordHasher.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return (true, "Contraseña restablecida exitosamente");
        }

        // RegisterAsync and GetAllAsync removed - users are created via admin/seeder only
    }
}
