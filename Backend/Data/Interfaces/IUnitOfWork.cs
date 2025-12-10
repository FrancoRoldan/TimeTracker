using Data.Models;

namespace Data.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        // Repositories
        IRepository<Company> Companies { get; }
        IRepository<UserCompany> UserCompanies { get; }
        IRepository<Project> Projects { get; }
        IRepository<Issue> Issues { get; }
        IRepository<TimeEntry> TimeEntries { get; }
        IUserRepository Users { get; }

        // Methods
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}
