from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers.mascotas import router as mascotas_router

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


@app.get(
    "/health",
    summary="Consultar el estado del servicio",
    response_model=dict[str, str],
    tags=["Salud"],
)
def health() -> dict[str, str]:
    return {"status": "ok", "service": "mascotas"}
