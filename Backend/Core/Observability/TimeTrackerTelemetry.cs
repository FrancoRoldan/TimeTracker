using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace Core.Observability
{
    /// <summary>
    /// Instrumentación propia del dominio: el <c>ActivitySource</c> para spans de negocio
    /// (§6.1) y el catálogo de métricas funcionales (§22 del plan de observabilidad).
    ///
    /// Las métricas llevan <c>tenant.id</c> como dimensión, pero NUNCA identificadores
    /// personales (email, nombre) como etiquetas.
    /// </summary>
    public static class TimeTrackerTelemetry
    {
        public const string ActivitySourceName = "TimeTracker.Business";
        public const string MeterName = "TimeTracker.Business";

        public static readonly ActivitySource ActivitySource = new(ActivitySourceName);

        private static readonly Meter Meter = new(MeterName);

        // --- Tiempo ---------------------------------------------------------------
        public static readonly Counter<long> TimersStarted =
            Meter.CreateCounter<long>("timetracker.timers_started", "timers",
                "Cronómetros iniciados");

        public static readonly Counter<long> TimersStopped =
            Meter.CreateCounter<long>("timetracker.timers_stopped", "timers",
                "Cronómetros detenidos");

        public static readonly Counter<long> ManualEntriesCreated =
            Meter.CreateCounter<long>("timetracker.time_entries_created_manual", "entries",
                "Registros de tiempo cargados manualmente");

        public static readonly Counter<long> TimeEntriesEdited =
            Meter.CreateCounter<long>("timetracker.time_entries_edited", "entries",
                "Registros de tiempo editados");

        public static readonly Counter<long> TimeEntriesDeleted =
            Meter.CreateCounter<long>("timetracker.time_entries_deleted", "entries",
                "Registros de tiempo eliminados");

        public static readonly Counter<long> MinutesTracked =
            Meter.CreateCounter<long>("timetracker.minutes_tracked_total", "min",
                "Minutos registrados al detener un cronómetro o cargar tiempo manual");

        // --- Trabajo --------------------------------------------------------------
        public static readonly Counter<long> IssuesCreated =
            Meter.CreateCounter<long>("timetracker.issues_created", "issues", "Issues creados");

        public static readonly Counter<long> IssuesAssigned =
            Meter.CreateCounter<long>("timetracker.issues_assigned", "issues", "Issues asignados");

        public static readonly Counter<long> IssuesCompleted =
            Meter.CreateCounter<long>("timetracker.issues_completed", "issues",
                "Issues que pasaron a estado Done");

        public static readonly Counter<long> ProjectsCreated =
            Meter.CreateCounter<long>("timetracker.projects_created", "projects", "Proyectos creados");

        // --- Organización ---------------------------------------------------------
        public static readonly Counter<long> CompaniesCreated =
            Meter.CreateCounter<long>("timetracker.companies_created", "companies", "Empresas creadas");

        public static readonly Counter<long> CompanyMembersAdded =
            Meter.CreateCounter<long>("timetracker.company_members_added", "members",
                "Usuarios agregados a una empresa");

        public static readonly Counter<long> CompanyMembersRemoved =
            Meter.CreateCounter<long>("timetracker.company_members_removed", "members",
                "Usuarios quitados de una empresa");

        // --- Usuarios -------------------------------------------------------------
        public static readonly Counter<long> UsersRegistered =
            Meter.CreateCounter<long>("timetracker.users_registered", "users", "Usuarios registrados");

        public static readonly Counter<long> UsersLoggedIn =
            Meter.CreateCounter<long>("timetracker.users_logged_in", "logins", "Inicios de sesión exitosos");

        public static readonly Counter<long> LoginFailed =
            Meter.CreateCounter<long>("timetracker.login_failed", "logins",
                "Intentos de inicio de sesión fallidos");

        // --- Reportes -------------------------------------------------------------
        public static readonly Counter<long> ReportsGenerated =
            Meter.CreateCounter<long>("timetracker.reports_generated", "reports",
                "Reportes generados, con la dimensión report.type");

        // --- Frontend / RUM (§15, §16) --------------------------------------------
        // Se alimentan desde POST /api/telemetry. Las dimensiones son de baja
        // cardinalidad a propósito: nunca la URL con ids, siempre el route template.
        public static readonly Counter<long> FrontendErrors =
            Meter.CreateCounter<long>("timetracker.frontend_errors", "errors",
                "Errores de JavaScript reportados por el navegador");

        public static readonly Counter<long> FrontendApiErrors =
            Meter.CreateCounter<long>("timetracker.frontend_api_errors", "errors",
                "Errores de llamadas a la API vistos desde el navegador");

        public static readonly Histogram<double> WebVital =
            Meter.CreateHistogram<double>("timetracker.web_vital", "ms",
                "Web Vitals (LCP, INP, CLS, FCP, TTFB), con la dimensión vital.name");

        public static readonly Counter<long> FrontendEvents =
            Meter.CreateCounter<long>("timetracker.frontend_events", "events",
                "Eventos de uso reportados por el navegador");

        // --- Seguridad ------------------------------------------------------------
        public static readonly Counter<long> TenantAccessDenied =
            Meter.CreateCounter<long>("timetracker.tenant_access_denied", "requests",
                "Requests rechazadas por pedir una empresa a la que el usuario no pertenece");

        /// <summary>
        /// Abre un span de negocio. Devuelve null si nadie está escuchando, lo que hace
        /// que la instrumentación no cueste nada cuando no hay exportador configurado.
        /// </summary>
        public static Activity? StartActivity(string name) =>
            ActivitySource.StartActivity(name, ActivityKind.Internal);

        /// <summary>Etiqueta estándar de tenant para las métricas de negocio.</summary>
        public static KeyValuePair<string, object?> TenantTag(int? tenantId) =>
            new("tenant.id", tenantId?.ToString() ?? "unknown");
    }
}
