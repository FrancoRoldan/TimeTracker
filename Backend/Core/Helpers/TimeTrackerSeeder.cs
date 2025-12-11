using Core.Security;
using Data.Context;
using Data.Enums;
using Data.Models;

namespace Core.Helpers
{
    public static class TimeTrackerSeeder
    {
        public static void Seed(AppDbContext context, IPasswordHasher passwordHasher)
        {
            // Skip if data already exists
            if (context.Companies.Any())
            {
                Console.WriteLine("Database already seeded. Skipping...");
                return;
            }

            Console.WriteLine("Starting database seeding...");

            // Create Companies
            var acmeCompany = new Company
            {
                Name = "ACME Corporation",
                Code = "ACME",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "system",
                UpdatedBy = "system",
                IsDeleted = false
            };

            var techStartCompany = new Company
            {
                Name = "TechStart Solutions",
                Code = "TECHSTART",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "system",
                UpdatedBy = "system",
                IsDeleted = false
            };

            context.Companies.AddRange(acmeCompany, techStartCompany);
            context.SaveChanges();

            Console.WriteLine("Companies created: ACME, TechStart");

            // Create Users
            var acmeAdmin = new User
            {
                Nombre = "John Admin",
                Email = "john@acme.com",
                Password = passwordHasher.HashPassword("Admin123!"),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "system",
                UpdatedBy = "system",
                IsDeleted = false
            };

            var acmeDev = new User
            {
                Nombre = "Alice Developer",
                Email = "alice@acme.com",
                Password = passwordHasher.HashPassword("Dev123!"),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "system",
                UpdatedBy = "system",
                IsDeleted = false
            };

            var techStartAdmin = new User
            {
                Nombre = "Bob Manager",
                Email = "bob@techstart.com",
                Password = passwordHasher.HashPassword("Manager123!"),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "system",
                UpdatedBy = "system",
                IsDeleted = false
            };

            var techStartDev = new User
            {
                Nombre = "Carol Developer",
                Email = "carol@techstart.com",
                Password = passwordHasher.HashPassword("Dev123!"),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "system",
                UpdatedBy = "system",
                IsDeleted = false
            };

            context.Users.AddRange(acmeAdmin, acmeDev, techStartAdmin, techStartDev);
            context.SaveChanges();

            Console.WriteLine("Users created: 4 users (2 per company)");

            // Create UserCompany associations
            var acmeAdminCompany = new UserCompany
            {
                UserId = acmeAdmin.Id,
                CompanyId = acmeCompany.Id,
                Role = UserRole.Admin,
                HourlyRate = 150.00m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "system",
                UpdatedBy = "system",
                IsDeleted = false
            };

            var acmeDevCompany = new UserCompany
            {
                UserId = acmeDev.Id,
                CompanyId = acmeCompany.Id,
                Role = UserRole.Developer,
                HourlyRate = 80.00m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "system",
                UpdatedBy = "system",
                IsDeleted = false
            };

            var techStartAdminCompany = new UserCompany
            {
                UserId = techStartAdmin.Id,
                CompanyId = techStartCompany.Id,
                Role = UserRole.Manager,
                HourlyRate = 120.00m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "system",
                UpdatedBy = "system",
                IsDeleted = false
            };

            var techStartDevCompany = new UserCompany
            {
                UserId = techStartDev.Id,
                CompanyId = techStartCompany.Id,
                Role = UserRole.Developer,
                HourlyRate = 75.00m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "system",
                UpdatedBy = "system",
                IsDeleted = false
            };

            context.UserCompanies.AddRange(acmeAdminCompany, acmeDevCompany, techStartAdminCompany, techStartDevCompany);
            context.SaveChanges();

            Console.WriteLine("UserCompany associations created");

            // Create Projects for ACME
            var acmeProject1 = new Project
            {
                CompanyId = acmeCompany.Id,
                Name = "ACME E-Commerce Platform",
                StartDate = DateTime.UtcNow.AddMonths(-3),
                EndDate = DateTime.UtcNow.AddMonths(3),
                Status = ProjectStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = acmeAdmin.Email,
                UpdatedBy = acmeAdmin.Email,
                IsDeleted = false
            };

            var acmeProject2 = new Project
            {
                CompanyId = acmeCompany.Id,
                Name = "ACME Mobile App",
                StartDate = DateTime.UtcNow.AddMonths(-2),
                EndDate = DateTime.UtcNow.AddMonths(4),
                Status = ProjectStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = acmeAdmin.Email,
                UpdatedBy = acmeAdmin.Email,
                IsDeleted = false
            };

            // Create Projects for TechStart
            var techStartProject1 = new Project
            {
                CompanyId = techStartCompany.Id,
                Name = "TechStart CRM System",
                StartDate = DateTime.UtcNow.AddMonths(-4),
                EndDate = DateTime.UtcNow.AddMonths(2),
                Status = ProjectStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = techStartAdmin.Email,
                UpdatedBy = techStartAdmin.Email,
                IsDeleted = false
            };

            var techStartProject2 = new Project
            {
                CompanyId = techStartCompany.Id,
                Name = "TechStart Analytics Dashboard",
                StartDate = DateTime.UtcNow.AddMonths(-1),
                EndDate = DateTime.UtcNow.AddMonths(5),
                Status = ProjectStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = techStartAdmin.Email,
                UpdatedBy = techStartAdmin.Email,
                IsDeleted = false
            };

            context.Projects.AddRange(acmeProject1, acmeProject2, techStartProject1, techStartProject2);
            context.SaveChanges();

            Console.WriteLine("Projects created: 4 projects (2 per company)");

            // Create Issues for ACME Project 1
            var acmeIssues = new List<Issue>
            {
                new Issue
                {
                    ProjectId = acmeProject1.Id,
                    Title = "Setup database schema",
                    Description = "Design and implement database schema for e-commerce",
                    Type = IssueType.Task,
                    Status = IssueStatus.Done,
                    Priority = IssuePriority.High,
                    EstimatedHours = 8,
                    AssignedUserId = acmeDev.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-20),
                    UpdatedAt = DateTime.UtcNow.AddDays(-15),
                    CreatedBy = acmeAdmin.Email,
                    UpdatedBy = acmeDev.Email,
                    IsDeleted = false
                },
                new Issue
                {
                    ProjectId = acmeProject1.Id,
                    Title = "Implement product catalog",
                    Description = "Create product listing and search functionality",
                    Type = IssueType.UserStory,
                    Status = IssueStatus.InProgress,
                    Priority = IssuePriority.High,
                    EstimatedHours = 16,
                    AssignedUserId = acmeDev.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-15),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1),
                    CreatedBy = acmeAdmin.Email,
                    UpdatedBy = acmeDev.Email,
                    IsDeleted = false
                },
                new Issue
                {
                    ProjectId = acmeProject1.Id,
                    Title = "Fix cart calculation bug",
                    Description = "Cart total is not including tax correctly",
                    Type = IssueType.Bug,
                    Status = IssueStatus.Testing,
                    Priority = IssuePriority.Critical,
                    EstimatedHours = 4,
                    AssignedUserId = acmeDev.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    UpdatedAt = DateTime.UtcNow.AddDays(-2),
                    CreatedBy = acmeAdmin.Email,
                    UpdatedBy = acmeDev.Email,
                    IsDeleted = false
                },
                new Issue
                {
                    ProjectId = acmeProject2.Id,
                    Title = "Design mobile UI mockups",
                    Description = "Create UI/UX mockups for mobile app",
                    Type = IssueType.Task,
                    Status = IssueStatus.Done,
                    Priority = IssuePriority.Medium,
                    EstimatedHours = 12,
                    AssignedUserId = acmeDev.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-18),
                    UpdatedAt = DateTime.UtcNow.AddDays(-12),
                    CreatedBy = acmeAdmin.Email,
                    UpdatedBy = acmeDev.Email,
                    IsDeleted = false
                },
                new Issue
                {
                    ProjectId = acmeProject2.Id,
                    Title = "Implement user authentication",
                    Description = "Add login and registration functionality",
                    Type = IssueType.UserStory,
                    Status = IssueStatus.InProgress,
                    Priority = IssuePriority.High,
                    EstimatedHours = 10,
                    AssignedUserId = acmeDev.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-12),
                    UpdatedAt = DateTime.UtcNow,
                    CreatedBy = acmeAdmin.Email,
                    UpdatedBy = acmeDev.Email,
                    IsDeleted = false
                }
            };

            // Create Issues for TechStart Projects
            var techStartIssues = new List<Issue>
            {
                new Issue
                {
                    ProjectId = techStartProject1.Id,
                    Title = "Setup CRM database",
                    Description = "Initialize database for CRM system",
                    Type = IssueType.Task,
                    Status = IssueStatus.Done,
                    Priority = IssuePriority.High,
                    EstimatedHours = 6,
                    AssignedUserId = techStartDev.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-25),
                    UpdatedAt = DateTime.UtcNow.AddDays(-20),
                    CreatedBy = techStartAdmin.Email,
                    UpdatedBy = techStartDev.Email,
                    IsDeleted = false
                },
                new Issue
                {
                    ProjectId = techStartProject1.Id,
                    Title = "Implement contact management",
                    Description = "Create, read, update, delete contacts",
                    Type = IssueType.UserStory,
                    Status = IssueStatus.InProgress,
                    Priority = IssuePriority.High,
                    EstimatedHours = 14,
                    AssignedUserId = techStartDev.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-20),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1),
                    CreatedBy = techStartAdmin.Email,
                    UpdatedBy = techStartDev.Email,
                    IsDeleted = false
                },
                new Issue
                {
                    ProjectId = techStartProject1.Id,
                    Title = "Add email integration",
                    Description = "Integrate with email service provider",
                    Type = IssueType.Task,
                    Status = IssueStatus.ToDo,
                    Priority = IssuePriority.Medium,
                    EstimatedHours = 8,
                    AssignedUserId = techStartDev.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-15),
                    UpdatedAt = DateTime.UtcNow.AddDays(-15),
                    CreatedBy = techStartAdmin.Email,
                    UpdatedBy = techStartAdmin.Email,
                    IsDeleted = false
                },
                new Issue
                {
                    ProjectId = techStartProject2.Id,
                    Title = "Create analytics data models",
                    Description = "Design and implement analytics data schema",
                    Type = IssueType.Task,
                    Status = IssueStatus.Done,
                    Priority = IssuePriority.High,
                    EstimatedHours = 10,
                    AssignedUserId = techStartDev.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-14),
                    UpdatedAt = DateTime.UtcNow.AddDays(-10),
                    CreatedBy = techStartAdmin.Email,
                    UpdatedBy = techStartDev.Email,
                    IsDeleted = false
                },
                new Issue
                {
                    ProjectId = techStartProject2.Id,
                    Title = "Build real-time dashboard",
                    Description = "Implement real-time data visualization",
                    Type = IssueType.UserStory,
                    Status = IssueStatus.InProgress,
                    Priority = IssuePriority.High,
                    EstimatedHours = 20,
                    AssignedUserId = techStartDev.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    UpdatedAt = DateTime.UtcNow,
                    CreatedBy = techStartAdmin.Email,
                    UpdatedBy = techStartDev.Email,
                    IsDeleted = false
                }
            };

            context.Issues.AddRange(acmeIssues);
            context.Issues.AddRange(techStartIssues);
            context.SaveChanges();

            Console.WriteLine("Issues created: 10 issues (5 per company)");

            // Create Time Entries for ACME
            var acmeTimeEntries = new List<TimeEntry>
            {
                // Alice working on database schema (completed issue)
                new TimeEntry
                {
                    IssueId = acmeIssues[0].Id,
                    ProjectId = acmeIssues[0].ProjectId, // Ensure ProjectId is set
                    UserId = acmeDev.Id,
                    CompanyId = acmeCompany.Id,
                    StartTime = DateTime.UtcNow.AddDays(-20).AddHours(9),
                    EndTime = DateTime.UtcNow.AddDays(-20).AddHours(13),
                    Description = "Initial database design",
                    CreatedAt = DateTime.UtcNow.AddDays(-20),
                    UpdatedAt = DateTime.UtcNow.AddDays(-20),
                    CreatedBy = acmeDev.Email,
                    UpdatedBy = acmeDev.Email,
                    IsDeleted = false
                },
                new TimeEntry
                {
                    IssueId = acmeIssues[0].Id,
                    ProjectId = acmeIssues[0].ProjectId, // Ensure ProjectId is set
                    UserId = acmeDev.Id,
                    CompanyId = acmeCompany.Id,
                    StartTime = DateTime.UtcNow.AddDays(-19).AddHours(10),
                    EndTime = DateTime.UtcNow.AddDays(-19).AddHours(14),
                    Description = "Implementing migrations",
                    CreatedAt = DateTime.UtcNow.AddDays(-19),
                    UpdatedAt = DateTime.UtcNow.AddDays(-19),
                    CreatedBy = acmeDev.Email,
                    UpdatedBy = acmeDev.Email,
                    IsDeleted = false
                },
                // Alice working on product catalog (in progress)
                new TimeEntry
                {
                    IssueId = acmeIssues[1].Id,
                    ProjectId = acmeIssues[1].ProjectId, // Ensure ProjectId is set
                    UserId = acmeDev.Id,
                    CompanyId = acmeCompany.Id,
                    StartTime = DateTime.UtcNow.AddDays(-5).AddHours(9),
                    EndTime = DateTime.UtcNow.AddDays(-5).AddHours(17),
                    Description = "Product listing page implementation",
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    UpdatedAt = DateTime.UtcNow.AddDays(-5),
                    CreatedBy = acmeDev.Email,
                    UpdatedBy = acmeDev.Email,
                    IsDeleted = false
                },
                new TimeEntry
                {
                    IssueId = acmeIssues[1].Id,
                    ProjectId = acmeIssues[1].ProjectId, // Ensure ProjectId is set
                    UserId = acmeDev.Id,
                    CompanyId = acmeCompany.Id,
                    StartTime = DateTime.UtcNow.AddDays(-4).AddHours(10),
                    EndTime = DateTime.UtcNow.AddDays(-4).AddHours(15).AddMinutes(30),
                    Description = "Search functionality",
                    CreatedAt = DateTime.UtcNow.AddDays(-4),
                    UpdatedAt = DateTime.UtcNow.AddDays(-4),
                    CreatedBy = acmeDev.Email,
                    UpdatedBy = acmeDev.Email,
                    IsDeleted = false
                },
                // Alice working on bug fix
                new TimeEntry
                {
                    IssueId = acmeIssues[2].Id,
                    ProjectId = acmeIssues[2].ProjectId, // Ensure ProjectId is set
                    UserId = acmeDev.Id,
                    CompanyId = acmeCompany.Id,
                    StartTime = DateTime.UtcNow.AddDays(-3).AddHours(14),
                    EndTime = DateTime.UtcNow.AddDays(-3).AddHours(18),
                    Description = "Investigating cart calculation bug",
                    CreatedAt = DateTime.UtcNow.AddDays(-3),
                    UpdatedAt = DateTime.UtcNow.AddDays(-3),
                    CreatedBy = acmeDev.Email,
                    UpdatedBy = acmeDev.Email,
                    IsDeleted = false
                }
            };

            // Create Time Entries for TechStart
            var techStartTimeEntries = new List<TimeEntry>
            {
                // Carol working on CRM database
                new TimeEntry
                {
                    IssueId = techStartIssues[0].Id,
                    ProjectId = techStartIssues[0].ProjectId, // Ensure ProjectId is set
                    UserId = techStartDev.Id,
                    CompanyId = techStartCompany.Id,
                    StartTime = DateTime.UtcNow.AddDays(-25).AddHours(9),
                    EndTime = DateTime.UtcNow.AddDays(-25).AddHours(15),
                    Description = "Database schema setup",
                    CreatedAt = DateTime.UtcNow.AddDays(-25),
                    UpdatedAt = DateTime.UtcNow.AddDays(-25),
                    CreatedBy = techStartDev.Email,
                    UpdatedBy = techStartDev.Email,
                    IsDeleted = false
                },
                // Carol working on contact management
                new TimeEntry
                {
                    IssueId = techStartIssues[1].Id,
                    ProjectId = techStartIssues[1].ProjectId, // Ensure ProjectId is set
                    UserId = techStartDev.Id,
                    CompanyId = techStartCompany.Id,
                    StartTime = DateTime.UtcNow.AddDays(-6).AddHours(10),
                    EndTime = DateTime.UtcNow.AddDays(-6).AddHours(18),
                    Description = "CRUD operations for contacts",
                    CreatedAt = DateTime.UtcNow.AddDays(-6),
                    UpdatedAt = DateTime.UtcNow.AddDays(-6),
                    CreatedBy = techStartDev.Email,
                    UpdatedBy = techStartDev.Email,
                    IsDeleted = false
                },
                new TimeEntry
                {
                    IssueId = techStartIssues[1].Id,
                    ProjectId = techStartIssues[1].ProjectId, // Ensure ProjectId is set
                    UserId = techStartDev.Id,
                    CompanyId = techStartCompany.Id,
                    StartTime = DateTime.UtcNow.AddDays(-5).AddHours(9),
                    EndTime = DateTime.UtcNow.AddDays(-5).AddHours(16).AddMinutes(45),
                    Description = "Contact search and filtering",
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    UpdatedAt = DateTime.UtcNow.AddDays(-5),
                    CreatedBy = techStartDev.Email,
                    UpdatedBy = techStartDev.Email,
                    IsDeleted = false
                },
                // Carol working on analytics
                new TimeEntry
                {
                    IssueId = techStartIssues[3].Id,
                    ProjectId = techStartIssues[3].ProjectId, // Ensure ProjectId is set
                    UserId = techStartDev.Id,
                    CompanyId = techStartCompany.Id,
                    StartTime = DateTime.UtcNow.AddDays(-12).AddHours(10),
                    EndTime = DateTime.UtcNow.AddDays(-12).AddHours(17),
                    Description = "Analytics data model design",
                    CreatedAt = DateTime.UtcNow.AddDays(-12),
                    UpdatedAt = DateTime.UtcNow.AddDays(-12),
                    CreatedBy = techStartDev.Email,
                    UpdatedBy = techStartDev.Email,
                    IsDeleted = false
                },
                new TimeEntry
                {
                    IssueId = techStartIssues[4].Id,
                    ProjectId = techStartIssues[4].ProjectId, // Ensure ProjectId is set
                    UserId = techStartDev.Id,
                    CompanyId = techStartCompany.Id,
                    StartTime = DateTime.UtcNow.AddDays(-2).AddHours(9),
                    EndTime = DateTime.UtcNow.AddDays(-2).AddHours(17).AddMinutes(30),
                    Description = "Dashboard UI implementation",
                    CreatedAt = DateTime.UtcNow.AddDays(-2),
                    UpdatedAt = DateTime.UtcNow.AddDays(-2),
                    CreatedBy = techStartDev.Email,
                    UpdatedBy = techStartDev.Email,
                    IsDeleted = false
                }
            };

            context.TimeEntries.AddRange(acmeTimeEntries);
            context.TimeEntries.AddRange(techStartTimeEntries);
            context.SaveChanges();

            Console.WriteLine("Time entries created: 10 entries (5 per company)");
            Console.WriteLine("\n=== Database Seeding Complete ===");
            Console.WriteLine("\nTest Users:");
            Console.WriteLine("ACME Corporation:");
            Console.WriteLine("  - john@acme.com / Admin123! (Admin)");
            Console.WriteLine("  - alice@acme.com / Dev123! (Developer)");
            Console.WriteLine("\nTechStart Solutions:");
            Console.WriteLine("  - bob@techstart.com / Manager123! (Manager)");
            Console.WriteLine("  - carol@techstart.com / Dev123! (Developer)");
            Console.WriteLine("\nYou can test tenant isolation by logging in as users from different companies.");
        }
    }
}
