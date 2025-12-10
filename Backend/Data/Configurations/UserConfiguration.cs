using Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Data.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.ToTable("Users");

            builder.Property(u => u.Nombre)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(u => u.Password)
                .IsRequired();

            builder.HasIndex(u => u.Email)
                .IsUnique();

            // User doesn't have CompanyId filter (can belong to multiple companies)
            builder.Property(u => u.CompanyId).IsRequired(false);
        }
    }
}
