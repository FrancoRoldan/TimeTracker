using Data.Enums;
using Data.Models;

namespace TimeTracker.Tests.Helpers;

public static class TestDataBuilder
{
    public static User CreateUser(int id = 1, string email = "test@example.com", string nombre = "Test User")
    {
        return new User
        {
            Id = id,
            Email = email,
            Nombre = nombre,
            Password = "hashed_password",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
    }

    public static Company CreateCompany(int id = 1, string name = "Test Company", string code = "TC01")
    {
        return new Company
        {
            Id = id,
            Name = name,
            Code = code,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
    }

    public static UserCompany CreateUserCompany(int userId = 1, int companyId = 1, UserRole role = UserRole.Developer)
    {
        return new UserCompany
        {
            Id = 0,
            UserId = userId,
            CompanyId = companyId,
            Role = role,
            HourlyRate = 50m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
    }

    public static Project CreateProject(int id = 1, int companyId = 1, string name = "Test Project")
    {
        return new Project
        {
            Id = id,
            Name = name,
            CompanyId = companyId,
            Status = ProjectStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
    }

    public static Issue CreateIssue(int id = 1, int projectId = 1, int? assignedUserId = 1, int companyId = 1)
    {
        var project = CreateProject(projectId, companyId);
        return new Issue
        {
            Id = id,
            ProjectId = projectId,
            Project = project,
            Title = $"Issue {id}",
            AssignedUserId = assignedUserId,
            Type = IssueType.Task,
            Status = IssueStatus.InProgress,
            Priority = IssuePriority.Medium,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
    }

    public static TimeEntry CreateTimeEntry(
        int id = 1,
        int userId = 1,
        int companyId = 1,
        DateTime? startTime = null,
        DateTime? endTime = null,
        int? issueId = null,
        int? projectId = null)
    {
        return new TimeEntry
        {
            Id = id,
            UserId = userId,
            CompanyId = companyId,
            StartTime = startTime ?? DateTime.UtcNow.AddHours(-1),
            EndTime = endTime,
            IssueId = issueId,
            ProjectId = projectId ?? 1,
            Description = $"Entry {id}",
            User = CreateUser(userId),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
    }
}
