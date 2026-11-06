# Guía de Pruebas - API Adopciones

## Flujo Completo de Adopción en Swagger

Siga estos pasos para probar el flujo completo en la interfaz de Swagger:

### 1. Iniciar las APIs localmente

En dos terminales separadas, inicie ambas APIs:

**Terminal 1 - API Mascotas (Puerto 8001):**
```bash
cd C:\Users\jhoja\WorkSpace\PetAdoption\mascotas-api
.\..\\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - API Adopciones (Puerto 8002):**
```bash
cd C:\Users\jhoja\WorkSpace\PetAdoption\adopciones-api
.\..\\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
```

### 2. Acceder a la documentación Swagger

- **API Adopciones:** http://localhost:8002/docs
- **API Mascotas:** http://localhost:8001/docs

### 3. Flujo de Prueba Recomendado

#### Paso A: Crear una mascota en Mascotas (solo si necesitas una nueva)

1. En Swagger de Mascotas, ve a `POST /mascotas`
2. Haz clic en "Authorize" arriba a la derecha
3. Ingresa `X-API-Key: <valor_de_ADMIN_API_KEY_del_.env>`
4. Completa el cuerpo de la solicitud:
   ```json
   {
     "nombre": "Luna",
     "especie": "perro",
     "raza": "Criollo",
     "sexo": "hembra",
     "edad_meses": 18,
     "tamano": "mediano",
     "descripcion": "Cariñosa y juguetona.",
     "foto_url": "https://ejemplo.com/luna.jpg"
   }
   ```
5. Ejecuta. Toma nota del `id` devuelto (será algo como `f47ac10b-58cc-4372-a567-0e02b2c3d479`)

#### Paso B: Crear una solicitud de adopción (PÚBLICO - sin autenticación)

1. En Swagger de Adopciones, ve a `POST /solicitudes`
2. Completa el cuerpo (usa el ID de la mascota del Paso A):
   ```json
   {
     "mascota_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
     "nombre_solicitante": "Juan García López",
     "documento": "1234567890",
     "email": "juan@example.com",
     "telefono": "3001234567",
     "direccion": "Calle 123 #45",
     "tipo_vivienda": "casa",
     "motivo": "Deseo adoptar una mascota que acompañe a mi familia en el hogar con mucho amor y cuidado."
   }
   ```
3. Ejecuta. Toma nota del `id` devuelto.
4. Observa que `estado` es `"pendiente"`

#### Paso C: Consultar seguimiento (PÚBLICO)

1. Ve a `GET /solicitudes/seguimiento`
2. Ingresa `documento=1234567890` como parámetro
3. Ejecuta. Debes ver la solicitud creada en el paso B

#### Paso D: Listar solicitudes (ADMIN - requiere autenticación)

1. Ve a `GET /solicitudes`
2. Haz clic en "Authorize" arriba a la derecha
3. Ingresa `X-API-Key: <valor_de_ADMIN_API_KEY_del_.env>`
4. Ejecuta. Debes ver la solicitud creada

#### Paso E: Aprobar la solicitud (ADMIN)

1. Ve a `PATCH /solicitudes/{solicitud_id}/aprobar` (el id del paso B)
2. Asegúrate de estar autorizado (Authorize con ADMIN_API_KEY)
3. Ejecuta
4. Observa que:
   - `estado` cambia a `"aprobada"`
   - `decided_at` se rellena con la fecha actual
   - La mascota en Mascotas ahora está `"adoptada"`

#### Paso F: Crear otra solicitud para la misma mascota e intentar aprobarla

1. Crea una nueva solicitud con documento diferente (Paso B, pero con `documento=0987654321`)
2. Intenta aprobarla (Paso E)
3. Observa que retorna **409 Conflict** con el mensaje "Ya existe una adopción aprobada para esta mascota"

#### Paso G: Crear una solicitud y rechazarla (ADMIN)

1. Crea una nueva mascota en Mascotas (Paso A, con nombre diferente ej. "Max")
2. Crea una solicitud para esa mascota (Paso B, usa el ID de "Max")
3. Ve a `PATCH /solicitudes/{solicitud_id}/rechazar`
4. Ingresa el cuerpo:
   ```json
   {
     "motivo_decision": "El solicitante no cumple con los requisitos de espacio y tiempo disponible."
   }
   ```
5. Ejecuta
6. Observa que:
   - `estado` cambia a `"rechazada"`
   - `motivo_decision` se rellena
   - `decided_at` se rellena
   - La mascota en Mascotas sigue siendo `"disponible"` (puede recibir otras solicitudes)

### 4. Casos de Error para Probar

#### 404 - Mascota no existe
- Crea una solicitud con `mascota_id` que no existe → **404 Not Found**

#### 409 - Mascota no disponible
- Toma una mascota que está `"adoptada"` (del Paso E)
- Intenta crear una solicitud → **409 Conflict** ("La mascota no está disponible")

#### 409 - Solicitud pendiente duplicada
- Crea dos solicitudes con el mismo `mascota_id` y `documento` → La segunda da **409 Conflict**

#### 401 - Sin autenticación
- Ve a `GET /solicitudes` sin hacer "Authorize" → **401 Unauthorized**

#### 503 - API Mascotas caída
- Detén la API de Mascotas
- Intenta aprobar una solicitud → **503 Service Unavailable**
- Verifica que la solicitud sigue `"pendiente"` (sin rollback)

### 5. Validaciones de Negocio (ya pruebas automáticamente)

Las siguientes validaciones están activas:

**Crear solicitud:**
- ✅ `nombre_solicitante`: mínimo 3 caracteres
- ✅ `documento`: mínimo 5 caracteres
- ✅ `email`: formato email válido (EmailStr)
- ✅ `motivo`: mínimo 20 caracteres
- ✅ `tipo_vivienda`: solo 'casa', 'apartamento' o 'finca'
- ✅ Verifica disponibilidad en Mascotas antes de crear

**Aprobar solicitud:**
- ✅ Requiere autenticación (ADMIN_API_KEY)
- ✅ Solo permite aprobar si `estado = 'pendiente'`
- ✅ Verifica disponibilidad nuevamente (con FOR UPDATE para evitar race conditions)
- ✅ Si existe otra aprobada para la misma mascota → **409 Conflict**
- ✅ Rechaza automáticamente las otras solicitudes pendientes
- ✅ Si Mascotas no responde → **503** y la solicitud sigue `pendiente` (rollback)

**Rechazar solicitud:**
- ✅ Requiere autenticación (ADMIN_API_KEY)
- ✅ Solo permite rechazar si `estado = 'pendiente'`
- ✅ La mascota sigue disponible

### 6. Endpoints Completamente Implementados

| Método | Ruta | Acceso | Estado |
|--------|------|--------|--------|
| POST | `/solicitudes` | Público | ✅ Implementado |
| GET | `/solicitudes/seguimiento?documento=` | Público | ✅ Implementado |
| GET | `/solicitudes` | Admin | ✅ Implementado |
| GET | `/solicitudes/{id}` | Admin | ✅ Implementado |
| PATCH | `/solicitudes/{id}/aprobar` | Admin | ✅ Implementado |
| PATCH | `/solicitudes/{id}/rechazar` | Admin | ✅ Implementado |
| GET | `/health` | Público | ✅ Implementado |

### 7. Variables de Entorno (configuradas en .env)

```
DATABASE_URL=postgresql+psycopg://...          # URL de Supabase
ADMIN_API_KEY=cQPVEi1TEbDtFV8vgS0dgTw9AB4wAEhOqBwhWLBWM9U
SERVICE_KEY=D04HoWN5lEtD0WplBpPBZ60xEI8a-ef1lDyiUDuUH7Y
MASCOTAS_API_URL=http://127.0.0.1:8001        # URL local de Mascotas
CORS_ORIGINS=*
DEBUG_ENABLED=false
```

---

## Resumen de Implementación

### Archivos Creados/Modificados:

1. **app/models.py** - Modelo SQLAlchemy `Solicitud` con esquema `svc_adopciones`
2. **app/schemas.py** - Esquemas Pydantic: `SolicitudIn`, `SolicitudOut`, `SeguimientoOut`, `RechazoIn`
3. **app/security.py** - Función `require_admin` con APIKeyHeader y secrets.compare_digest
4. **app/clients/mascotas_client.py** - Cliente HTTP async con httpx para Mascotas
5. **app/routers/solicitudes.py** - 6 endpoints con toda la lógica de negocio
6. **app/main.py** - Inclusión del router
7. **tests/test_solicitudes.py** - 17 pruebas unitarias e integración

### Características Destacadas:

- ✅ **Transacciones ACID** con `with_for_update()` para evitar race conditions
- ✅ **Rollback automático** si Mascotas falla
- ✅ **Índices únicos parciales** (una adopción por mascota, una solicitud pendiente por persona)
- ✅ **Rechazo automático** de otras solicitudes cuando se aprueba una
- ✅ **Validación exhaustiva** de entrada con Pydantic v2
- ✅ **Documentación Swagger** con ejemplos y códigos de error
- ✅ **Seguridad** con APIKeyHeader y secrets.compare_digest
- ✅ **CORS habilitado** desde variables de entorno
- ✅ **Todas las pruebas pasan** (17/17)
