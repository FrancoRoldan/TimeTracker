# Unirse a una Compañía (Usuario Existente)

## Endpoint

**URL:** `POST /api/company/join`

**Autenticación:** ✅ Requerida (Bearer Token)

**Descripción:** Permite que un usuario autenticado se una a otra compañía adicional, manteniendo su cuenta existente.

## Request Body

```json
{
  "companyId": 2,            // ID de la compañía a unirse (requerido, > 0)
  "role": "Developer",       // Rol en la nueva compañía (requerido)
  "hourlyRate": 85.00        // Tarifa por hora en esta compañía (opcional, >= 0)
}
```

## Validaciones

### CompanyId
- ✅ Requerido
- ✅ Debe ser mayor a 0
- ✅ La compañía debe existir
- ✅ La compañía debe estar activa (`IsActive = true`)

### Role
- ✅ Requerido
- ✅ Valores válidos: `Admin`, `Manager`, `Developer`, `Viewer`
- ℹ️ Case-insensitive

### HourlyRate
- ⚠️ Opcional
- ✅ Si se proporciona, debe ser >= 0

## Headers Requeridos

```
Authorization: Bearer {tu_jwt_token}
Content-Type: application/json
```

## Response

### Success (200 OK)

```json
{
  "userId": 5,
  "userName": "Juan Pérez",
  "userEmail": "juan@acme.com",
  "companyId": 2,
  "companyName": "TechStart Solutions",
  "companyCode": "TECHSTART",
  "role": "Developer",
  "hourlyRate": 85.00,
  "message": "Successfully joined TechStart Solutions"
}
```

### Error Responses

#### 401 Unauthorized - Sin autenticación

```json
{
  "error": "User not authenticated"
}
```

#### 400 Bad Request - Ya es miembro

```json
{
  "error": "You are already a member of this company"
}
```

#### 400 Bad Request - Compañía no existe

```json
{
  "error": "Company not found"
}
```

#### 400 Bad Request - Compañía inactiva

```json
{
  "error": "Company is not active"
}
```

#### 400 Bad Request - Validación fallida

```json
{
  "error": "Validation failed",
  "errors": [
    "Role is required",
    "CompanyId must be greater than 0"
  ]
}
```

## Ejemplos de Uso

### Ejemplo 1: Usuario de ACME se une a TechStart

```bash
# 1. Primero hacer login como usuario de ACME
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@acme.com",
    "password": "Dev123!",
    "companyId": 1
  }'

# Respuesta:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "selectedCompanyId": 1
# }

# 2. Usar el token para unirse a otra compañía
curl -X POST http://localhost:5000/api/company/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "companyId": 2,
    "role": "Developer",
    "hourlyRate": 85.00
  }'
```

### Ejemplo 2: Unirse sin especificar tarifa

```bash
curl -X POST http://localhost:5000/api/company/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "companyId": 2,
    "role": "Manager"
  }'
```

### Ejemplo 3: Unirse como Admin

```bash
curl -X POST http://localhost:5000/api/company/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "companyId": 3,
    "role": "Admin",
    "hourlyRate": 150.00
  }'
```

## Flujo Completo de Multi-Compañía

### Escenario: Alice trabaja para ACME y quiere unirse a TechStart

1. **Alice ya tiene cuenta en ACME**
   - Email: alice@acme.com
   - CompanyId: 1 (ACME)
   - Role: Developer

2. **Alice se une a TechStart**
   ```bash
   POST /api/company/join
   {
     "companyId": 2,
     "role": "Manager",
     "hourlyRate": 120.00
   }
   ```

3. **Ahora Alice pertenece a 2 compañías**
   - ACME (Developer, $80/hr)
   - TechStart (Manager, $120/hr)

4. **Al hacer login, Alice puede elegir con qué compañía trabajar**
   ```bash
   POST /api/auth/login
   {
     "email": "alice@acme.com",
     "password": "Dev123!",
     "companyId": 2  // Selecciona TechStart
   }
   ```

5. **El JWT generado incluirá**
   - CompanyId: 2 (TechStart)
   - Role: Manager (rol en TechStart)
   - Todas las queries filtrarán por TechStart automáticamente

## Proceso Interno

