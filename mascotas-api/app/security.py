import secrets
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader

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


def require_admin(
    api_key: Annotated[str | None, Depends(api_key_header)],
) -> None:
    if not settings.ADMIN_API_KEY or not api_key or not secrets.compare_digest(
        api_key,
        settings.ADMIN_API_KEY,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clave de administrador ausente o inválida.",
        )


def require_admin_or_service(
    api_key: Annotated[str | None, Depends(api_key_header)],
    service_key: Annotated[str | None, Depends(service_key_header)],
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
    if not (admin_valid or service_valid):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clave de administrador o de servicio ausente o inválida.",
        )
