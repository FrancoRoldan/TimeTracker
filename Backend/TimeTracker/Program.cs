using Core.Helpers;
using Core.Security;
using Core.Services;
using Core.Services.Companies;
using Core.Services.Issues;
using Core.Services.Projects;
using Core.Services.Reports;
using Core.Services.Telemetry;
using Core.Services.Tenant;
using Core.Services.TimeTracking;
using Data.Context;
using Data.Interceptors;
using Data.Interfaces;
using Data.Repositorys;
using Data.UnitOfWork;
using Data.Validators;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Serilog;
using System.Text;
using System.Text.Json;
using TimeTracker.Middleware;
using TimeTracker.Observability;

var builder = WebApplication.CreateBuilder(args);

// --- Observabilidad (Fase 2 del plan) ---------------------------------------
// Se configura primero para que los errores de arranque también queden estructurados.
var serviceInfo = ServiceInfo.From(builder.Configuration, builder.Environment);
builder.ConfigureSerilog(serviceInfo);
builder.Services.AddObservability(builder.Configuration, serviceInfo);
builder.Services.AddTelemetryRateLimiting();

// Add services to the container.

// CORS: los orígenes permitidos se configuran en Cors:AllowedOrigins.
// Si la lista está vacía se cae a una política permisiva SOLO fuera de producción,
// para no romper el desarrollo local. En producción una lista vacía es un error de
// configuración y la aplicación no arranca: es preferible fallar al inicio que
// quedar con la API abierta a cualquier origen.
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

if (allowedOrigins.Length == 0 && builder.Environment.IsProduction())
{
    throw new InvalidOperationException(
        "Cors:AllowedOrigins no está configurado. Defina los orígenes permitidos " +
        "(por ejemplo Cors__AllowedOrigins__0=https://timetracker.midominio.com).");
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else
        {
            // Solo Development/Staging.
            policy.SetIsOriginAllowed(_ => true)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var cnnString = builder.Configuration.GetConnectionString("DbConnString");


builder.Services.AddScoped<AuditSaveChangesInterceptor>();

builder.Services.AddDbContext<AppDbContext>((serviceProvider, options) =>
    options
        .UseNpgsql(cnnString)
        .AddInterceptors(serviceProvider.GetRequiredService<AuditSaveChangesInterceptor>()));


// Add HttpContextAccessor for tenant service
builder.Services.AddHttpContextAccessor();

// Add FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<CreateCompanyRequestValidator>();

// Core Infrastructure
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<ITenantService, TenantService>();

// La capa de datos necesita saber quién ejecuta la operación para estampar
// CreatedBy/UpdatedBy. Se reutiliza la misma instancia scoped de TenantService.
builder.Services.AddScoped<ICurrentUserAccessor>(sp =>
    (ICurrentUserAccessor)sp.GetRequiredService<ITenantService>());

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// Repositories (legacy - will be replaced by UnitOfWork)
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Business Services
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICompanyService, CompanyService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IIssueService, IssueService>();
builder.Services.AddScoped<ITimeTrackingService, TimeTrackingService>();
builder.Services.AddScoped<IReportingService, ReportingService>();
builder.Services.AddScoped<ITelemetryIngestionService, TelemetryIngestionService>();



builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme()
    {
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});


var app = builder.Build();

string seedDatabase = builder.Configuration.GetSection("SeedDatabase:Value").Value ?? "False";
bool seedData = false;
bool.TryParse(seedDatabase, out seedData);

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    dbContext.Database.EnsureCreated();

    if (AuditLogSchema.EnsureExists(dbContext))
        logger.LogInformation("Esquema verificado");
    else
        logger.LogWarning("No se pudo verificar la tabla de auditoría; los cambios no quedarán registrados");

    if (seedData)
    {
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        TimeTrackerSeeder.Seed(dbContext, passwordHasher);
        logger.LogInformation("Datos de ejemplo sembrados");
    }
}


// Configure the HTTP request pipeline.

// Primero de todo: cualquier excepción que escape de aquí abajo se convierte en
// ProblemDetails con traceId. Reemplaza los try/catch que había en los controllers.
app.UseExceptionHandling();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Log de acceso HTTP estructurado: una línea por request con método, ruta,
// status y duración, en lugar del logging por defecto de ASP.NET.
app.UseSerilogRequestLogging(options =>
{
    // Los health checks se excluyen: son ruido constante sin valor de diagnóstico.
    options.GetLevel = (httpContext, elapsed, ex) =>
        httpContext.Request.Path.StartsWithSegments("/health")
            ? Serilog.Events.LogEventLevel.Verbose
            : ex != null || httpContext.Response.StatusCode >= 500
                ? Serilog.Events.LogEventLevel.Error
                : Serilog.Events.LogEventLevel.Information;

    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);

        var endpoint = httpContext.GetEndpoint();
        if (endpoint is not null)
            diagnosticContext.Set("Endpoint", endpoint.DisplayName);
    };
});

app.UseCors("CorsPolicy");


app.UseRateLimiter();

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

// Después de la autenticación: necesita los claims para resolver tenant y usuario.
app.UseTenantContext();

app.MapControllers();


app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = _ => false, // liveness: solo comprueba que el proceso responde
    ResponseWriter = WriteHealthResponse
}).AllowAnonymous().WithTags("Health");

app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false,
    ResponseWriter = WriteHealthResponse
}).AllowAnonymous().WithTags("Health");

// readiness: verifica la conexión real a PostgreSQL.
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
    ResponseWriter = WriteHealthResponse
}).AllowAnonymous().WithTags("Health");


app.MapGet("/info", (ServiceInfo info) => Results.Ok(new
{
    application = info.Name,
    version = info.Version,
    commitSha = info.CommitSha,
    buildNumber = info.BuildNumber,
    environment = info.Environment
})).AllowAnonymous().WithTags("Health");

try
{
    Log.Information("Iniciando {ServiceName} {Version} en {Environment}",
        serviceInfo.Name, serviceInfo.Version, serviceInfo.Environment);
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "La aplicación terminó de forma inesperada");
    throw;
}
finally
{
    Log.CloseAndFlush();
}

static Task WriteHealthResponse(HttpContext context, HealthReport report)
{
    context.Response.ContentType = "application/json";

    return context.Response.WriteAsync(JsonSerializer.Serialize(new
    {
        status = report.Status.ToString(),
        timestamp = DateTime.UtcNow,
        durationMs = report.TotalDuration.TotalMilliseconds,
        checks = report.Entries.Select(e => new
        {
            name = e.Key,
            status = e.Value.Status.ToString(),
            durationMs = e.Value.Duration.TotalMilliseconds,
            error = e.Value.Exception?.Message
        })
    }));
}
