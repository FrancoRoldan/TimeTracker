using Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Data.Configurations
{
    public class TimeEntryConfiguration : IEntityTypeConfiguration<TimeEntry>
    {
        public void Configure(EntityTypeBuilder<TimeEntry> builder)
        {
            builder.ToTable("TimeEntries");

            builder.Property(te => te.Description)
                .HasMaxLength(1000);

            builder.HasOne(te => te.Issue)
                .WithMany(i => i.TimeEntries)
                .HasForeignKey(te => te.IssueId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(te => te.User)
                .WithMany()
                .HasForeignKey(te => te.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(te => new { te.UserId, te.StartTime });
            builder.HasIndex(te => new { te.IssueId, te.StartTime });
            builder.HasIndex(te => new { te.CompanyId, te.StartTime });
            builder.HasIndex(te => te.IsDeleted);

            // Ignore computed property
            builder.Ignore(te => te.DurationMinutes);
        }
    }
}
