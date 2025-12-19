using Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Data.Configurations
{
    public class IssueConfiguration : IEntityTypeConfiguration<Issue>
    {
        public void Configure(EntityTypeBuilder<Issue> builder)
        {
            builder.ToTable("Issues");

            builder.Property(i => i.Title)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(i => i.Description)
                .HasMaxLength(2000);

            builder.Property(i => i.EstimatedHours)
                .HasColumnType("decimal(18,2)");

            builder.HasOne(i => i.Project)
                .WithMany(p => p.Issues)
                .HasForeignKey(i => i.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(i => i.AssignedUser)
                .WithMany()
                .HasForeignKey(i => i.AssignedUserId)
                .OnDelete(DeleteBehavior.SetNull);

            // Optimized indexes for frequent queries
            builder.HasIndex(i => new { i.ProjectId, i.Status });
            builder.HasIndex(i => i.AssignedUserId);
            builder.HasIndex(i => i.CompanyId);
            builder.HasIndex(i => i.IsDeleted);

            // Additional index for combined queries (AssignedUser + Project)
            builder.HasIndex(i => new { i.AssignedUserId, i.ProjectId });

            // Index for filtering by Type and Priority
            builder.HasIndex(i => new { i.Type, i.Status });
            builder.HasIndex(i => new { i.Priority, i.Status });
        }
    }
}
