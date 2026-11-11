import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)


def crear_token_admin() -> str:
    if not settings.JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La autenticación no está configurada.",
        )
    ahora = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": settings.ADMIN_USERNAME,
            "role": "admin",
            "iat": ahora,
            "exp": ahora + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
        },
        settings.JWT_SECRET,
        algorithm="HS256",
    )


def _admin_desde_token(
    credenciales: HTTPAuthorizationCredentials | None,
) -> bool:
    if not credenciales or credenciales.scheme.lower() != "bearer" or not settings.JWT_SECRET:
        return False
    try:
        datos = jwt.decode(credenciales.credentials, settings.JWT_SECRET, algorithms=["HS256"])
    except jwt.InvalidTokenError:
        return False
    return datos.get("role") == "admin" and datos.get("sub") == settings.ADMIN_USERNAME


def require_admin(
    api_key: str | None = Depends(api_key_header),
    credenciales: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> None:
    api_key_valido = bool(
        settings.ADMIN_API_KEY
        and api_key
        and secrets.compare_digest(api_key, settings.ADMIN_API_KEY)
    )
    if not api_key_valido and not _admin_desde_token(credenciales):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticación de administrador inválida o ausente.",
        )


service_key_header = APIKeyHeader(name="X-Service-Key", auto_error=False)


def require_service(service_key: str | None = Depends(service_key_header)) -> None:
    if service_key is None or not secrets.compare_digest(service_key, settings.SERVICE_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clave de servicio inválida o ausente.",
        )
