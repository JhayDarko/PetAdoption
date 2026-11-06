# Fundación Huellas de Esperanza

Plataforma web para la adopción responsable de mascotas, organizada como un monorepo con dos APIs independientes: Mascotas y Adopciones. Los servicios usan PostgreSQL en Supabase y se comunicarán mediante HTTP/REST. El frontend se incorporará en una tarea posterior.

## Estructura

```text
.
├── .github/
│   └── copilot-instructions.md
├── .gitignore
├── README.md
├── db/
│   ├── schema.sql
│   └── seed.sql
├── docs/
│   ├── arquitectura/
│   └── evidencias/
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

Para configurar una conexión a PostgreSQL u otras variables, copia el `.env.example` del servicio correspondiente a `.env` y completa los valores localmente. No subas el archivo `.env`.

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
