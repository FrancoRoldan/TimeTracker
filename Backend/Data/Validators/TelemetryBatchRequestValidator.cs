using Data.Dtos.Telemetry;
using FluentValidation;

namespace Data.Validators
{
    /// <summary>
    /// Validación de esquema del endpoint público de telemetría (§18).
    ///
    /// Los límites no son cosméticos: son el control de admisión de un endpoint
    /// anónimo expuesto a Internet. Un lote que no cumpla se rechaza entero.
    /// </summary>
    public class TelemetryBatchRequestValidator : AbstractValidator<TelemetryBatchRequest>
    {
        /// <summary>Máximo de eventos por lote.</summary>
        public const int MaxEventsPerBatch = 50;

        /// <summary>Máximo de propiedades adicionales por evento.</summary>
        public const int MaxPropertiesPerEvent = 20;

        public const int MaxStackLength = 8000;
        public const int MaxMessageLength = 2000;
        public const int MaxShortFieldLength = 200;

        private static readonly string[] AllowedTypes =
            { "error", "web_vital", "api_error", "event" };

        public TelemetryBatchRequestValidator()
        {
            RuleFor(x => x.Application)
                .NotEmpty().WithMessage("Application is required")
                .Must(a => a == "timetracker-web")
                .WithMessage("Unknown application");

            RuleFor(x => x.Version).MaximumLength(MaxShortFieldLength);
            RuleFor(x => x.Environment).MaximumLength(MaxShortFieldLength);
            RuleFor(x => x.SessionId).MaximumLength(MaxShortFieldLength);
            RuleFor(x => x.AnonymousId).MaximumLength(MaxShortFieldLength);

            RuleFor(x => x.Events)
                .NotEmpty().WithMessage("At least one event is required")
                .Must(e => e.Count <= MaxEventsPerBatch)
                .WithMessage($"A batch cannot contain more than {MaxEventsPerBatch} events");

            RuleForEach(x => x.Events).SetValidator(new TelemetryEventRequestValidator());
        }

        private class TelemetryEventRequestValidator : AbstractValidator<TelemetryEventRequest>
        {
            public TelemetryEventRequestValidator()
            {
                RuleFor(e => e.Type)
                    .NotEmpty().WithMessage("Event type is required")
                    .Must(t => AllowedTypes.Contains(t))
                    .WithMessage($"Event type must be one of: {string.Join(", ", AllowedTypes)}");

                RuleFor(e => e.Name).MaximumLength(MaxShortFieldLength);
                RuleFor(e => e.Route).MaximumLength(MaxShortFieldLength);
                RuleFor(e => e.ErrorType).MaximumLength(MaxShortFieldLength);
                RuleFor(e => e.Method).MaximumLength(20);
                RuleFor(e => e.Message).MaximumLength(MaxMessageLength);
                RuleFor(e => e.Stack).MaximumLength(MaxStackLength);

                RuleFor(e => e.TraceId)
                    .Matches("^[0-9a-f]{32}$")
                    .When(e => !string.IsNullOrEmpty(e.TraceId))
                    .WithMessage("TraceId must be a 32 character lowercase hex string");

                RuleFor(e => e.Properties!)
                    .Must(p => p.Count <= MaxPropertiesPerEvent)
                    .When(e => e.Properties != null)
                    .WithMessage($"An event cannot carry more than {MaxPropertiesPerEvent} properties");
            }
        }
    }
}
