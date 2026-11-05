# Instrucciones para GitHub Copilot: plataforma de adopción responsable de mascotas (SOA)

## Contexto

Examen 2 de Arquitectura Orientada a Servicios (UFPS Ocaña). Plataforma web para la Fundación Huellas de Esperanza, formada por **dos APIs independientes** (Mascotas y Adopciones) y un **frontend**, con PostgreSQL en Supabase y despliegue en la nube. Entrega: 9 de noviembre de 2026.

Lo que se evalúa es la **integración real** entre los servicios y un **proceso de adopción completo**: consultar una mascota, verificar su disponibilidad, registrar una solicitud, aprobarla o rechazarla y actualizar los estados. Una misma mascota nunca puede tener dos adopciones aprobadas.

## Reglas de trabajo

- Este archivo es la fuente de verdad. **No cambies rutas, campos, códigos de estado ni la estructura** sin que el usuario lo pida de forma explícita. No agregues endpoints que no estén aquí.
- Si algo es ambiguo, toma la opción más simple, déjala anotada en un comentario breve y continúa. No inventes funcionalidades fuera de alcance.
- Prioriza código simple y funcionando. Sin sobreingeniería: nada de Docker, colas, cachés, patrón repositorio, capas innecesarias ni `async` donde no haga falta.
- Trabaja en tareas pequeñas y deja el proyecto ejecutable después de cada una.
- Comentarios, mensajes de error y textos de la interfaz en **español**. Los identificadores (variables, funciones, rutas, campos) se escriben exactamente como en este archivo.
- Nunca escribas secretos en el código ni en archivos versionados.

## Stack

- **Backend (ambas APIs):** Python 3.12, FastAPI, Pydantic v2 (`pydantic-settings`, `pydantic[email]`), SQLAlchemy 2.x síncrono con estilo moderno (`Mapped`, `mapped_column`), driver `psycopg` 3 (URL `postgresql+psycopg://`), `httpx` para llamadas entre servicios, `uvicorn`.
- **Pruebas:** `pytest`, `httpx`, `respx` (mocks de HTTP).
- **Frontend:** React + Vite + Tailwind CSS, React Router, `fetch` nativo, JavaScript (sin TypeScript). No agregues librerías adicionales sin pedirlo.
- **Base de datos:** Supabase (PostgreSQL). Conexión directa con la cadena del pooler. No uses `supabase-py` ni la Data API.

## Estructura del repositorio (monorepo)

```
.github/copilot-instructions.md
.gitignore
README.md
db/            schema.sql, seed.sql
docs/          arquitectura/, evidencias/
mascotas-api/
  app/         __init__.py, main.py, config.py, database.py, models.py, schemas.py, security.py
               routers/__init__.py, routers/mascotas.py
  tests/
  requirements.txt, .env.example
adopciones-api/
  app/         __init__.py, main.py, config.py, database.py, models.py, schemas.py, security.py
               routers/__init__.py, routers/solicitudes.py
               clients/__init__.py, clients/mascotas_client.py
  tests/
  requirements.txt, .env.example
frontend/      (proyecto Vite)
```

Puertos locales: API Mascotas **8001**, API Adopciones **8002**, frontend 5173.

## Reglas de arquitectura (SOA)

- Cada API es **autónoma**: no importes código de la otra, no compartas módulos, no hagas consultas entre esquemas ni llaves foráneas entre servicios.
- Los servicios se comunican **solo por HTTP/REST con JSON**. Adopciones llama a Mascotas únicamente a través de `app/clients/mascotas_client.py`.
- **Mascotas** es la única que escribe en el esquema `svc_mascotas`. **Adopciones** es la única que escribe en `svc_adopciones`.
- Las APIs no guardan estado de sesión: cada petición trae todo lo necesario.
- Las tablas se crean con `db/schema.sql` en Supabase. **No uses `create_all`.** Los modelos SQLAlchemy usan `__table_args__ = {'schema': 'svc_mascotas'}` (o `svc_adopciones`).

## Modelo de datos

### Esquema `svc_mascotas`, tabla `mascotas`

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | uuid | PK, `default gen_random_uuid()` |
| `nombre` | text | not null |
| `especie` | text | not null, check en `perro`, `gato`, `otro` |
| `raza` | text | opcional |
| `sexo` | text | opcional, check en `macho`, `hembra` |
| `edad_meses` | int | opcional, check `>= 0` |
| `tamano` | text | opcional, check en `pequeno`, `mediano`, `grande` |
| `descripcion` | text | opcional |
| `foto_url` | text | opcional |
| `estado` | text | not null, default `disponible`, check en `disponible`, `adoptada` |
| `created_at`, `updated_at` | timestamptz | not null, default `now()` |

