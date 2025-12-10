using Core.Common;
using Core.Security;
using Core.Services.Tenant;
using Data.Dtos.Auth;
using Data.Dtos.Company;
using Data.Enums;
using Data.Interfaces;
using Data.Models;
using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Core.Services.Companies
{
    public class CompanyService : ICompanyService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IValidator<CreateCompanyRequest> _createValidator;
        private readonly IValidator<RegisterUserRequest> _registerValidator;
        private readonly IValidator<JoinCompanyRequest> _joinValidator;
        private readonly IValidator<UpdateCompanyRequest> _updateCompanyValidator;
        private readonly IValidator<UpdateUserInCompanyRequest> _updateUserInCompanyValidator;
        private readonly ITenantService _tenantService;
        private readonly IPasswordHasher _passwordHasher;

        public CompanyService(
            IUnitOfWork unitOfWork,
            IValidator<CreateCompanyRequest> createValidator,
            IValidator<RegisterUserRequest> registerValidator,
            IValidator<JoinCompanyRequest> joinValidator,
            IValidator<UpdateCompanyRequest> updateCompanyValidator,
            IValidator<UpdateUserInCompanyRequest> updateUserInCompanyValidator,
            ITenantService tenantService,
            IPasswordHasher passwordHasher)
        {
            _unitOfWork = unitOfWork;
            _createValidator = createValidator;
            _registerValidator = registerValidator;
            _joinValidator = joinValidator;
            _updateCompanyValidator = updateCompanyValidator;
            _updateUserInCompanyValidator = updateUserInCompanyValidator;
            _tenantService = tenantService;
            _passwordHasher = passwordHasher;
        }

        public async Task<Result<CompanyResponse>> CreateCompanyAsync(CreateCompanyRequest request)
        {
            var validationResult = await _createValidator.ValidateAsync(request);
            var userCompany = new UserCompany();

            if (!validationResult.IsValid)
            {
                return Result<CompanyResponse>.Failure(
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList()
                );
            }

            // Check if code already exists
            var existingCompany = await _unitOfWork.Companies.FindAsync(c => c.Code == request.Code);
            if (existingCompany != null)
            {
                return Result<CompanyResponse>.Failure("Company code already exists");
            }

            var company = request.Adapt<Company>();
            company.IsActive = true;

            await _unitOfWork.Companies.AddAsync(company);
            await _unitOfWork.SaveChangesAsync();

            userCompany.CompanyId = company.Id;
            userCompany.UserId = _tenantService.GetCurrentUserId() ?? 0;
            userCompany.Role = UserRole.Admin;

            await _unitOfWork.UserCompanies.AddAsync(userCompany);
            await _unitOfWork.SaveChangesAsync();

            return Result<CompanyResponse>.Success(company.Adapt<CompanyResponse>());
        }

        public async Task<Result<CompanyResponse>> GetCompanyByIdAsync(int id)
        {
            var company = await _unitOfWork.Companies.GetByIdAsync(id);
            if (company == null)
                return Result<CompanyResponse>.Failure("Company not found");

            return Result<CompanyResponse>.Success(company.Adapt<CompanyResponse>());
        }

        public async Task<Result<List<CompanyResponse>>> GetAllCompaniesAsync()
        {
            // Get current authenticated user
            var currentUserId = _tenantService.GetCurrentUserId();
            if (currentUserId == null)
            {
                return Result<List<CompanyResponse>>.Failure("User not authenticated");
            }

            // Get companies where user is a member
            var userCompanies = await _unitOfWork.UserCompanies
                .Query()
                .Where(uc => uc.UserId == currentUserId.Value)
                .Include(uc => uc.Company)
                .ToListAsync();

            var companies = userCompanies.Select(uc => uc.Company).ToList();

            return Result<List<CompanyResponse>>.Success(
                companies.Adapt<List<CompanyResponse>>()
            );
        }

        public async Task<Result<List<CompanyUserResponse>>> GetCompanyUsersAsync(int companyId)
        {
            // Verify company exists
            var company = await _unitOfWork.Companies.GetByIdAsync(companyId);
            if (company == null)
                return Result<List<CompanyUserResponse>>.Failure("Company not found");

            // Get all UserCompany relationships for this company with User included
            var userCompanies = await _unitOfWork.UserCompanies
                .Query()
                .Where(uc => uc.CompanyId == companyId)
                .Include(uc => uc.User)
                .ToListAsync();

            // Map to response DTOs
            var companyUsers = userCompanies.Select(uc => new CompanyUserResponse
            {
                UserId = uc.UserId,
                UserName = uc.User.Nombre,
                UserEmail = uc.User.Email,
                Role = uc.Role.ToString(),
                HourlyRate = uc.HourlyRate,
                JoinedAt = uc.CreatedAt
            }).ToList();

            return Result<List<CompanyUserResponse>>.Success(companyUsers);
        }

        public async Task<Result> AddUserToCompanyAsync(int companyId, AddUserToCompanyRequest request)
        {
            try
            {
                await _unitOfWork.BeginTransactionAsync();

                // Verify company exists
                var company = await _unitOfWork.Companies.GetByIdAsync(companyId);
                if (company == null)
                    return Result.Failure("Company not found");

                // Verify user exists
                var user = await _unitOfWork.Users.GetByIdAsync(request.UserId);
                if (user == null)
                    return Result.Failure("User not found");

                // Check if already member
                var existing = await _unitOfWork.UserCompanies.FindAsync(
                    uc => uc.UserId == request.UserId && uc.CompanyId == companyId
                );
                if (existing != null)
                    return Result.Failure("User already belongs to this company");

                var userCompany = new UserCompany
                {
                    UserId = request.UserId,
                    CompanyId = companyId,
                    Role = request.Role,
                    HourlyRate = request.HourlyRate
                };

                await _unitOfWork.UserCompanies.AddAsync(userCompany);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();

                return Result.Success();
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return Result.Failure($"Error adding user to company: {ex.Message}");
            }
        }

        public async Task<Result> RemoveUserFromCompanyAsync(int companyId, int userId)
        {
            var userCompany = await _unitOfWork.UserCompanies.FindAsync(
                uc => uc.UserId == userId && uc.CompanyId == companyId
            );

            if (userCompany == null)
                return Result.Failure("User is not a member of this company");

            _unitOfWork.UserCompanies.Delete(userCompany);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result<RegisterUserResponse>> RegisterUserAsync(RegisterUserRequest request)
        {
            try
            {
                // Validate request
                var validationResult = await _registerValidator.ValidateAsync(request);
                if (!validationResult.IsValid)
                {
                    return Result<RegisterUserResponse>.Failure(
                        validationResult.Errors.Select(e => e.ErrorMessage).ToList()
                    );
                }

                await _unitOfWork.BeginTransactionAsync();

                // Check if email already exists FIRST (before creating company)
                var existingUser = await _unitOfWork.Users.FindAsync(u => u.Email == request.Email);
                if (existingUser != null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result<RegisterUserResponse>.Failure("Email already registered");
                }

                // Detect CompanyId == 0 and create company automatically
                int companyIdToUse = request.CompanyId;
                Company? company = null;

                if (request.CompanyId == 0)
                {
                    // Generate unique code based on email
                    string emailPrefix = request.Email.Split('@')[0].ToUpper();
                    string uniqueCode = $"{emailPrefix}_{DateTime.UtcNow.Ticks.ToString().Substring(10)}";

                    // Create company automatically
                    company = new Company
                    {
                        Name = $"Empresa de {request.Name}",
                        Code = uniqueCode,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        IsDeleted = false
                    };

                    await _unitOfWork.Companies.AddAsync(company);
                    await _unitOfWork.SaveChangesAsync();

                    companyIdToUse = company.Id;
                }
                else
                {
                    // Verify company exists
                    company = await _unitOfWork.Companies.GetByIdAsync(request.CompanyId);
                    if (company == null)
                    {
                        await _unitOfWork.RollbackTransactionAsync();
                        return Result<RegisterUserResponse>.Failure("Company not found");
                    }
                }

                // Parse role
                if (!Enum.TryParse<UserRole>(request.Role, true, out var userRole))
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result<RegisterUserResponse>.Failure("Invalid role");
                }

                // If CompanyId original was 0, assign Admin role automatically
                if (request.CompanyId == 0)
                {
                    userRole = UserRole.Admin;
                }

                // Create user
                var user = new User
                {
                    Nombre = request.Name,
                    Email = request.Email,
                    Password = _passwordHasher.HashPassword(request.Password),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                await _unitOfWork.Users.AddAsync(user);
                await _unitOfWork.SaveChangesAsync();

                // Create UserCompany association
                var userCompany = new UserCompany
                {
                    UserId = user.Id,
                    CompanyId = companyIdToUse,
                    Role = userRole,
                    HourlyRate = request.HourlyRate,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                await _unitOfWork.UserCompanies.AddAsync(userCompany);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();

                // Build response
                var response = new RegisterUserResponse
                {
                    UserId = user.Id,
                    Name = user.Nombre,
                    Email = user.Email,
                    CompanyId = companyIdToUse,
                    CompanyName = company.Name,
                    Role = userRole.ToString(),
                    HourlyRate = request.HourlyRate
                };

                return Result<RegisterUserResponse>.Success(response);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return Result<RegisterUserResponse>.Failure($"Error registering user: {ex.Message}");
            }
        }

        public async Task<Result<JoinCompanyResponse>> JoinCompanyAsync(JoinCompanyRequest request)
        {
            try
            {
                // Validate request
                var validationResult = await _joinValidator.ValidateAsync(request);
                if (!validationResult.IsValid)
                {
                    return Result<JoinCompanyResponse>.Failure(
                        validationResult.Errors.Select(e => e.ErrorMessage).ToList()
                    );
                }

                // Get current authenticated user
                var currentUserId = _tenantService.GetCurrentUserId();
                if (currentUserId == null)
                {
                    return Result<JoinCompanyResponse>.Failure("User not authenticated");
                }

                await _unitOfWork.BeginTransactionAsync();

                // Verify company exists and is active
                var company = await _unitOfWork.Companies.GetByIdAsync(request.CompanyId);
                if (company == null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result<JoinCompanyResponse>.Failure("Company not found");
                }

                if (!company.IsActive)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result<JoinCompanyResponse>.Failure("Company is not active");
                }

                // Get user
                var user = await _unitOfWork.Users.GetByIdAsync(currentUserId.Value);
                if (user == null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result<JoinCompanyResponse>.Failure("User not found");
                }

                // Check if already member
                var existingMembership = await _unitOfWork.UserCompanies.FindAsync(
                    uc => uc.UserId == currentUserId.Value && uc.CompanyId == request.CompanyId
                );

                if (existingMembership != null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result<JoinCompanyResponse>.Failure("You are already a member of this company");
                }

                // Parse role
                if (!Enum.TryParse<UserRole>(request.Role, true, out var userRole))
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result<JoinCompanyResponse>.Failure("Invalid role");
                }

                // Create UserCompany association
                var userCompany = new UserCompany
                {
                    UserId = currentUserId.Value,
                    CompanyId = request.CompanyId,
                    Role = userRole,
                    HourlyRate = request.HourlyRate,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                await _unitOfWork.UserCompanies.AddAsync(userCompany);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();

                // Build response
                var response = new JoinCompanyResponse
                {
                    UserId = user.Id,
                    UserName = user.Nombre,
                    UserEmail = user.Email,
                    CompanyId = company.Id,
                    CompanyName = company.Name,
                    CompanyCode = company.Code,
                    Role = userRole.ToString(),
                    HourlyRate = request.HourlyRate,
                    Message = $"Successfully joined {company.Name}"
                };

                return Result<JoinCompanyResponse>.Success(response);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return Result<JoinCompanyResponse>.Failure($"Error joining company: {ex.Message}");
            }
        }

        public async Task<Result<CompanyResponse>> UpdateCompanyAsync(int id, UpdateCompanyRequest request)
        {
            try
            {
                // Validate request
                var validationResult = await _updateCompanyValidator.ValidateAsync(request);
                if (!validationResult.IsValid)
                {
                    return Result<CompanyResponse>.Failure(
                        validationResult.Errors.Select(e => e.ErrorMessage).ToList()
                    );
                }

                await _unitOfWork.BeginTransactionAsync();

                // Get company
                var company = await _unitOfWork.Companies.GetByIdAsync(id);
                if (company == null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result<CompanyResponse>.Failure("Company not found");
                }

                // Verify current user is Admin in this company
                var currentUserId = _tenantService.GetCurrentUserId();
                if (currentUserId == null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result<CompanyResponse>.Failure("User not authenticated");
                }

                var userCompany = await _unitOfWork.UserCompanies.FindAsync(
                    uc => uc.UserId == currentUserId.Value && uc.CompanyId == id
                );

                if (userCompany == null || userCompany.Role != UserRole.Admin)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result<CompanyResponse>.Failure("Only Admins can update companies");
                }

                // Check if new code is unique (if changed)
                if (company.Code != request.Code)
                {
                    var existingCompany = await _unitOfWork.Companies.FindAsync(c => c.Code == request.Code);
                    if (existingCompany != null)
                    {
                        await _unitOfWork.RollbackTransactionAsync();
                        return Result<CompanyResponse>.Failure("Company code already exists");
                    }
                }

                // Update company
                company.Name = request.Name;
                company.Code = request.Code;
                company.IsActive = request.IsActive;
                company.UpdatedAt = DateTime.UtcNow;

                _unitOfWork.Companies.Update(company);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();

                return Result<CompanyResponse>.Success(company.Adapt<CompanyResponse>());
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return Result<CompanyResponse>.Failure($"Error updating company: {ex.Message}");
            }
        }

        public async Task<Result> DeleteCompanyAsync(int id)
        {
            try
            {
                await _unitOfWork.BeginTransactionAsync();

                // Get company
                var company = await _unitOfWork.Companies.GetByIdAsync(id);
                if (company == null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result.Failure("Company not found");
                }

                // Verify current user is Admin
                var currentUserId = _tenantService.GetCurrentUserId();
                if (currentUserId == null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result.Failure("User not authenticated");
                }

                var userCompany = await _unitOfWork.UserCompanies.FindAsync(
                    uc => uc.UserId == currentUserId.Value && uc.CompanyId == id
                );

                if (userCompany == null || userCompany.Role != UserRole.Admin)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result.Failure("Only Admins can delete companies");
                }

                // Validate no active projects
                var activeProjects = await _unitOfWork.Projects
                    .Query()
                    .Where(p => p.CompanyId == id && !p.IsDeleted)
                    .ToListAsync();

                if (activeProjects.Any())
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result.Failure($"Cannot delete company with {activeProjects.Count} project(s). Please delete or archive projects first.");
                }

                // Validate no recent time entries (last 30 days)
                var recentDate = DateTime.UtcNow.AddDays(-30);
                var recentTimeEntries = await _unitOfWork.TimeEntries
                    .Query()
                    .Where(te => te.CompanyId == id && te.CreatedAt >= recentDate && !te.IsDeleted)
                    .ToListAsync();

                if (recentTimeEntries.Any())
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result.Failure($"Cannot delete company with {recentTimeEntries.Count} time entries from the last 30 days");
                }

                // Soft delete
                company.IsDeleted = true;
                company.UpdatedAt = DateTime.UtcNow;

                _unitOfWork.Companies.Update(company);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();

                return Result.Success();
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return Result.Failure($"Error deleting company: {ex.Message}");
            }
        }

        public async Task<Result> UpdateUserInCompanyAsync(int companyId, int userId, UpdateUserInCompanyRequest request)
        {
            try
            {
                // Validate request
                var validationResult = await _updateUserInCompanyValidator.ValidateAsync(request);
                if (!validationResult.IsValid)
                {
                    return Result.Failure(
                        validationResult.Errors.Select(e => e.ErrorMessage).ToList()
                    );
                }

                await _unitOfWork.BeginTransactionAsync();

                // Verify current user is Admin
                var currentUserId = _tenantService.GetCurrentUserId();
                if (currentUserId == null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result.Failure("User not authenticated");
                }

                var currentUserCompany = await _unitOfWork.UserCompanies.FindAsync(
                    uc => uc.UserId == currentUserId.Value && uc.CompanyId == companyId
                );

                if (currentUserCompany == null || currentUserCompany.Role != UserRole.Admin)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result.Failure("Only Admins can update user roles");
                }

                // Get target user company relationship
                var userCompany = await _unitOfWork.UserCompanies.FindAsync(
                    uc => uc.UserId == userId && uc.CompanyId == companyId
                );

                if (userCompany == null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result.Failure("User is not a member of this company");
                }

                // Update user company
                userCompany.Role = request.Role;
                userCompany.HourlyRate = request.HourlyRate;
                userCompany.UpdatedAt = DateTime.UtcNow;

                _unitOfWork.UserCompanies.Update(userCompany);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();

                return Result.Success();
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return Result.Failure($"Error updating user in company: {ex.Message}");
            }
        }

    }
}
