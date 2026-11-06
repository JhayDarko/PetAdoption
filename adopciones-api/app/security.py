import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader

from app.config import settings

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def require_admin(api_key: str | None = Depends(api_key_header)) -> None:
    if api_key is None or not secrets.compare_digest(api_key, settings.ADMIN_API_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clave de API inválida o ausente.",
        )


service_key_header = APIKeyHeader(name="X-Service-Key", auto_error=False)


def require_service(service_key: str | None = Depends(service_key_header)) -> None:
    if service_key is None or not secrets.compare_digest(service_key, settings.SERVICE_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clave de servicio inválida o ausente.",
        )
