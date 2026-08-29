using Data.Interfaces;
using Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Diagnostics;
using System.Text.Json;

namespace Data.Interceptors
{
    /// <summary>
    /// Escribe la auditoría de negocio a partir del ChangeTracker (§20 del plan).
    ///
    /// Se apoya en un interceptor y no en los servicios porque así ninguna operación
    /// se puede olvidar de auditar: todo lo que pase por SaveChanges queda registrado,
    /// venga de donde venga.
    ///
    /// Reglas que garantiza:
    ///  - No audita secretos: PasswordHash y compañía nunca se serializan.
    ///  - No se audita a sí misma.
    ///  - Registra el TraceId, que es lo que permite ir del cambio a la traza (§21).
    ///  - Un fallo escribiendo auditoría no puede tumbar la operación de negocio.
    ///
    /// Trabaja en dos fases porque la clave primaria de una entidad nueva se asigna
    /// recién al guardar: las modificaciones y las bajas se registran dentro de la
    /// misma transacción, y las altas se completan y persisten justo después, cuando
    /// ya se conoce su Id. Registrarlas antes dejaría EntityId en 0.
    ///
    /// Debe registrarse como servicio scoped: mantiene estado entre las dos fases.
    /// </summary>
    public class AuditSaveChangesInterceptor : SaveChangesInterceptor
    {
        public const string ApplicationName = "timetracker-api";

        /// <summary>
        /// Propiedades que nunca deben quedar registradas, ni en OldValues ni en NewValues.
        /// La comparación es por nombre exacto, sin distinguir mayúsculas.
        /// </summary>
        private static readonly HashSet<string> PropiedadesExcluidas = new(StringComparer.OrdinalIgnoreCase)
        {
            "PasswordHash", "Password", "Token", "RefreshToken", "Secret", "ApiKey"
        };

        /// <summary>
        /// Entidades cuyos cambios se auditan. Es una lista explícita, no "todo lo que
        /// herede de BaseEntity": auditar de más genera ruido y cuesta espacio.
        /// Corresponde a las acciones auditables de §20.3.
        /// </summary>
        private static readonly HashSet<string> EntidadesAuditadas = new(StringComparer.Ordinal)
        {
            nameof(Company), nameof(UserCompany), nameof(Project),
            nameof(Issue), nameof(TimeEntry), nameof(User)
        };

        private readonly ICurrentUserAccessor? _currentUser;

        /// <summary>Altas pendientes de conocer su Id definitivo.</summary>
        private readonly List<(AuditLog Registro, EntityEntry Entrada)> _altasPendientes = new();

        /// <summary>Evita que el guardado de la auditoría se audite o se reentre.</summary>
        private bool _guardandoAuditoria;

        public AuditSaveChangesInterceptor(ICurrentUserAccessor? currentUser = null)
        {
            _currentUser = currentUser;
        }

        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            if (eventData.Context is not null && !_guardandoAuditoria)
                RegistrarAuditoria(eventData.Context);

            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        public override InterceptionResult<int> SavingChanges(
            DbContextEventData eventData,
            InterceptionResult<int> result)
        {
            if (eventData.Context is not null && !_guardandoAuditoria)
                RegistrarAuditoria(eventData.Context);

            return base.SavingChanges(eventData, result);
        }

        public override async ValueTask<int> SavedChangesAsync(
            SaveChangesCompletedEventData eventData,
            int result,
            CancellationToken cancellationToken = default)
        {
            if (eventData.Context is not null && !_guardandoAuditoria && _altasPendientes.Count > 0)
            {
                var context = eventData.Context;
                CompletarAltasPendientes(context);

                _guardandoAuditoria = true;
                try
                {
                    await context.SaveChangesAsync(cancellationToken);
                }
                catch
                {
                    // La operación de negocio ya se guardó: perder el registro de
                    // auditoría no puede propagarse como un fallo al usuario.
                }
                finally
                {
                    _guardandoAuditoria = false;
                    _altasPendientes.Clear();
                }
            }

            return await base.SavedChangesAsync(eventData, result, cancellationToken);
        }

        public override int SavedChanges(SaveChangesCompletedEventData eventData, int result)
        {
            if (eventData.Context is not null && !_guardandoAuditoria && _altasPendientes.Count > 0)
            {
                var context = eventData.Context;
                CompletarAltasPendientes(context);

                _guardandoAuditoria = true;
                try
                {
                    context.SaveChanges();
                }
                catch
                {
                    // idem
                }
                finally
                {
                    _guardandoAuditoria = false;
                    _altasPendientes.Clear();
                }
            }

            return base.SavedChanges(eventData, result);
        }

        /// <summary>
        /// Ya se conocen las claves: se completan y se encolan para guardar.
        ///
        /// Los valores se vuelven a serializar acá y no en la primera fase porque
        /// hasta que EF no guarda, la clave de una entidad nueva es un temporal
        /// negativo (-2147482644 y similares) y quedaba así en el JSON.
        /// </summary>
        private void CompletarAltasPendientes(DbContext context)
        {
            foreach (var (registro, entrada) in _altasPendientes)
            {
                registro.EntityId = ObtenerClave(entrada);
                registro.NewValues = SerializarValoresActuales(entrada);
                context.Set<AuditLog>().Add(registro);
            }
        }

