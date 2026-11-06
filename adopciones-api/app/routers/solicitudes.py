import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.clients.mascotas_client import marcar_adoptada, obtener_disponibilidad
from app.database import get_db
from app.models import Solicitud
from app.schemas import RechazoIn, SeguimientoOut, SolicitudIn, SolicitudOut
from app.security import require_admin

router = APIRouter(
    prefix="/solicitudes",
    tags=["Solicitudes"],
)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=SolicitudOut,
    summary="Registrar solicitud de adopción",
    responses={
        404: {"description": "La mascota no existe."},
        409: {"description": "La mascota no está disponible o ya existe una solicitud pendiente."},
        503: {"description": "La API de Mascotas no está disponible."},
    },
)
async def crear_solicitud(
    solicitud_in: SolicitudIn,
    db: Session = Depends(get_db),
) -> SolicitudOut:
    """Registra una nueva solicitud de adopción tras verificar disponibilidad."""
    disponibilidad = await obtener_disponibilidad(solicitud_in.mascota_id)
    
    if not disponibilidad.get("disponible"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La mascota no está disponible.",
        )
    
    solicitud = Solicitud(
        mascota_id=solicitud_in.mascota_id,
        nombre_solicitante=solicitud_in.nombre_solicitante,
        documento=solicitud_in.documento,
        email=solicitud_in.email,
        telefono=solicitud_in.telefono,
        direccion=solicitud_in.direccion,
        tipo_vivienda=solicitud_in.tipo_vivienda,
        motivo=solicitud_in.motivo,
    )
    
    db.add(solicitud)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una solicitud pendiente para esta mascota y persona.",
        )
    
    db.refresh(solicitud)
    return SolicitudOut.model_validate(solicitud)


@router.get(
    "/seguimiento",
    response_model=list[SeguimientoOut],
    summary="Consultar seguimiento de solicitudes",
    responses={},
)
def obtener_seguimiento(
    documento: str = Query(..., description="Documento del solicitante"),
    db: Session = Depends(get_db),
) -> list[SeguimientoOut]:
    """Lista las solicitudes de una persona por documento."""
    solicitudes = db.query(Solicitud).filter(Solicitud.documento == documento).all()
    return [SeguimientoOut.model_validate(s) for s in solicitudes]


@router.get(
    "",
    response_model=list[SolicitudOut],
    summary="Listar solicitudes",
    responses={401: {"description": "No autorizado."}},
)
def listar_solicitudes(
    estado: str | None = Query(default=None, description="Filtrar por estado"),
    mascota_id: uuid.UUID | None = Query(default=None, description="Filtrar por mascota"),
    limit: int = Query(20, ge=1, le=100, description="Límite de resultados"),
    offset: int = Query(0, ge=0, description="Desplazamiento"),
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[SolicitudOut]:
    """Lista solicitudes con filtros. Requiere autenticación de admin."""
    query = db.query(Solicitud)
    
    if estado:
        query = query.filter(Solicitud.estado == estado)
    if mascota_id:
        query = query.filter(Solicitud.mascota_id == mascota_id)
    
    query = query.offset(offset).limit(limit)
    solicitudes = query.all()
    
    return [SolicitudOut.model_validate(s) for s in solicitudes]


@router.get(
    "/{solicitud_id}",
    response_model=SolicitudOut,
    summary="Obtener detalle de solicitud",
    responses={
        401: {"description": "No autorizado."},
        404: {"description": "Solicitud no encontrada."},
    },
)
def obtener_solicitud(
    solicitud_id: uuid.UUID,
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> SolicitudOut:
    """Obtiene el detalle de una solicitud. Requiere autenticación de admin."""
    solicitud = db.query(Solicitud).filter(Solicitud.id == solicitud_id).first()
    if not solicitud:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitud no encontrada.",
        )
    
    return SolicitudOut.model_validate(solicitud)


@router.patch(
    "/{solicitud_id}/aprobar",
    response_model=SolicitudOut,
    summary="Aprobar solicitud de adopción",
    responses={
        401: {"description": "No autorizado."},
        404: {"description": "Solicitud no encontrada."},
        409: {"description": "La solicitud no está pendiente o la mascota no está disponible."},
        503: {"description": "La API de Mascotas no está disponible."},
    },
)
async def aprobar_solicitud(
    solicitud_id: uuid.UUID,
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> SolicitudOut:
    """Aprueba una solicitud y marca la mascota como adoptada."""
    # Paso 1: Leer con FOR UPDATE
    solicitud = (
        db.query(Solicitud)
        .filter(Solicitud.id == solicitud_id)
        .with_for_update()
        .first()
    )
    
    if not solicitud:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitud no encontrada.",
        )
    
    if solicitud.estado != "pendiente":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La solicitud no está en estado pendiente.",
        )
    
    # Paso 2: Consultar disponibilidad
    disponibilidad = await obtener_disponibilidad(solicitud.mascota_id)
    if not disponibilidad.get("disponible"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La mascota no está disponible.",
        )
    
    # Paso 3: Marcar como aprobada y hacer flush
    solicitud.estado = "aprobada"
    solicitud.decided_at = datetime.now(timezone.utc)
    
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una adopción aprobada para esta mascota.",
        )
    
    # Paso 4: Rechazar las demás pendientes
    otras_solicitudes = (
        db.query(Solicitud)
        .filter(
            Solicitud.mascota_id == solicitud.mascota_id,
            Solicitud.estado == "pendiente",
            Solicitud.id != solicitud_id,
        )
        .all()
    )
    
    for otra in otras_solicitudes:
        otra.estado = "rechazada"
        otra.motivo_decision = "La mascota fue adoptada por otra solicitud"
        otra.decided_at = datetime.now(timezone.utc)
    
    # Paso 5: Llamar a Mascotas
    try:
        await marcar_adoptada(solicitud.mascota_id)
    except HTTPException as e:
        db.rollback()
        raise e
    
    # Paso 6: Commit
    db.commit()
    db.refresh(solicitud)
    
    return SolicitudOut.model_validate(solicitud)


@router.patch(
    "/{solicitud_id}/rechazar",
    response_model=SolicitudOut,
    summary="Rechazar solicitud de adopción",
    responses={
        401: {"description": "No autorizado."},
        404: {"description": "Solicitud no encontrada."},
        409: {"description": "La solicitud no está en estado pendiente."},
    },
)
def rechazar_solicitud(
    solicitud_id: uuid.UUID,
    rechazo: RechazoIn,
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> SolicitudOut:
    """Rechaza una solicitud."""
    solicitud = (
        db.query(Solicitud)
        .filter(Solicitud.id == solicitud_id)
        .with_for_update()
        .first()
    )
    
    if not solicitud:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitud no encontrada.",
        )
    
    if solicitud.estado != "pendiente":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La solicitud no está en estado pendiente.",
        )
    
    solicitud.estado = "rechazada"
    solicitud.motivo_decision = rechazo.motivo_decision
    solicitud.decided_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(solicitud)
    
    return SolicitudOut.model_validate(solicitud)
