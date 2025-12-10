using Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Data.Configurations
{
    public class CompanyConfiguration : IEntityTypeConfiguration<Company>
    {
        public void Configure(EntityTypeBuilder<Company> builder)
        {
            builder.ToTable("Companies");

            builder.Property(c => c.Name)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(c => c.Code)
                .IsRequired()
                .HasMaxLength(50);

            builder.HasIndex(c => c.Code)
                .IsUnique();

            builder.HasIndex(c => c.IsActive);

            // Company doesn't have CompanyId filter (it's the root tenant)
            builder.Property(c => c.CompanyId).IsRequired(false);
        }
    }
}
