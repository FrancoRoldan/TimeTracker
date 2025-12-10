using Data.Context;
using Data.Interfaces;
using Data.Models;
using Data.Repositorys;
using Microsoft.EntityFrameworkCore.Storage;

namespace Data.UnitOfWork
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;
        private IDbContextTransaction? _transaction;

        // Repository instances
        private IRepository<Company>? _companies;
        private IRepository<UserCompany>? _userCompanies;
        private IRepository<Project>? _projects;
        private IRepository<Issue>? _issues;
        private IRepository<TimeEntry>? _timeEntries;
        private IUserRepository? _users;

        public UnitOfWork(AppDbContext context)
        {
            _context = context;
        }

        public IRepository<Company> Companies =>
            _companies ??= new Repository<Company>(_context);

        public IRepository<UserCompany> UserCompanies =>
            _userCompanies ??= new Repository<UserCompany>(_context);

        public IRepository<Project> Projects =>
            _projects ??= new Repository<Project>(_context);

        public IRepository<Issue> Issues =>
            _issues ??= new Repository<Issue>(_context);

        public IRepository<TimeEntry> TimeEntries =>
            _timeEntries ??= new Repository<TimeEntry>(_context);

        public IUserRepository Users =>
            _users ??= new UserRepository(_context);

        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            if (_transaction == null)
                throw new InvalidOperationException("No transaction started");

            await _transaction.CommitAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }

        public async Task RollbackTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public void Dispose()
        {
            _transaction?.Dispose();
            _context.Dispose();
        }
    }
}
