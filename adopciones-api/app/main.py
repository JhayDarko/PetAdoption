import logging

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings
from app.database import engine
from app.routers import auth, solicitudes

logger = logging.getLogger(__name__)

app = FastAPI(
    title="API de Adopciones",
    description="Servicio para gestionar solicitudes de adopción.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(solicitudes.router)
app.include_router(auth.router)


@app.exception_handler(SQLAlchemyError)
async def database_error_handler(_, exc: SQLAlchemyError) -> JSONResponse:
    logger.exception("Database operation failed", exc_info=exc)
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "La base de datos no está disponible o requiere actualización."},
    )


@app.get(
    "/health",
    summary="Consultar el estado del servicio",
    response_model=dict[str, str],
    tags=["Salud"],
)
def health() -> dict[str, str]:
    return {"status": "ok", "service": "adopciones"}


@app.get(
    "/health/ready",
    summary="Verificar dependencias del servicio",
    response_model=dict[str, str],
    tags=["Salud"],
    responses={503: {"description": "Una dependencia no está disponible."}},
)
def readiness() -> dict[str, str] | JSONResponse:
    if engine is None:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": "DATABASE_URL no está configurada."},
        )
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    if not settings.MASCOTAS_API_URL or not settings.SERVICE_KEY:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": "MASCOTAS_API_URL y SERVICE_KEY son obligatorios."},
        )
    return {"status": "ready", "service": "adopciones"}
