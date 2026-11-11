# Fundación Huellas de Esperanza

Plataforma web para la adopción responsable de mascotas, organizada como un monorepo con dos APIs independientes: Mascotas y Adopciones. Los servicios usan PostgreSQL en Supabase y se comunican mediante HTTP/REST y JSON.

## Estructura

```text
.
├── .gitignore
├── README.md
├── db/
│   ├── schema.sql
│   └── seed.sql
├── frontend/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── vercel.json
├── mascotas-api/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   └── mascotas.py
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── security.py
│   ├── tests/
│   ├── .env.example
│   └── requirements.txt
└── adopciones-api/
    ├── app/
    │   ├── clients/
    │   │   ├── __init__.py
    │   │   └── mascotas_client.py
    │   ├── routers/
    │   │   ├── __init__.py
    │   │   └── solicitudes.py
    │   ├── __init__.py
    │   ├── config.py
    │   ├── database.py
    │   ├── main.py
    │   ├── models.py
    │   ├── schemas.py
    │   └── security.py
    ├── tests/
    ├── .env.example
    └── requirements.txt
```

## Arquitectura

```text
Usuario
   |
Frontend React + Vite
   |----------------------|
   v                      v
API Mascotas          API Adopciones
   |                      |
svc_mascotas          svc_adopciones
   |                      |
   +-------- PostgreSQL / Supabase

API Adopciones --HTTP/REST + JSON--> API Mascotas
```

Cada API es autónoma y escribe únicamente en su propio esquema. Adopciones no
consulta directamente la base de datos de Mascotas para ejecutar operaciones:
verifica disponibilidad y actualiza estados mediante HTTP. La base de datos
mantiene además una referencia de integridad entre `solicitudes.mascota_id` y
`mascotas.id`, evitando solicitudes huérfanas cuando ambos esquemas viven en la
misma instancia Supabase. También impide dos adopciones aprobadas para la misma
mascota mediante un índice único parcial.

## Flujo principal demostrado

1. El frontend consulta las mascotas disponibles.
2. La persona consulta el detalle y envía una solicitud.
3. Adopciones consulta la disponibilidad en Mascotas.
4. La solicitud queda en estado `pendiente`.
5. El administrador la aprueba o rechaza desde Swagger o `/admin`.
6. Al aprobar, Adopciones marca la solicitud como `aprobada`, rechaza las demás
   pendientes y solicita a Mascotas cambiar el estado a `adoptada`.
7. Una segunda aprobación para la misma mascota responde `409`.

## Ejecutar en local

Se requiere Python 3.12. Los comandos siguientes usan PowerShell y preparan un entorno virtual independiente para cada API. El endpoint de salud funciona sin configurar la base de datos.

### API Mascotas

```powershell
cd mascotas-api
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Swagger: <http://127.0.0.1:8001/docs>

### API Adopciones

En otra terminal:

```powershell
cd adopciones-api
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8002
```

Swagger: <http://127.0.0.1:8002/docs>

Para configurar una conexión a PostgreSQL u otras variables, copia el `.env.example` del servicio correspondiente a `.env` y completa los valores localmente. No subas el archivo `.env`. Las APIs aceptan solicitudes CORS desde cualquier origen para permitir que el frontend de Vercel cambie de dominio sin volver a configurar las APIs; la autenticación administrativa usa JWT con rol `admin` (se mantiene `X-API-Key` como compatibilidad temporal).

### Pruebas locales

Desde cada carpeta de API, ejecuta sus pruebas:

```powershell
cd mascotas-api
$env:PYTHONPATH="$PWD"
pytest -q

cd ..\adopciones-api
pytest -q
```

La suite de Adopciones usa la base de datos indicada en su `.env` y simula la
API de Mascotas con `respx`. La suite de Mascotas valida salud, autenticación y
validación de paginación.

### Frontend

En otra terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

La aplicación estará disponible en <http://127.0.0.1:5173>. El archivo `.env` usa por defecto:

```text
VITE_API_MASCOTAS_URL=http://127.0.0.1:8001
VITE_API_ADOPCIONES_URL=http://127.0.0.1:8002
```

### Acceso administrativo

Abre <http://127.0.0.1:5173/admin> e introduce `ADMIN_USERNAME` y la contraseña
configurada en Adopciones. El JWT se guarda únicamente en `sessionStorage`, se
elimina al cerrar sesión o cuando una API responde `401`, y no se persiste como
dato de negocio.

### Pruebas de integración desplegadas

Las pruebas de integración usan `httpx` síncrono y un timeout de 60 segundos para
permitir que los servicios desplegados se despierten. Desde `adopciones-api`,
define las URLs y la clave de administrador:

```powershell
$env:MASCOTAS_URL="https://tu-api-mascotas.onrender.com"
$env:ADOPCIONES_URL="https://tu-api-adopciones.onrender.com"
$env:ADMIN_API_KEY="tu-clave-de-administrador"
pytest tests/test_integracion.py -v
```

Si alguna variable falta, pytest omite las pruebas para no ejecutar llamadas
incompletas contra servicios remotos.

Las variables del despliegue deben ser coherentes:

- `MASCOTAS_URL` es la URL pública usada por las pruebas.
- `ADOPCIONES_URL` es la URL pública de Adopciones.
- `MASCOTAS_API_URL` en el entorno de Adopciones debe apuntar exactamente a la
  URL pública de Mascotas.
- `SERVICE_KEY` debe tener el mismo valor en ambas APIs.
- Ambas APIs deben usar la base de datos Supabase esperada y sus esquemas
  `svc_mascotas` y `svc_adopciones`.

### Acceso administrativo

El panel administrativo usa inicio de sesión con JWT y rol `admin`. Configura
en Adopciones:

```text
JWT_SECRET=un-secreto-largo-y-aleatorio
JWT_EXPIRE_MINUTES=480
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<hash generado con pwdlib>
```

Configura el mismo `JWT_SECRET` en Mascotas para que ambos servicios validen el
token. Genera el hash sin guardar la contraseña en el repositorio:

```powershell
python -c "from pwdlib import PasswordHash; print(PasswordHash.recommended().hash('CAMBIA_ESTA_CONTRASEÑA'))"
```

El frontend guarda únicamente el token temporal en `sessionStorage`. Las rutas
administrativas de ambas APIs validan el rol; ocultar el enlace en el frontend
es solo una mejora de navegación y no sustituye la autorización del backend.

Si crear una mascota funciona directamente, pero crear una solicitud responde
`404 La mascota no existe`, revisa primero `MASCOTAS_API_URL` en Adopciones:
normalmente apunta a otra URL, otro despliegue o una base de datos distinta.
Para comprobar la configuración, toma un `id` visible en
`https://mascotas-jhsx.onrender.com/mascotas?limit=100` y consulta ese mismo
registro desde el flujo de creación de Adopciones. Si Mascotas responde `200`
pero Adopciones responde `404`, actualiza `MASCOTAS_API_URL` en Render a
`https://mascotas-jhsx.onrender.com` y vuelve a desplegar Adopciones.

