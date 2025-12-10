using Data.Dtos.Company;
using Data.Enums;
using FluentValidation;

namespace Data.Validators
{
    public class JoinCompanyRequestValidator : AbstractValidator<JoinCompanyRequest>
    {
        public JoinCompanyRequestValidator()
        {
            RuleFor(x => x.CompanyId)
                .GreaterThan(0).WithMessage("CompanyId must be greater than 0");

            RuleFor(x => x.Role)
                .NotEmpty().WithMessage("Role is required")
                .Must(BeAValidRole).WithMessage("Invalid role. Valid roles are: Admin, Manager, Developer, Viewer");

            RuleFor(x => x.HourlyRate)
                .GreaterThanOrEqualTo(0).When(x => x.HourlyRate.HasValue)
                .WithMessage("HourlyRate must be greater than or equal to 0");
        }

        private bool BeAValidRole(string role)
        {
            return Enum.TryParse<UserRole>(role, true, out _);
        }
    }
}
