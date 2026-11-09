import uuid

import httpx
from fastapi import HTTPException, status

from app.config import settings


async def obtener_disponibilidad(mascota_id: uuid.UUID) -> dict:
    """
    Consulta la disponibilidad de una mascota en la API de Mascotas.
    
    Lanza HTTPException(404) si no existe, 503 si hay error de red.
    """
    if not settings.MASCOTAS_API_URL:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="URL de la API de Mascotas no configurada.",
        )

    url = f"{settings.MASCOTAS_API_URL}/mascotas/{mascota_id}/disponibilidad"
    headers = {"X-Service-Key": settings.SERVICE_KEY}
    
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(15.0, connect=5.0)) as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"La mascota {mascota_id} no existe en la API de Mascotas.",
                )
            
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La API de Mascotas no está disponible.",
        ) from e


async def marcar_adoptada(mascota_id: uuid.UUID) -> dict:
    """
    Marca una mascota como adoptada en la API de Mascotas.
    
    Lanza HTTPException(404) si no existe, 503 si hay error de red o si la mascota
    ya está adoptada.
    """
    if not settings.MASCOTAS_API_URL:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="URL de la API de Mascotas no configurada.",
        )

    url = f"{settings.MASCOTAS_API_URL}/mascotas/{mascota_id}/estado"
    headers = {"X-Service-Key": settings.SERVICE_KEY}
    body = {"estado": "adoptada"}
    
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(15.0, connect=5.0)) as client:
            response = await client.patch(url, json=body, headers=headers)
            
            if response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"La mascota {mascota_id} no existe en la API de Mascotas.",
                )
            if response.status_code == 401:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="La API de Mascotas rechazó la clave de servicio.",
                )
            if response.status_code == 409:
                detalle = "La mascota no puede marcarse como adoptada."
                try:
                    detalle = response.json().get("detail", detalle)
                except ValueError:
                    pass
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=detalle,
                )
            response.raise_for_status()
            return response.json()
    except HTTPException:
        raise
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La API de Mascotas no está disponible.",
        ) from e
