using Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Data.Configurations
{
    public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
    {
        public void Configure(EntityTypeBuilder<AuditLog> builder)
        {
            builder.ToTable("AuditLogs");

            builder.HasKey(a => a.Id);

            builder.Property(a => a.Action).IsRequired().HasMaxLength(50);
            builder.Property(a => a.EntityType).IsRequired().HasMaxLength(100);
            builder.Property(a => a.EntityId).IsRequired().HasMaxLength(100);
            builder.Property(a => a.Application).IsRequired().HasMaxLength(100);
            builder.Property(a => a.TraceId).HasMaxLength(64);
            builder.Property(a => a.IpAddress).HasMaxLength(64);
            builder.Property(a => a.ChangedColumns).HasMaxLength(2000);

            // Los valores van como jsonb: permite consultarlos desde el dashboard
            // de auditoría sin tener que parsear texto.
            builder.Property(a => a.OldValues).HasColumnType("jsonb");
            builder.Property(a => a.NewValues).HasColumnType("jsonb");

            // Índices pensados para las consultas del Dashboard 7 de §26:
            // "cambios por día", "quién modifica más", "qué entidades cambian".
            builder.HasIndex(a => a.Timestamp);
            builder.HasIndex(a => new { a.CompanyId, a.Timestamp });
            builder.HasIndex(a => new { a.EntityType, a.EntityId });
            builder.HasIndex(a => a.UserId);
            builder.HasIndex(a => a.TraceId);
        }
    }
}
