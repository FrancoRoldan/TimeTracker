using Npgsql; // AddNpgsql / AddNpgsqlInstrumentation viven en este namespace
using Core.Observability;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;
using Serilog.Events;
using Serilog.Formatting.Compact;

namespace TimeTracker.Observability
{
    /// <summary>
    /// Cableado de la Fase 2 del plan de observabilidad: logging estructurado (§24)
    /// y OpenTelemetry para trazas y métricas (§6, §8, §9).
    ///
    /// El exportador OTLP solo se activa si hay endpoint configurado
    /// (<c>Otlp:Endpoint</c> o la variable estándar OTEL_EXPORTER_OTLP_ENDPOINT).
    /// Sin él la aplicación funciona igual: la instrumentación queda inerte y no
    /// hay que levantar la plataforma (Fase 4) para poder desarrollar.
    /// </summary>
    public static class ObservabilityExtensions
    {
        /// <summary>
        /// Configura Serilog con salida JSON estructurada. Se llama antes de construir
        /// el host para que los errores de arranque también queden estructurados.
        /// </summary>
        public static void ConfigureSerilog(this WebApplicationBuilder builder, ServiceInfo service)
        {
            builder.Host.UseSerilog((context, loggerConfiguration) =>
            {
                loggerConfiguration
                    .ReadFrom.Configuration(context.Configuration)
                    .Enrich.FromLogContext()
                    .Enrich.With(new TraceContextEnricher())
                    .Enrich.WithProperty("service.name", service.Name)
                    .Enrich.WithProperty("service.version", service.Version)
                    .Enrich.WithProperty("deployment.environment", service.Environment)
                    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
                    .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command",
                        LogEventLevel.Warning);

                // En desarrollo se prioriza la legibilidad; en el resto, JSON parseable
                // por Loki. Ver §24.2 del plan.
                if (context.HostingEnvironment.IsDevelopment())
                {
                    loggerConfiguration.WriteTo.Console(
                        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} " +
                                        "{Properties:j}{NewLine}{Exception}");
                }
                else
                {
                    loggerConfiguration.WriteTo.Console(new CompactJsonFormatter());
                }
            });
        }

        /// <summary>
        /// Registra OpenTelemetry (trazas + métricas) y los health checks.
        /// </summary>
        public static IServiceCollection AddObservability(
            this IServiceCollection services,
            IConfiguration configuration,
            ServiceInfo service)
        {
            services.AddSingleton(service);

            var otlpEndpoint = configuration["Otlp:Endpoint"]
                ?? configuration["OTEL_EXPORTER_OTLP_ENDPOINT"];
            var hasOtlp = !string.IsNullOrWhiteSpace(otlpEndpoint);

            var resource = ResourceBuilder.CreateDefault()
                .AddService(
                    serviceName: service.Name,
                    serviceVersion: service.Version)
                .AddAttributes(new Dictionary<string, object>
                {
                    ["deployment.environment"] = service.Environment,
                    ["service.commit_sha"] = service.CommitSha,
                    ["service.build_number"] = service.BuildNumber,
                    ["host.name"] = Environment.MachineName
                });

            services.AddOpenTelemetry()
                .WithTracing(tracing =>
                {
                    tracing
                        .SetResourceBuilder(resource)
                        .AddSource(TimeTrackerTelemetry.ActivitySourceName)
                        .AddAspNetCoreInstrumentation(options =>
                        {
                            options.RecordException = true;
                            // Los health checks generan ruido constante y no aportan
                            // información de negocio.
                            options.Filter = ctx =>
                                !ctx.Request.Path.StartsWithSegments("/health");
                        })
                        .AddHttpClientInstrumentation()
                        .AddNpgsql();

                    if (hasOtlp)
                        tracing.AddOtlpExporter(o => o.Endpoint = new Uri(otlpEndpoint!));
                })
                .WithMetrics(metrics =>
                {
                    metrics
                        .SetResourceBuilder(resource)
                        .AddMeter(TimeTrackerTelemetry.MeterName)
                        .AddAspNetCoreInstrumentation()
                        .AddHttpClientInstrumentation()
                        .AddRuntimeInstrumentation()
                        // Métricas del propio driver: uso del connection pool, tiempo de
                        // espera por una conexión, comandos ejecutados. Es la fuente de
                        // la alerta "pool PostgreSQL saturado" de §27.
                        .AddNpgsqlInstrumentation();

                    if (hasOtlp)
                        metrics.AddOtlpExporter(o => o.Endpoint = new Uri(otlpEndpoint!));
                });

            // Health checks (§8.5). /health/ready verifica la base de verdad;
            // antes /health devolvía "healthy" aunque PostgreSQL estuviera caído.
            var connectionString = configuration.GetConnectionString("DbConnString");
            var healthChecks = services.AddHealthChecks();

            if (!string.IsNullOrWhiteSpace(connectionString))
            {
                healthChecks.AddNpgSql(
                    connectionString,
                    name: "postgresql",
                    tags: new[] { "ready" });
            }

            return services;
        }
    }
}
