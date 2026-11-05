from datetime import UTC, datetime
from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Mascota
from app.schemas import (
    DisponibilidadOut,
    Estado,
    EstadoIn,
    Especie,
    MascotaIn,
    MascotaOut,
)
from app.security import require_admin, require_admin_or_service

router = APIRouter(prefix="/mascotas", tags=["Mascotas"])

RESPUESTA_401 = {"description": "Clave de administrador ausente o inválida."}
RESPUESTA_404 = {"description": "Mascota no encontrada."}
RESPUESTA_409 = {"description": "Conflicto con el estado de la mascota."}
RESPUESTA_422 = {"description": "Los datos enviados no son válidos."}


def obtener_mascota(db: Session, mascota_id: uuid.UUID) -> Mascota:
    mascota = db.get(Mascota, mascota_id)
    if mascota is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mascota no encontrada.",
        )
    return mascota


@router.get(
    "",
    summary="Listar mascotas",
    response_model=list[MascotaOut],
)
def listar_mascotas(
    estado: Estado | None = None,
    especie: Especie | None = None,
    q: Annotated[str | None, Query(description="Busca por nombre o raza.")] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    db: Session = Depends(get_db),
) -> list[Mascota]:
    consulta = select(Mascota)
    if estado is not None:
        consulta = consulta.where(Mascota.estado == estado)
    if especie is not None:
        consulta = consulta.where(Mascota.especie == especie)
    if q:
        patron = f"%{q}%"
        consulta = consulta.where(
            or_(
                Mascota.nombre.ilike(patron),
                Mascota.raza.ilike(patron),
            )
        )
    return list(db.scalars(consulta.offset(offset).limit(limit)).all())


@router.get(
    "/{mascota_id}/disponibilidad",
    summary="Consultar disponibilidad de una mascota",
    response_model=DisponibilidadOut,
    responses={404: RESPUESTA_404},
)
def consultar_disponibilidad(
    mascota_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> DisponibilidadOut:
    mascota = obtener_mascota(db, mascota_id)
    return DisponibilidadOut(
        id=mascota.id,
        estado=mascota.estado,
        disponible=mascota.estado == "disponible",
    )


@router.get(
    "/{mascota_id}",
    summary="Consultar el detalle de una mascota",
    response_model=MascotaOut,
    responses={404: RESPUESTA_404},
)
def obtener_detalle_mascota(
    mascota_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> Mascota:
    return obtener_mascota(db, mascota_id)


@router.post(
    "",
    summary="Crear una mascota",
    response_model=MascotaOut,
    status_code=status.HTTP_201_CREATED,
    responses={401: RESPUESTA_401, 422: RESPUESTA_422},
)
def crear_mascota(
    datos: MascotaIn,
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Mascota:
    mascota = Mascota(**datos.model_dump(), estado="disponible")
    db.add(mascota)
    db.commit()
    db.refresh(mascota)
    return mascota


@router.put(
    "/{mascota_id}",
    summary="Editar los datos de una mascota",
    response_model=MascotaOut,
    responses={
        401: RESPUESTA_401,
        404: RESPUESTA_404,
        422: RESPUESTA_422,
    },
)
def actualizar_mascota(
    mascota_id: uuid.UUID,
    datos: MascotaIn,
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Mascota:
    mascota = obtener_mascota(db, mascota_id)
    for campo, valor in datos.model_dump().items():
        setattr(mascota, campo, valor)
    mascota.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(mascota)
    return mascota


@router.delete(
    "/{mascota_id}",
    summary="Eliminar una mascota",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        401: RESPUESTA_401,
        404: RESPUESTA_404,
        409: RESPUESTA_409,
    },
)
def eliminar_mascota(
    mascota_id: uuid.UUID,
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Response:
    mascota = obtener_mascota(db, mascota_id)
    if mascota.estado == "adoptada":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar una mascota adoptada.",
        )
    db.delete(mascota)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch(
    "/{mascota_id}/estado",
    summary="Actualizar el estado de una mascota",
    response_model=MascotaOut,
    responses={
        401: {"description": "Clave de administrador o de servicio ausente o inválida."},
        404: RESPUESTA_404,
        422: RESPUESTA_422,
    },
)
def actualizar_estado_mascota(
    mascota_id: uuid.UUID,
    datos: EstadoIn,
    _: None = Depends(require_admin_or_service),
    db: Session = Depends(get_db),
) -> Mascota:
    mascota = obtener_mascota(db, mascota_id)
    if mascota.estado != datos.estado:
        mascota.estado = datos.estado
        mascota.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(mascota)
    return mascota
