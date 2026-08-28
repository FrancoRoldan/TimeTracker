using Data.Interfaces;
using Data.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Data.Context
{
    public class AppDbContext : DbContext
    {
        /// <summary>
        /// Contexto de la request actual. Es null en escenarios sin HTTP
        /// (migraciones, seeder, tests), y en ese caso los cambios se estampan como "SYSTEM".
        /// </summary>
        private readonly ICurrentUserAccessor? _currentUser;

        /// <summary>
        /// Tenant usado por los filtros globales de consulta.
        ///
        /// IMPORTANTE: se resuelve en tiempo de construcción del modelo, que EF cachea,
        /// por lo que NO puede depender de la request. El aislamiento multi-tenant real
        /// lo aplica cada servicio a través de ITenantService; este campo queda en null
        /// y el filtro de tenant no se activa. Cambiar esto exige un IModelCacheKeyFactory
        /// propio y está fuera del alcance de esta fase.
        /// </summary>
        private readonly int? _currentTenantId = null;

        public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentUserAccessor? currentUser = null)
            : base(options)
        {
            _currentUser = currentUser;
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

        /// <summary>
        /// Estampa CreatedAt/CreatedBy/UpdatedAt/UpdatedBy y, cuando corresponde,
        /// el CompanyId de las entidades nuevas.
        ///
        /// Se invoca desde los tres caminos de guardado (síncrono y las dos sobrecargas
        /// asíncronas). Antes solo estaba cubierta SaveChangesAsync(CancellationToken),
        /// por lo que los caminos que EF usa internamente no estampaban nada.
        /// </summary>
        private void ApplyAuditInformation()
        {
            var entries = ChangeTracker.Entries<BaseEntity>();
            var userId = _currentUser?.GetUserId();
            var currentUser = userId?.ToString() ?? "SYSTEM";
            var tenantId = _currentUser?.GetTenantId();
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
                        tenantId.HasValue)
                    {
                        entry.Entity.CompanyId = tenantId;
                    }
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Entity.UpdatedAt = currentTime;
                    entry.Entity.UpdatedBy = currentUser;
                }
            }
        }

        // Se sobrescriben solo las sobrecargas con acceptAllChangesOnSuccess: son las que
        // EF invoca virtualmente desde SaveChanges() y SaveChangesAsync(ct), de modo que
        // todos los caminos quedan cubiertos sin estampar dos veces.

        public override int SaveChanges(bool acceptAllChangesOnSuccess)
        {
            ApplyAuditInformation();
            return base.SaveChanges(acceptAllChangesOnSuccess);
        }

        public override Task<int> SaveChangesAsync(
            bool acceptAllChangesOnSuccess,
            CancellationToken cancellationToken = default)
        {
            ApplyAuditInformation();
            return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }
    }
}
