# Runbook — "un usuario reporta que algo no funciona"

Cómo pasar de *"no puedo crear una entrada de tiempo"* a saber **quién**, **cuándo**,
**qué estaba haciendo** y **de quién es la culpa**: de su conexión, de la API o de la
base de datos.

Todo se hace en Grafana (`http://localhost:3000`), dashboard
**TimeTracker — Negocio y Frontend**. El recorrido está verificado sobre un
incidente real reproducido.

---

## Antes de empezar

Pedile al usuario **la hora aproximada** y **la pantalla** donde falló. Con eso
alcanza: no hace falta que sepa nada técnico ni que reproduzca el error.

Ajustá el selector de tiempo de Grafana a esa franja, con margen de unos minutos.

---

## Paso 1 — Encontrar el error que el usuario vio

Panel **"Errores que vio el usuario — punto de partida de soporte"**.

Si sabés la pantalla, escribila en la variable **Ruta**: `/time-entry`.

Vas a ver algo así:

```
18:12:45   Error de API visto por el navegador: POST /time-entry respondió 500
           en 16500 ms  [session=sesion-soporte browserTraceId=77a7b558303cb31f...]
```

Abriendo el detalle de la línea, los tres identificadores aparecen como **enlaces**:

| Campo | Enlace | Adónde lleva |
| --- | --- | --- |
| `SessionId` | *Ver recorrido de la sesión* | Paso 2: qué venía haciendo el usuario |
| `BrowserTraceId` | *Ver traza del navegador* | Paso 3: qué pasó en el servidor |
| `TraceId` | *Ver traza* | La traza de esa petición en Tempo |

No hace falta copiar y pegar nada: es un clic por paso.

> Este panel muestra tanto los errores de JavaScript como los de API. Los de API
> se registran con nivel *Warning*, no *Error*: son fallos del servidor, no de la
> aplicación web, y son los que aparecen cuando alguien dice "no me guarda".

---

## Paso 2 — Qué estaba haciendo (el "qué hizo antes")

Copiá el `SessionId` y pegalo en la variable **Sesión**. El panel
**"Recorrido de una sesión"** muestra el camino completo:

```
18:12:38   page_view          /dashboard     {"from":"/auth/login"}
18:12:38   page_view          /time-entry    {"from":"/dashboard"}
18:12:45   ERROR API 500      /time-entry    (16500 ms)
```

Acá ya sabés **a qué hora**, **desde dónde venía** y **en qué paso exacto** se rompió.
Si hubiera cambiado de empresa, iniciado un timer o abierto un reporte antes, también
aparecería.

---

## Paso 3 — De quién es la culpa

Copiá el `BrowserTraceId` y buscalo en **Explore → Loki**:

```logql
{service_name="timetracker-api"} |= "77a7b558303cb31f647c904bc848358a"
```

Acá está el diagnóstico. **Tres desenlaces posibles, y se distinguen sin ambigüedad:**

### A) No aparece ningún log del servidor

La petición **nunca llegó**. Es la conexión del usuario.

Se confirma porque el navegador reporta `statusCode=0` y una duración larga
(típicamente el timeout). El mensaje que vio fue *"Error de conexión. Verifique su
conexión a internet."*

**Acción:** no hay nada que arreglar del lado del sistema.

### B) Hay logs del servidor y el fallo es de conexión a la base

Fue la **base de datos**. Hay dos firmas posibles, según cómo se haya caído:

```text
Failed executing DbCommand              el motor rechazó o cortó la conexión
SocketException: Name does not resolve  el contenedor está detenido, así que
                                        Docker le quitó la entrada de DNS y ni
                                        siquiera se llega a intentar conectar
```

Ejemplo real, del segundo caso:

```
[Error] An error occurred using the connection to database
        RequestPath = /api/time/manual
        user.id = 5      tenant.id = 3      user.role = Admin

[Error] An exception occurred while iterating over the results of a query
        System.Net.Sockets.SocketException: Name does not resolve
           at System.Net.Dns.GetHostEntryOrAddressesCore(...)

[Error] HTTP POST /api/time/manual responded 500 in 4497 ms
```

Fijate que acá aparece **`user.id`**: ya sabés exactamente qué usuario era, sin
haberlo preguntado.

**Para confirmar que fue algo momentáneo**, mirá en el dashboard *API Overview* el
panel **Pool de conexiones Npgsql** en esa franja horaria: si se cortó, la base
estuvo caída. Otra comprobación rápida desde la terminal:

```bash
docker ps --filter name=postgres --format '{{.Status}}'
```

Un `Up 4 minutes` cuando el incidente fue hace veinte confirma que el contenedor
se reinició en el medio. También sirve el panel **Respuestas por código de estado**: si hubo un
pico de 500 que afectó a varios endpoints a la vez, no fue un problema de ese usuario.

### C) Hay logs del servidor y la excepción NO menciona la base

Es un **bug de la API**. La excepción y su stack están en el mismo log.

**Acción:** con el `traceId` podés además abrir la traza en Tempo y ver el árbol
completo —qué llamó a qué y cuánto tardó cada parte— para localizar el punto exacto.

---

## Paso 4 — ¿Llegó a modificarse algo?

Si la operación pudo haber dejado datos a medias, buscá en el dashboard
**TimeTracker — Auditoría**, filtrando por el mismo `TraceId`. Si no hay registro,
no se escribió nada.

---

## Resumen del recorrido

```
"no puedo crear una entrada de tiempo"
        │
        ▼
Paso 1  Panel de errores del usuario, filtrando por ruta y hora
        └─ SessionId + BrowserTraceId
        │
        ├─▶ Paso 2  SessionId  →  qué venía haciendo, a qué hora
        │
        └─▶ Paso 3  TraceId    →  logs del servidor
                    │
                    ├─ sin logs            → su conexión
                    ├─ con DbCommand       → la base de datos
                    └─ con otra excepción  → bug de la API
                    │
                    └─▶ Paso 4  Auditoría por TraceId → ¿se modificó algo?
```

---

## Limitación conocida

**No se puede buscar por usuario.** La telemetría del navegador viaja con
`sessionId` y `anonymousId`, no con el id del usuario: es la decisión de §19 del
plan de observabilidad, que reserva la identidad para los mecanismos de
autenticación. El `user.id` aparece recién en el Paso 3, en los logs del servidor.

En la práctica esto significa que el punto de entrada es **hora + pantalla**, no el
nombre de la persona. Para el volumen de esta aplicación alcanza, pero si soporte
empieza a necesitar buscar por usuario, la solución es agregar el `userId` a los
eventos de telemetría del frontend una vez autenticado.

---

## Ruido conocido que conviene no perseguir

```text
404 en GET /api/time/active     No hay timer corriendo. Es un estado válido del
                                dominio, no un error. Aparece en cada carga del
                                dashboard.
```

En cambio un **403** sí merece mirarse: significa que alguien intentó operar sobre
una empresa que no le corresponde (§27).
