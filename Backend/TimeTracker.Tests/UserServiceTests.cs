using Core.Security;
using Core.Services;
using Data.Dtos.User;
using Data.Interfaces;
using Data.Models;
using FluentAssertions;
using MockQueryable.Moq;
using Moq;
using System.Linq.Expressions;
using TimeTracker.Tests.Helpers;
using Xunit;

namespace TimeTracker.Tests;

public class UserServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWork;
    private readonly Mock<IPasswordHasher> _passwordHasher;
    private readonly Mock<IUserRepository> _usersRepo;
    private readonly Mock<IRepository<UserCompany>> _userCompaniesRepo;
    private readonly UserService _service;

    public UserServiceTests()
    {
        _unitOfWork = new Mock<IUnitOfWork>();
        _passwordHasher = new Mock<IPasswordHasher>();
        _usersRepo = new Mock<IUserRepository>();
        _userCompaniesRepo = new Mock<IRepository<UserCompany>>();

        _unitOfWork.Setup(u => u.Users).Returns(_usersRepo.Object);
        _unitOfWork.Setup(u => u.UserCompanies).Returns(_userCompaniesRepo.Object);

        _service = new UserService(_unitOfWork.Object, _passwordHasher.Object);
    }

    // ── AuthenticateAsync ─────────────────────────────────────────────

    [Fact]
    public async Task Authenticate_ValidCredentials_ReturnsUserAndCompanies()
    {
        var user = TestDataBuilder.CreateUser(1, "test@example.com");
        var company = TestDataBuilder.CreateCompany(1, "ACME");
        var uc = TestDataBuilder.CreateUserCompany(1, 1);
        uc.Company = company;

        _usersRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync(user);
        _passwordHasher.Setup(p => p.VerifyPassword("password", user.Password))
            .Returns(true);

        var ucList = new List<UserCompany> { uc };
        _userCompaniesRepo.Setup(r => r.Query())
            .Returns(ucList.AsQueryable().BuildMock());

        var (resultUser, companies) = await _service.AuthenticateAsync("test@example.com", "password");

        resultUser.Should().NotBeNull();
        resultUser!.Id.Should().Be(1);
        companies.Should().HaveCount(1);
    }

    [Fact]
    public async Task Authenticate_InvalidEmail_ReturnsNull()
    {
        _usersRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync((User?)null);

        var (user, companies) = await _service.AuthenticateAsync("wrong@example.com", "password");

        user.Should().BeNull();
        companies.Should().BeEmpty();
    }

    [Fact]
    public async Task Authenticate_WrongPassword_ReturnsNull()
    {
        var user = TestDataBuilder.CreateUser(1, "test@example.com");

        _usersRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync(user);
        _passwordHasher.Setup(p => p.VerifyPassword("wrong", user.Password))
            .Returns(false);

        var (resultUser, companies) = await _service.AuthenticateAsync("test@example.com", "wrong");

        resultUser.Should().BeNull();
        companies.Should().BeEmpty();
    }

    // ── GetUserProfileAsync ───────────────────────────────────────────

    [Fact]
    public async Task GetProfile_ValidUser_ReturnsProfile()
    {
        var user = TestDataBuilder.CreateUser(1, "test@example.com", "John");

        _usersRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(user);

        var result = await _service.GetUserProfileAsync(1);

        result.Should().NotBeNull();
        result!.Id.Should().Be(1);
        result.Nombre.Should().Be("John");
        result.Email.Should().Be("test@example.com");
    }

    [Fact]
    public async Task GetProfile_DeletedUser_ReturnsNull()
    {
        var user = TestDataBuilder.CreateUser(1);
        user.IsDeleted = true;

        _usersRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(user);

        var result = await _service.GetUserProfileAsync(1);

        result.Should().BeNull();
    }

    // ── UpdateUserAsync ───────────────────────────────────────────────

    [Fact]
    public async Task UpdateUser_ValidData_Succeeds()
    {
        var user = TestDataBuilder.CreateUser(1, "old@example.com", "Old Name");
        var request = new UpdateUserRequest
        {
            Id = 1,
            Nombre = "New Name",
            Email = "new@example.com",
            UsuarioActualizacion = "admin"
        };

        _usersRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(user);
        _usersRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync((User?)null);

        var (success, message, profile) = await _service.UpdateUserAsync(request);

        success.Should().BeTrue();
        profile.Should().NotBeNull();
        profile!.Nombre.Should().Be("New Name");
        profile.Email.Should().Be("new@example.com");
        _unitOfWork.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task UpdateUser_DuplicateEmail_Fails()
    {
        var user = TestDataBuilder.CreateUser(1, "old@example.com");
        var otherUser = TestDataBuilder.CreateUser(2, "taken@example.com");
        var request = new UpdateUserRequest
        {
            Id = 1,
            Nombre = "Name",
            Email = "taken@example.com",
            UsuarioActualizacion = "admin"
        };

        _usersRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(user);
        _usersRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync(otherUser);

        var (success, message, _) = await _service.UpdateUserAsync(request);

        success.Should().BeFalse();
        message.Should().Contain("email ya está en uso");
    }

    [Fact]
    public async Task UpdateUser_DeletedUser_Fails()
    {
        var user = TestDataBuilder.CreateUser(1);
        user.IsDeleted = true;
        var request = new UpdateUserRequest { Id = 1, Nombre = "X", Email = "x@x.com" };

        _usersRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(user);

        var (success, message, _) = await _service.UpdateUserAsync(request);

        success.Should().BeFalse();
        message.Should().Contain("no encontrado");
    }

    // ── UpdatePasswordAsync ───────────────────────────────────────────

    [Fact]
    public async Task UpdatePassword_CorrectCurrent_Succeeds()
    {
        var user = TestDataBuilder.CreateUser(1);
        var request = new UpdatePasswordRequest
        {
            UserId = 1,
            CurrentPassword = "current",
            NewPassword = "newpass"
        };

        _usersRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(user);
        _passwordHasher.Setup(p => p.VerifyPassword("current", user.Password)).Returns(true);
        _passwordHasher.Setup(p => p.HashPassword("newpass")).Returns("new_hash");

        var (success, message) = await _service.UpdatePasswordAsync(request);

        success.Should().BeTrue();
        _passwordHasher.Verify(p => p.HashPassword("newpass"), Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task UpdatePassword_WrongCurrent_Fails()
    {
        var user = TestDataBuilder.CreateUser(1);
        var request = new UpdatePasswordRequest
        {
            UserId = 1,
            CurrentPassword = "wrong",
            NewPassword = "newpass"
        };

        _usersRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(user);
        _passwordHasher.Setup(p => p.VerifyPassword("wrong", user.Password)).Returns(false);

        var (success, message) = await _service.UpdatePasswordAsync(request);

        success.Should().BeFalse();
        message.Should().Contain("contraseña actual es incorrecta");
    }

    // ── ResetPasswordAsync ────────────────────────────────────────────

    [Fact]
    public async Task ResetPassword_ValidUser_Succeeds()
    {
        var user = TestDataBuilder.CreateUser(1);
        var request = new ResetPasswordRequest { UserId = 1, NewPassword = "reset123" };

        _usersRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(user);
        _passwordHasher.Setup(p => p.HashPassword("reset123")).Returns("reset_hash");

        var (success, message) = await _service.ResetPasswordAsync(request);

        success.Should().BeTrue();
        _passwordHasher.Verify(p => p.HashPassword("reset123"), Times.Once);
        _passwordHasher.Verify(p => p.VerifyPassword(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task ResetPassword_DeletedUser_Fails()
    {
        var user = TestDataBuilder.CreateUser(1);
        user.IsDeleted = true;
        var request = new ResetPasswordRequest { UserId = 1, NewPassword = "reset123" };

        _usersRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(user);

        var (success, message) = await _service.ResetPasswordAsync(request);

        success.Should().BeFalse();
        message.Should().Contain("no encontrado");
    }
}