        /// <summary>Serializa los valores definitivos de una entidad recién guardada.</summary>
        private static string? SerializarValoresActuales(EntityEntry entry)
        {
            var valores = new Dictionary<string, object?>();

            foreach (var prop in entry.Properties)
            {
                if (PropiedadesExcluidas.Contains(prop.Metadata.Name))
                    continue;

                valores[prop.Metadata.Name] = prop.CurrentValue;
            }

            return valores.Count > 0 ? Serializar(valores) : null;
        }

        private void RegistrarAuditoria(DbContext context)
        {
            try
            {
                var userId = _currentUser?.GetUserId();
                var tenantId = _currentUser?.GetTenantId();
                var ip = _currentUser?.GetIpAddress();
                var traceId = Activity.Current?.TraceId.ToString();
                var ahora = DateTime.UtcNow;

                // Se materializa la lista antes de agregar nada: añadir entradas al
                // ChangeTracker mientras se lo recorre lanzaría una excepción.
                var candidatos = context.ChangeTracker.Entries()
                    .Where(e => e.Entity is not AuditLog
                             && EntidadesAuditadas.Contains(e.Metadata.ClrType.Name)
                             && e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
                    .ToList();

                _altasPendientes.Clear();

                foreach (var entry in candidatos)
                {
                    var registro = Construir(entry, userId, tenantId, ip, traceId, ahora);
                    if (registro is null)
                        continue;

                    if (entry.State == EntityState.Added)
                    {
                        // Su Id todavía no existe: se completa en SavedChanges.
                        _altasPendientes.Add((registro, entry));
                    }
                    else
                    {
                        context.Set<AuditLog>().Add(registro);
                    }
                }
            }
            catch
            {
                // La auditoría nunca puede hacer fallar la operación de negocio.
                // Si algo sale mal acá, se pierde el registro pero el cambio se guarda.
            }
        }

        private static AuditLog? Construir(
            EntityEntry entry,
            int? userId,
            int? tenantId,
            string? ip,
            string? traceId,
            DateTime ahora)
        {
            var anteriores = new Dictionary<string, object?>();
            var nuevos = new Dictionary<string, object?>();
            var columnasCambiadas = new List<string>();

            foreach (var prop in entry.Properties)
            {
                var nombre = prop.Metadata.Name;
                if (PropiedadesExcluidas.Contains(nombre))
                    continue;

                switch (entry.State)
                {
                    case EntityState.Added:
                        nuevos[nombre] = prop.CurrentValue;
                        break;

                    case EntityState.Deleted:
                        anteriores[nombre] = prop.OriginalValue;
                        break;

                    case EntityState.Modified when prop.IsModified &&
                                                   !Equals(prop.OriginalValue, prop.CurrentValue):
                        anteriores[nombre] = prop.OriginalValue;
                        nuevos[nombre] = prop.CurrentValue;
                        columnasCambiadas.Add(nombre);
                        break;
                }
            }

            // Un Modified sin cambios reales (o solo en campos excluidos) no se audita:
            // ensuciaría el registro con ruido.
            if (entry.State == EntityState.Modified && columnasCambiadas.Count == 0)
                return null;

            // El soft-delete se registra como baja, que es lo que significa para el negocio.
            var accion = entry.State switch
            {
                EntityState.Added => "Create",
                EntityState.Deleted => "Delete",
                _ => EsBajaLogica(entry) ? "Delete" : "Update"
            };

            return new AuditLog
            {
                Timestamp = ahora,
                UserId = userId,
                CompanyId = tenantId ?? ObtenerCompanyIdDeLaEntidad(entry),
                Action = accion,
                EntityType = entry.Metadata.ClrType.Name,
                EntityId = ObtenerClave(entry),
                OldValues = anteriores.Count > 0 ? Serializar(anteriores) : null,
                NewValues = nuevos.Count > 0 ? Serializar(nuevos) : null,
                ChangedColumns = columnasCambiadas.Count > 0 ? string.Join(",", columnasCambiadas) : null,
                TraceId = traceId,
                Application = ApplicationName,
                IpAddress = ip
            };
        }

        /// <summary>El repositorio implementa el borrado como IsDeleted = true.</summary>
        private static bool EsBajaLogica(EntityEntry entry)
        {
            var prop = entry.Properties.FirstOrDefault(p => p.Metadata.Name == nameof(BaseEntity.IsDeleted));
            return prop is not null && prop.IsModified && prop.CurrentValue is true;
        }

        private static int? ObtenerCompanyIdDeLaEntidad(EntityEntry entry)
        {
            var prop = entry.Properties.FirstOrDefault(p => p.Metadata.Name == nameof(BaseEntity.CompanyId));
            return prop?.CurrentValue as int?;
        }

        private static string ObtenerClave(EntityEntry entry)
        {
            var clave = entry.Metadata.FindPrimaryKey();
            if (clave is null)
                return string.Empty;

            var valores = clave.Properties
                .Select(p => entry.Property(p.Name).CurrentValue?.ToString() ?? string.Empty);

            return string.Join(",", valores);
        }

        private static readonly JsonSerializerOptions OpcionesJson = new()
        {
            WriteIndented = false
        };

        private static string Serializar(Dictionary<string, object?> valores) =>
            JsonSerializer.Serialize(valores, OpcionesJson);
    }
}
