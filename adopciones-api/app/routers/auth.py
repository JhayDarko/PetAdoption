from fastapi import APIRouter, HTTPException, status
from pwdlib import PasswordHash

from app.config import settings
from app.schemas_auth import LoginIn, LoginOut
from app.security import crear_token_admin

router = APIRouter(prefix="/auth", tags=["Autenticación"])
password_hash = PasswordHash.recommended()


@router.post(
    "/login",
    response_model=LoginOut,
    summary="Iniciar sesión administrativa",
    responses={
        401: {"description": "Credenciales inválidas."},
        503: {"description": "Autenticación no configurada."},
    },
)
def login(datos: LoginIn) -> LoginOut:
    if not settings.ADMIN_PASSWORD_HASH or not settings.JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La autenticación no está configurada.",
        )
    try:
        credenciales_validas = password_hash.verify(datos.password, settings.ADMIN_PASSWORD_HASH)
    except ValueError:
        credenciales_validas = False
    if datos.username != settings.ADMIN_USERNAME or not credenciales_validas:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña inválidos.",
        )
    return LoginOut(access_token=crear_token_admin())
