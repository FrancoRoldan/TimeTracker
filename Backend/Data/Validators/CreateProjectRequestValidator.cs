using Data.Dtos.Project;
using FluentValidation;

namespace Data.Validators
{
    public class CreateProjectRequestValidator : AbstractValidator<CreateProjectRequest>
    {
        public CreateProjectRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Project name is required")
                .MaximumLength(200).WithMessage("Project name cannot exceed 200 characters");

            RuleFor(x => x.StartDate)
                .LessThan(x => x.EndDate)
                .When(x => x.EndDate.HasValue && x.StartDate.HasValue)
                .WithMessage("Start date must be before end date");
        }
    }
}
