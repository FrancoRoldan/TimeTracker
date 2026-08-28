using System.Text.RegularExpressions;

namespace Core.Services.Telemetry
{
    /// <summary>
    /// Filtro de PII y secretos para la telemetría del frontend (§17 del plan).
    ///
    /// El navegador ya sanea antes de enviar, pero eso es una capa que se puede
    /// saltar: el endpoint es público y cualquiera puede postearle. Este es el
    /// control que sí se cumple siempre.
    ///
    /// Nunca deben almacenarse: tokens JWT, contraseñas, cabeceras Authorization,
    /// connection strings ni direcciones de correo.
    /// </summary>
    public static partial class TelemetrySanitizer
    {
        public const string Redacted = "[REDACTED]";

        /// <summary>
        /// Nombres de propiedad que se redactan enteros, sin mirar el valor.
        /// La comparación es por "contiene", en minúsculas.
        /// </summary>
        private static readonly string[] BlockedKeyFragments =
        {
            "password", "passwd", "pwd",
            "token", "jwt", "bearer",
            "authorization", "auth",
            "secret", "apikey", "api_key",
            "connectionstring", "connstring",
            "cookie", "session_token",
            "email", "mail",
            "creditcard", "card"
        };

        [GeneratedRegex(@"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]*",
            RegexOptions.None, 200)]
        private static partial Regex JwtRegex();

        [GeneratedRegex(@"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
            RegexOptions.None, 200)]
        private static partial Regex EmailRegex();

        [GeneratedRegex(@"(?i)\b(password|pwd|token|secret|apikey|api_key)\b\s*[=:]\s*[^\s&,;""']+",
            RegexOptions.None, 200)]
        private static partial Regex KeyValueSecretRegex();

        [GeneratedRegex(@"(?i)bearer\s+[A-Za-z0-9._~+/-]+=*",
            RegexOptions.None, 200)]
        private static partial Regex BearerRegex();

        /// <summary>
        /// Redacta secretos y PII dentro de un texto libre (mensaje de error, stack, URL).
        /// </summary>
        public static string? Scrub(string? value)
        {
            if (string.IsNullOrEmpty(value))
                return value;

            var result = JwtRegex().Replace(value, Redacted);
            result = BearerRegex().Replace(result, $"Bearer {Redacted}");
            result = KeyValueSecretRegex().Replace(result, Redacted);
            result = EmailRegex().Replace(result, Redacted);

            return result;
        }

        /// <summary>
        /// Indica si una propiedad debe descartarse por su nombre.
        /// </summary>
        public static bool IsBlockedKey(string key)
        {
            var lower = key.ToLowerInvariant();
            return BlockedKeyFragments.Any(fragment => lower.Contains(fragment));
        }

        /// <summary>
        /// Sanea un diccionario de propiedades: descarta las claves bloqueadas y
        /// limpia el contenido de las que quedan.
        /// </summary>
        public static Dictionary<string, string> ScrubProperties(
            IDictionary<string, string>? properties,
            int maxProperties)
        {
            var result = new Dictionary<string, string>();
            if (properties is null)
                return result;

            foreach (var (key, value) in properties)
            {
                if (result.Count >= maxProperties)
                    break;
                if (string.IsNullOrWhiteSpace(key) || IsBlockedKey(key))
                    continue;

                result[key] = Scrub(value) ?? string.Empty;
            }

            return result;
        }
    }
}