Índice: `(estado, especie)`.

### Esquema `svc_adopciones`, tabla `solicitudes`

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | uuid | PK, `default gen_random_uuid()` |
| `mascota_id` | uuid | not null. **Referencia lógica, sin FK** (pertenece a otro servicio) |
| `nombre_solicitante` | text | not null |
| `documento` | text | not null |
| `email` | text | not null |
| `telefono`, `direccion` | text | opcionales |
| `tipo_vivienda` | text | opcional, check en `casa`, `apartamento`, `finca` |
| `motivo` | text | not null |
| `estado` | text | not null, default `pendiente`, check en `pendiente`, `aprobada`, `rechazada` |
| `motivo_decision` | text | opcional |
| `created_at` | timestamptz | not null, default `now()` |
| `decided_at` | timestamptz | opcional |

Índices:

- **Único parcial** `uq_una_aprobada_por_mascota` sobre `(mascota_id)` donde `estado = 'aprobada'`. Garantiza una sola adopción aprobada por mascota.
- **Único parcial** `uq_pendiente_por_persona` sobre `(mascota_id, documento)` donde `estado = 'pendiente'`. Evita solicitudes pendientes duplicadas.
- Índice normal sobre `(estado)`.

## Convenciones de la API

- JSON en `snake_case`; ids UUID; fechas ISO 8601 en UTC.
- Errores con `HTTPException`, que produce `{'detail': '...'}`.
- Códigos: 200, 201, 204, **401** (clave ausente o inválida), **404** (no existe), **409** (conflicto de negocio), **422** (validación), **503** (el otro servicio no responde).
- Paginación en listados: `limit` (por defecto 20, máximo 100) y `offset`. Los listados devuelven un arreglo JSON.
- Sin prefijo de versión en las rutas.

## Contrato de la API Mascotas

| Método | Ruta | Acceso | Descripción | Respuestas |
|---|---|---|---|---|
| GET | `/health` | Público | Estado del servicio | 200 |
| GET | `/mascotas` | Público | Filtros `estado`, `especie`, `q` (busca en nombre y raza, sin distinguir mayúsculas), `limit`, `offset` | 200 |
| GET | `/mascotas/{id}` | Público | Detalle | 200, 404 |
| GET | `/mascotas/{id}/disponibilidad` | Público | Devuelve `{id, estado, disponible}` con `disponible = (estado == 'disponible')` | 200, 404 |
| POST | `/mascotas` | Admin | Crea la mascota (siempre nace `disponible`) | 201, 401, 422 |
| PUT | `/mascotas/{id}` | Admin | Edita datos; **no** cambia el estado | 200, 401, 404, 422 |
| DELETE | `/mascotas/{id}` | Admin | Elimina; 409 si está `adoptada` | 204, 401, 404, 409 |
| PATCH | `/mascotas/{id}/estado` | Admin o servicio | Cuerpo `{'estado': 'disponible' | 'adoptada'}`. **Idempotente** | 200, 401, 404, 422 |

Esquemas: `MascotaIn` (nombre, especie, raza, sexo, edad_meses, tamano, descripcion, foto_url), `MascotaOut` (lo anterior más `id`, `estado`, `created_at`, `updated_at`), `EstadoIn` (`estado` con valores permitidos). Actualiza `updated_at` en cada modificación.

## Contrato de la API Adopciones

| Método | Ruta | Acceso | Descripción | Respuestas |
|---|---|---|---|---|
| GET | `/health` | Público | Estado del servicio | 200 |
| POST | `/solicitudes` | Público | Registra la solicitud tras verificar disponibilidad en Mascotas | 201, 404, 409, 422, 503 |
| GET | `/solicitudes` | Admin | Filtros `estado`, `mascota_id`, `limit`, `offset` | 200, 401 |
| GET | `/solicitudes/seguimiento?documento=` | Público | Lista de `{id, mascota_id, estado, created_at, motivo_decision}` de esa persona | 200 |
| GET | `/solicitudes/{id}` | Admin | Detalle | 200, 401, 404 |
| PATCH | `/solicitudes/{id}/aprobar` | Admin | Aprueba y marca la mascota como adoptada | 200, 401, 404, 409, 503 |
| PATCH | `/solicitudes/{id}/rechazar` | Admin | Cuerpo `{'motivo_decision': '...'}` | 200, 401, 404, 409 |

