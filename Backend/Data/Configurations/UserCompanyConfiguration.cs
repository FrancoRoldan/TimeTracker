using Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Data.Configurations
{
    public class UserCompanyConfiguration : IEntityTypeConfiguration<UserCompany>
    {
        public void Configure(EntityTypeBuilder<UserCompany> builder)
        {
            builder.ToTable("UserCompanies");

            builder.HasIndex(uc => new { uc.UserId, uc.CompanyId })
                .IsUnique();

            builder.Property(uc => uc.HourlyRate)
                .HasColumnType("decimal(18,2)");

            builder.HasOne(uc => uc.User)
                .WithMany(u => u.UserCompanies)
                .HasForeignKey(uc => uc.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(uc => uc.Company)
                .WithMany(c => c.UserCompanies)
                .HasForeignKey(uc => uc.CompanyId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(uc => uc.CompanyId);
            builder.HasIndex(uc => uc.IsDeleted);
        }
    }
}
