namespace Data.Models
{
    /// <summary>
    /// Registro de auditoría de negocio (§20 del plan de observabilidad).
    ///
    /// Responde "quién cambió qué y cuándo", y se correlaciona con las trazas y los
    /// logs por <see cref="TraceId"/> (§21): desde un cambio se puede ir a ver qué
    /// ocurrió técnicamente durante esa operación, y al revés.
    ///
    /// No hereda de <see cref="BaseEntity"/> a propósito: no es una entidad de
    /// dominio, no se borra por soft-delete y no debe auditarse a sí misma.
    /// </summary>
    public class AuditLog
    {
        public long Id { get; set; }

        public DateTime Timestamp { get; set; }

        /// <summary>Usuario que ejecutó el cambio. Null en operaciones del sistema (seeder, migraciones).</summary>
        public int? UserId { get; set; }

        /// <summary>Empresa (tenant) sobre la que se ejecutó el cambio.</summary>
        public int? CompanyId { get; set; }

        /// <summary>Create | Update | Delete</summary>
        public string Action { get; set; } = string.Empty;

        /// <summary>Nombre de la entidad: Company, Project, Issue, TimeEntry, UserCompany, User.</summary>
        public string EntityType { get; set; } = string.Empty;

        /// <summary>Clave primaria de la entidad afectada.</summary>
        public string EntityId { get; set; } = string.Empty;

        /// <summary>Valores anteriores, en JSON. Null en altas.</summary>
        public string? OldValues { get; set; }

        /// <summary>Valores nuevos, en JSON. Null en bajas.</summary>
        public string? NewValues { get; set; }

        /// <summary>Nombres de las propiedades que efectivamente cambiaron.</summary>
        public string? ChangedColumns { get; set; }

        /// <summary>TraceId de W3C: el hilo que une auditoría, trazas y logs.</summary>
        public string? TraceId { get; set; }

        /// <summary>Aplicación emisora, para cuando haya más de un servicio escribiendo.</summary>
        public string Application { get; set; } = string.Empty;

        public string? IpAddress { get; set; }
    }
}