**Importante:** declara `/solicitudes/seguimiento` **antes** que `/solicitudes/{solicitud_id}` para que FastAPI no la confunda con un id.

`SolicitudIn`: `mascota_id` (UUID), `nombre_solicitante` (mínimo 3 caracteres), `documento` (mínimo 5), `email` (`EmailStr`), `telefono`, `direccion`, `tipo_vivienda`, `motivo` (**mínimo 20 caracteres**). Máquina de estados: `pendiente` pasa a `aprobada` o `rechazada`; cualquier otra transición responde 409.

## Reglas de negocio

### Crear solicitud (`POST /solicitudes`)

1. Consultar `GET /mascotas/{mascota_id}/disponibilidad` en la API Mascotas.
2. Si la mascota no existe, responder 404. Si `disponible` es falso, responder 409.
3. Guardar la solicitud como `pendiente`. Si el índice único parcial se viola, hacer rollback y responder 409 (solicitud pendiente duplicada).

### Aprobar solicitud (`PATCH /solicitudes/{id}/aprobar`), en este orden exacto

1. Leer la solicitud con `SELECT ... FOR UPDATE` (`with_for_update()`). Si no existe, 404. Si no está `pendiente`, 409.
2. Consultar la disponibilidad en Mascotas. Si no está disponible, 409.
3. Marcar la solicitud como `aprobada`, asignar `decided_at` y hacer `db.flush()`. Si salta `IntegrityError` (índice único), hacer rollback y responder 409.
4. En la misma transacción, marcar como `rechazada` las demás solicitudes `pendiente` de esa mascota, con `motivo_decision = 'La mascota fue adoptada por otra solicitud'`.
5. Llamar a `PATCH /mascotas/{id}/estado` con `adoptada`.
6. Si el paso 5 funciona, `commit`. Si falla, `rollback` y responder 503 (la solicitud sigue `pendiente`).

### Rechazar solicitud

Bloquear la fila, exigir `pendiente` (si no, 409), guardar `estado = 'rechazada'`, `motivo_decision` y `decided_at`, y hacer commit. **No** llama a Mascotas: la mascota sigue disponible.

### Cliente HTTP hacia Mascotas (`mascotas_client.py`)

- Funciones `obtener_disponibilidad(mascota_id)` y `marcar_adoptada(mascota_id)` con `httpx`, URL base desde `MASCOTAS_API_URL`, cabecera `X-Service-Key`.
- Timeout de 15 s (5 s para conectar), porque el servicio puede estar 'dormido' en la nube.
- Errores de red o respuestas inesperadas se traducen a `HTTPException(503)`; un 404 de Mascotas se traduce a 404.

## Seguridad

- **Admin:** cabecera `X-API-Key` comparada con `ADMIN_API_KEY`. **Servicio:** cabecera `X-Service-Key` comparada con `SERVICE_KEY`.
- Usa `fastapi.security.APIKeyHeader(auto_error=False)` para que Swagger muestre el botón *Authorize*, y compara con `secrets.compare_digest`.
- Endpoints de admin: crear, editar y eliminar mascotas; listar y ver solicitudes; aprobar y rechazar. `PATCH /mascotas/{id}/estado` acepta la clave de admin **o** la de servicio.
- Endpoints públicos: `/health`, consultas de mascotas, `POST /solicitudes` y `/solicitudes/seguimiento`.
- CORS: orígenes desde `CORS_ORIGINS` (separados por coma), `allow_headers=['*']`.

## Configuración (variables de entorno)

| Variable | Mascotas | Adopciones | Frontend |
|---|---|---|---|
| `DATABASE_URL` (`postgresql+psycopg://...`) | Sí | Sí | No |
| `ADMIN_API_KEY` | Sí | Sí | No |
| `SERVICE_KEY` (el mismo valor en ambas) | Sí | Sí | No |
| `MASCOTAS_API_URL` | No | Sí | No |
| `CORS_ORIGINS` (por defecto `*` en local) | Sí | Sí | No |
| `DEBUG_ENABLED` (por defecto `false`) | Sí | Sí | No |
| `VITE_API_MASCOTAS_URL`, `VITE_API_ADOPCIONES_URL` | No | No | Sí |

Usa `pydantic-settings` en `app/config.py`. Entrega un `.env.example` por servicio con todas las variables **sin valores reales**. `.env` nunca se sube al repositorio.