### Casos cubiertos por la integración

Las pruebas remotas cubren:

- Crear mascota.
- Crear solicitud válida.
- Mascota inexistente.
- Solicitud pendiente duplicada.
- Aprobar solicitud y actualizar Mascotas.
- Rechazo automático de solicitudes pendientes restantes.
- Segunda aprobación de la misma mascota.
- Solicitud sobre mascota adoptada.
- Rechazar sin cambiar la disponibilidad.
- Dos aprobaciones simultáneas: una `200` y una `409`.
- Operaciones administrativas sin clave: `401`.

Para guardar la salida como evidencia local sin subirla al repositorio:

```powershell
pytest tests/test_integracion.py -v | Tee-Object resultado-integracion.txt
```

El archivo de resultado debe mantenerse fuera del commit si contiene URLs,
datos de prueba o información del entorno.

### Reiniciar y cargar datos de demostración

El archivo [db/seed.sql](db/seed.sql) reconstruye los esquemas, tablas e índices
y carga 50 mascotas con escenarios
realistas:

- 30 mascotas disponibles.
- 15 mascotas adoptadas con una solicitud aprobada cada una.
- 5 mascotas disponibles con solicitudes rechazadas.
- 10 solicitudes pendientes.
- Mascotas disponibles sin solicitudes para probar el catálogo.

Ejecuta `db/seed.sql` en Supabase solo cuando quieras reemplazar los datos
actuales: es un script destructivo que elimina y recrea `svc_mascotas` y
`svc_adopciones`. El script usa una transacción y debe ejecutarse completo.
También puedes ejecutar primero [db/schema.sql](db/schema.sql) si solo quieres
crear la estructura sin cargar datos.

El seed asigna imágenes remotas de perros o gatos según la especie mediante
URLs directas del CDN de Unsplash. No se almacenan imágenes ni archivos
binarios en el repositorio.

Las tablas no están en `public`; pertenecen a los esquemas `svc_mascotas` y
`svc_adopciones`. Para comprobarlas desde el SQL Editor:

```sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema IN ('svc_mascotas', 'svc_adopciones')
ORDER BY table_schema, table_name;

SELECT * FROM svc_mascotas.mascotas ORDER BY nombre;
SELECT * FROM svc_adopciones.solicitudes ORDER BY created_at;
```

En el Table Editor selecciona el esquema correspondiente en el selector de
esquemas. Si la interfaz solo muestra `public`, usa el SQL Editor: la tabla
existe igualmente y las APIs la consultan mediante su nombre completo.

## Verificación manual en Swagger

Con ambas APIs desplegadas:

1. Abrir `/docs` de Adopciones, ejecutar `POST /auth/login` y copiar el JWT.
2. Abrir `/docs` de Mascotas y crear una mascota con `Authorization: Bearer <JWT>`.
3. Copiar el `id` devuelto.
4. En Adopciones, ejecutar `POST /solicitudes` con ese `mascota_id`.
5. En `GET /solicitudes`, usar el mismo JWT como Bearer y localizar la solicitud.
5. Ejecutar `PATCH /solicitudes/{id}/aprobar`.
6. Consultar la mascota en Mascotas y verificar `estado: adoptada`.
7. Crear dos solicitudes para otra mascota y aprobar una; verificar que la otra
   quede `rechazada`.
8. Intentar aprobar nuevamente y verificar `409`.

## Entrega del examen

Antes de la socialización verificar:

- Las dos APIs responden `GET /health`.
- El frontend abre y consume las URLs desplegadas.
- Las tablas e índices de [db/schema.sql](db/schema.sql) existen en Supabase.
- CORS permite el dominio público del frontend.
- Las pruebas de integración remotas terminan con código `0`.
- No se incluyen secretos, archivos `.env`, dependencias instaladas ni
  resultados temporales en GitHub.
