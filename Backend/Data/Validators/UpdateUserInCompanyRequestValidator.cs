using Data.Dtos.Company;
using Data.Enums;
using FluentValidation;

namespace Data.Validators
{
    public class UpdateUserInCompanyRequestValidator : AbstractValidator<UpdateUserInCompanyRequest>
    {
        public UpdateUserInCompanyRequestValidator()
        {
            RuleFor(x => x.Role)
                .IsInEnum().WithMessage("Invalid role. Valid roles are: Admin, Manager, Developer, Viewer");

            RuleFor(x => x.HourlyRate)
                .GreaterThanOrEqualTo(0).When(x => x.HourlyRate.HasValue)
                .WithMessage("HourlyRate must be greater than or equal to 0");
        }
    }
}
