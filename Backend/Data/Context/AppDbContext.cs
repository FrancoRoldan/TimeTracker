using Data.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Data.Context
{
    public class AppDbContext : DbContext
    {
        private readonly int? _currentTenantId;
        private readonly int? _currentUserId;

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public AppDbContext(DbContextOptions<AppDbContext> options, int? tenantId, int? userId)
            : base(options)
        {
            _currentTenantId = tenantId;
            _currentUserId = userId;
        }

        // DbSets
        public DbSet<User> Users { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<UserCompany> UserCompanies { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<Issue> Issues { get; set; }
        public DbSet<TimeEntry> TimeEntries { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Apply configurations from assembly
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

            // Apply global query filters
            ApplyGlobalFilters(modelBuilder);
        }

        private void ApplyGlobalFilters(ModelBuilder modelBuilder)
        {
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
                {
                    var parameter = Expression.Parameter(entityType.ClrType, "e");

                    // Soft Delete Filter
                    var isDeletedProperty = entityType.FindProperty(nameof(BaseEntity.IsDeleted));
                    Expression? filter = null;

                    if (isDeletedProperty != null)
                    {
                        filter = Expression.Equal(
                            Expression.Property(parameter, nameof(BaseEntity.IsDeleted)),
                            Expression.Constant(false));
                    }

                    // Tenant Filter (skip for User and Company entities)
                    if (entityType.ClrType != typeof(User) && entityType.ClrType != typeof(Company))
                    {
                        var companyIdProperty = entityType.FindProperty(nameof(BaseEntity.CompanyId));
                        if (companyIdProperty != null && _currentTenantId.HasValue)
                        {
                            var tenantFilter = Expression.Equal(
                                Expression.Property(parameter, nameof(BaseEntity.CompanyId)),
                                Expression.Constant(_currentTenantId, typeof(int?)));

                            filter = filter == null
                                ? tenantFilter
                                : Expression.AndAlso(filter, tenantFilter);
                        }
                    }

                    if (filter != null)
                    {
                        var lambda = Expression.Lambda(filter, parameter);
                        modelBuilder.Entity(entityType.ClrType).HasQueryFilter(lambda);
                    }
                }
            }
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var entries = ChangeTracker.Entries<BaseEntity>();
            var currentUser = _currentUserId?.ToString() ?? "SYSTEM";
            var currentTime = DateTime.UtcNow;

            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.CreatedAt = currentTime;
                    entry.Entity.CreatedBy = currentUser;
                    entry.Entity.UpdatedAt = currentTime;
                    entry.Entity.UpdatedBy = currentUser;

                    // Auto-set CompanyId for tenant-scoped entities
                    if (entry.Entity.GetType() != typeof(User) &&
                        entry.Entity.GetType() != typeof(Company) &&
                        entry.Entity.CompanyId == null &&
                        _currentTenantId.HasValue)
                    {
                        entry.Entity.CompanyId = _currentTenantId;
                    }
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Entity.UpdatedAt = currentTime;
                    entry.Entity.UpdatedBy = currentUser;
                }
            }

            return base.SaveChangesAsync(cancellationToken);
        }
    }
}