## Convenciones de código

- Un router por servicio, con `tags` y prefijo. Los modelos van en `models.py`, los esquemas Pydantic en `schemas.py`, la sesión en `database.py` (`get_db` con `yield`).
- Engine con `pool_pre_ping=True`, `pool_size=3`, `max_overflow=2`.
- Funciones cortas, nombres claros, sin código muerto ni comentarios obvios.
- **Swagger:** cada endpoint con `summary`, `response_model`, `tags` y `responses` para los errores 401, 404, 409 y 503 que apliquen; ejemplos con `Field(examples=[...])`. Títulos y descripciones de la API en español.
- Expón `GET /health` que devuelva `{'status': 'ok', 'service': 'mascotas'}` (o `'adopciones'`).

## Pruebas

- `pytest` en `tests/` de cada API. En Adopciones, simula la API Mascotas con `respx`.
- Pruebas de integración (`adopciones-api/tests/test_integracion.py`) contra las URLs desplegadas, leídas de variables de entorno. Cada prueba crea sus propios datos.
- Casos mínimos: crear mascota; solicitud válida (201); mascota inexistente (404); solicitud duplicada (409); aprobar (solicitud aprobada y mascota `adoptada`); rechazo automático de las otras pendientes; segunda aprobación de la misma mascota (409); solicitud sobre mascota adoptada (409); rechazar (la mascota sigue disponible); dos aprobaciones simultáneas (una 200 y otra 409); operaciones de admin sin clave (401); Mascotas caída (503).

## Frontend

| Ruta | Función |
|---|---|
| `/` | Catálogo en tarjetas con filtro por especie y búsqueda por nombre; por defecto solo mascotas `disponible` |
| `/mascotas/:id` | Detalle y botón «Solicitar adopción» (oculto si está adoptada) |
| `/solicitar/:id` | Formulario con validación; mensajes claros para 404, 409 y 503 |
| `/seguimiento` | Consulta por documento del estado de las solicitudes |
| `/admin` | Pide la API key (guardada en `sessionStorage`); pestañas Mascotas (crear, editar, eliminar) y Solicitudes (filtrar, aprobar, rechazar con motivo) |

- Un único `src/api.js` con las funciones base para cada API, leyendo las URLs de `VITE_API_MASCOTAS_URL` y `VITE_API_ADOPCIONES_URL`. Todas las llamadas pasan por ese archivo.
- Estados de carga y de error en cada vista. Diseño responsivo con Tailwind. Si una petición tarda más de 8 s, mostrar el aviso «El servidor está despertando, intenta de nuevo».
- No uses `localStorage` para datos de negocio.

## Modo debug (deseable; solo después de que el flujo base funcione)

Un interruptor **Modo debug** (o `?debug=1`) divide la pantalla: la aplicación a la izquierda y el panel **Flujo en vivo** a la derecha (apilados en pantallas angostas).

- El frontend usa `tracedFetch(servicio, url, opciones, accion)`: genera un `X-Trace-Id` por acción del usuario, mide la duración, enmascara las API keys y registra petición y respuesta.
- Cada API tiene `app/debug.py` con un middleware que lee `X-Trace-Id`, una función `step(mensaje, **datos)` que guarda eventos en memoria (`deque` con `maxlen=1000`) y el endpoint `GET /debug/trace/{trace_id}`.
- Todo funciona **solo con `DEBUG_ENABLED=true`** (apagado por defecto). Enmascara `documento` y `email` en los datos de los pasos.
- Adopciones reenvía `X-Trace-Id` a Mascotas y llama a `step()` en cada paso de aprobar.
- El panel agrupa los eventos por acción, con insignias por actor (Frontend, Adopciones, Mascotas, BD), errores en rojo, **Paso a paso**, **Pausar**, **Limpiar** y **Exportar JSON**.
- Con el modo apagado, la app se comporta exactamente igual y no se hacen llamadas a `/debug`.

## Git

- Commits convencionales en español o inglés: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.
- Nunca subas `.env`, claves ni cadenas de conexión. `.gitignore` incluye `.env`, `.venv`, `__pycache__`, `.pytest_cache`, `node_modules` y `dist`.

## Fuera de alcance (no lo implementes)

Registro o login de usuarios finales, subida de imágenes (se usa `foto_url`), correos de notificación, devolución de mascotas adoptadas, pagos, Docker, migraciones con Alembic y cualquier endpoint no listado.
