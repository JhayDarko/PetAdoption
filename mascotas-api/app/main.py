import logging

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine
from app.routers.mascotas import router as mascotas_router

logger = logging.getLogger(__name__)

app = FastAPI(
    title="API de Mascotas",
    description="Servicio para consultar y administrar mascotas.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(mascotas_router)


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
    return {"status": "ok", "service": "mascotas"}


@app.get(
    "/health/ready",
    summary="Verificar dependencias del servicio",
    response_model=dict[str, str],
    tags=["Salud"],
    responses={503: {"description": "La base de datos no está disponible."}},
)
def readiness() -> dict[str, str] | JSONResponse:
    if engine is None:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": "DATABASE_URL no está configurada."},
        )
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ready", "service": "mascotas"}
