import secrets
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

api_key_header = APIKeyHeader(
    name="X-API-Key",
    scheme_name="AdminApiKey",
    auto_error=False,
)
service_key_header = APIKeyHeader(
    name="X-Service-Key",
    scheme_name="ServiceApiKey",
    auto_error=False,
)
bearer_scheme = HTTPBearer(auto_error=False)


def require_admin(
    api_key: Annotated[str | None, Depends(api_key_header)],
    credenciales: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> None:
    api_key_valida = bool(
        settings.ADMIN_API_KEY
        and api_key
        and secrets.compare_digest(api_key, settings.ADMIN_API_KEY)
    )
    token_valido = False
    if credenciales and settings.JWT_SECRET:
        try:
            datos = jwt.decode(credenciales.credentials, settings.JWT_SECRET, algorithms=["HS256"])
            token_valido = datos.get("role") == "admin"
        except jwt.InvalidTokenError:
            token_valido = False
    if not api_key_valida and not token_valido:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clave de administrador ausente o inválida.",
        )


def require_admin_or_service(
    api_key: Annotated[str | None, Depends(api_key_header)],
    service_key: Annotated[str | None, Depends(service_key_header)],
    credenciales: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> None:
    admin_valid = bool(
        settings.ADMIN_API_KEY
        and api_key
        and secrets.compare_digest(api_key, settings.ADMIN_API_KEY)
    )
    service_valid = bool(
        settings.SERVICE_KEY
        and service_key
        and secrets.compare_digest(service_key, settings.SERVICE_KEY)
    )
    token_valid = False
    if credenciales and settings.JWT_SECRET:
        try:
            datos = jwt.decode(credenciales.credentials, settings.JWT_SECRET, algorithms=["HS256"])
            token_valid = datos.get("role") == "admin"
        except jwt.InvalidTokenError:
            token_valid = False
    if not (admin_valid or service_valid or token_valid):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clave de administrador o de servicio ausente o inválida.",
        )
