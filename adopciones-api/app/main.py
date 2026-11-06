from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import solicitudes

app = FastAPI(
    title="API de Adopciones",
    description="Servicio para gestionar solicitudes de adopción.",
    version="1.0.0",
)

origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(solicitudes.router)


@app.get(
    "/health",
    summary="Consultar el estado del servicio",
    response_model=dict[str, str],
    tags=["Salud"],
)
def health() -> dict[str, str]:
    return {"status": "ok", "service": "adopciones"}