1. ✅ Valida el request con FluentValidation
2. ✅ Extrae el userId del JWT actual (TenantService)
3. ✅ Verifica que la compañía existe y está activa
4. ✅ Verifica que el usuario no sea ya miembro
5. ✅ Crea la asociación en `UserCompanies` con el rol y tarifa especificados
6. ✅ Todo en una transacción (rollback automático si falla)
7. ✅ Retorna información completa de la membresía

## Diferencias con Registro Normal

| Aspecto | Registro (`/api/auth/register`) | Unirse (`/api/company/join`) |
|---------|--------------------------------|------------------------------|
| Usuario | Crea nuevo usuario | Usa usuario existente |
| Autenticación | No requerida | ✅ Requerida |
| Email | Debe ser único | Ya existe |
| Password | Se pide | No se pide |
| Usuario actual | N/A | Del JWT token |

## Casos de Uso

### 1. Freelancer trabajando para múltiples clientes
```bash
# María es freelancer
# Se registra en CompanyA
POST /api/auth/register { email: "maria@freelance.com", companyId: 1 }

# Cliente B la contrata, se une a CompanyB
POST /api/company/join { companyId: 2, role: "Developer" }

# Cliente C la contrata, se une a CompanyC
POST /api/company/join { companyId: 3, role: "Developer" }

# Ahora tiene 3 membresías con diferentes tarifas
```

### 2. Empleado que cambia de rol en diferentes compañías
```bash
# Juan es Developer en ACME
# Es promovido a Manager en otra subsidiaria
POST /api/company/join { companyId: 5, role: "Manager", hourlyRate: 150 }
```

### 3. Consultor con diferentes responsabilidades
```bash
# Pedro es Admin en su propia consultora
# Es Developer para un cliente
POST /api/company/join { companyId: 7, role: "Developer" }
# Es Manager para otro cliente
POST /api/company/join { companyId: 8, role: "Manager" }
```

## Seguridad

- 🔒 Requiere autenticación válida (JWT)
- 🔒 El usuario se extrae del token (no puede unirse a nombre de otro)
- 🔒 Solo puede unirse a compañías activas
- 🔒 No puede unirse 2 veces a la misma compañía
- 🔒 Transaccional: rollback si falla cualquier paso
- 🔒 El rol puede ser diferente en cada compañía

## Notas Importantes

1. **Multi-Tenant Isolation**: Cada sesión (login) trabaja con UNA compañía a la vez, determinada por el JWT.

2. **Cambiar de Compañía**: Para cambiar de contexto, el usuario debe hacer logout/login seleccionando otra compañía.

3. **Roles Diferentes**: Un usuario puede ser Admin en CompanyA y Developer en CompanyB.

4. **Tarifas Diferentes**: Cada membresía puede tener su propia `hourlyRate`.

5. **Time Tracking**: Los time entries siempre se asocian a la compañía activa en el JWT.

6. **Reportes**: Solo verá datos de la compañía activa en su sesión actual.

## Relación con otros Endpoints

### Ver mis compañías
Al hacer login, el response incluye todas las compañías del usuario:
```json
{
  "token": "...",
  "companies": [
    { "companyId": 1, "companyName": "ACME", "role": "Developer" },
    { "companyId": 2, "companyName": "TechStart", "role": "Manager" }
  ]
}
```

### Agregar usuario existente (Admin)
Si eres Admin, puedes agregar usuarios existentes:
```bash
POST /api/company/{companyId}/users
{
  "userId": 5,
  "role": "Developer",
  "hourlyRate": 90
}
```

La diferencia es:
- `/company/join`: El usuario se une a sí mismo
- `/company/{id}/users`: Un admin agrega a otro usuario

## Testing con Datos del Seeder

Usuarios creados por el seeder:
- `alice@acme.com` (CompanyId: 1)
- `john@acme.com` (CompanyId: 1)
- `carol@techstart.com` (CompanyId: 2)
- `bob@techstart.com` (CompanyId: 2)

Puedes probar que Alice se una a TechStart:
```bash
# Login como Alice
POST /api/auth/login { "email": "alice@acme.com", "password": "Dev123!" }

# Alice se une a TechStart
POST /api/company/join { "companyId": 2, "role": "Developer" }

# Ahora Alice puede trabajar para ambas compañías
```
