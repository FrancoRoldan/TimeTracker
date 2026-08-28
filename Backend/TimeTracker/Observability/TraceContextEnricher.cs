using Serilog.Core;
using Serilog.Events;
using System.Diagnostics;

namespace TimeTracker.Observability
{
    /// <summary>
    /// Agrega <c>traceId</c> y <c>spanId</c> a cada evento de log.
    ///
    /// Es lo que permite saltar de un log en Loki a la traza en Tempo y viceversa
    /// (§7 y §21 del plan). Sin esto, logs y trazas quedan como dos silos separados.
    /// </summary>
    public class TraceContextEnricher : ILogEventEnricher
    {
        public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
        {
            var activity = Activity.Current;
            if (activity is null)
                return;

            logEvent.AddPropertyIfAbsent(
                propertyFactory.CreateProperty("traceId", activity.TraceId.ToString()));
            logEvent.AddPropertyIfAbsent(
                propertyFactory.CreateProperty("spanId", activity.SpanId.ToString()));
        }
    }
}
