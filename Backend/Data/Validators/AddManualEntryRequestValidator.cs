using Data.Dtos.TimeEntry;
using FluentValidation;

namespace Data.Validators
{
    public class AddManualEntryRequestValidator : AbstractValidator<AddManualEntryRequest>
    {
        public AddManualEntryRequestValidator()
        {
            // At least one of ProjectId or IssueId must be provided
            RuleFor(x => x)
                .Must(x => x.ProjectId.HasValue || x.IssueId.HasValue)
                .WithMessage("Either ProjectId or IssueId must be provided");

            RuleFor(x => x.ProjectId)
                .GreaterThan(0).WithMessage("Valid project ID is required")
                .When(x => x.ProjectId.HasValue);

            RuleFor(x => x.IssueId)
                .GreaterThan(0).WithMessage("Valid issue ID is required")
                .When(x => x.IssueId.HasValue);

            RuleFor(x => x.StartTime)
                .NotEmpty().WithMessage("Start time is required")
                .Must(BeUtc).WithMessage("StartTime must be in UTC");

            RuleFor(x => x.EndTime)
                .NotEmpty().WithMessage("End time is required")
                .Must(BeUtc).WithMessage("EndTime must be in UTC")
                .GreaterThan(x => x.StartTime).WithMessage("EndTime must be after StartTime");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));
        }

        private bool BeUtc(DateTime dateTime)
        {
            return dateTime.Kind == DateTimeKind.Utc;
        }
    }
}
