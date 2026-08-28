using System.Reflection;

namespace TimeTracker.Observability
{
    /// <summary>
    /// Identidad del servicio, compartida por logs, métricas y trazas.
    ///
    /// Corresponde a los atributos obligatorios de §6.3 del plan de observabilidad.
    /// Los valores de build (versión, commit, build number) se inyectan por
    /// configuración/variables de entorno desde el pipeline de Docker (§29); si no
    /// están definidos se cae a la versión del ensamblado.
    /// </summary>
    public sealed class ServiceInfo
    {
        public const string ServiceName = "timetracker-api";

        public string Name => ServiceName;
        public string Version { get; }
        public string Environment { get; }
        public string CommitSha { get; }
        public string BuildNumber { get; }

        private ServiceInfo(string version, string environment, string commitSha, string buildNumber)
        {
            Version = version;
            Environment = environment;
            CommitSha = commitSha;
            BuildNumber = buildNumber;
        }

        public static ServiceInfo From(IConfiguration configuration, IHostEnvironment environment)
        {
            var assemblyVersion = Assembly.GetEntryAssembly()?
                .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion
                ?? Assembly.GetEntryAssembly()?.GetName().Version?.ToString()
                ?? "0.0.0";

            // El InformationalVersion del SDK suele traer "+<commit>"; se recorta.
            var plus = assemblyVersion.IndexOf('+');
            if (plus > 0)
                assemblyVersion = assemblyVersion[..plus];

            return new ServiceInfo(
                version: Value(configuration, "Build:Version", assemblyVersion),
                environment: environment.EnvironmentName,
                commitSha: Value(configuration, "Build:CommitSha", "unknown"),
                buildNumber: Value(configuration, "Build:Number", "unknown"));
        }

        /// <summary>
        /// Toma el valor de configuración, tratando la cadena vacía como ausente:
        /// las claves están declaradas en appsettings.json con "" para documentarlas,
        /// y se completan por variable de entorno en el build (§29).
        /// </summary>
        private static string Value(IConfiguration configuration, string key, string fallback)
        {
            var value = configuration[key];
            return string.IsNullOrWhiteSpace(value) ? fallback : value;
        }
    }
}
