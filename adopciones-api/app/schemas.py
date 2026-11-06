import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SolicitudIn(BaseModel):
    mascota_id: uuid.UUID = Field(examples=["f47ac10b-58cc-4372-a567-0e02b2c3d479"])
    nombre_solicitante: str = Field(min_length=3, examples=["Juan García"])
    documento: str = Field(min_length=5, examples=["1234567890"])
    email: EmailStr = Field(examples=["juan@example.com"])
    telefono: str | None = Field(default=None, examples=["3001234567"])
    direccion: str | None = Field(default=None, examples=["Calle 123 #45"])
    tipo_vivienda: Literal["casa", "apartamento", "finca"] | None = Field(
        default=None,
        examples=["casa"],
    )
    motivo: str = Field(
        min_length=20,
        examples=["Deseo adoptar una mascota que acompañe a mi familia."],
    )


class SolicitudOut(SolicitudIn):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    estado: Literal["pendiente", "aprobada", "rechazada"]
    motivo_decision: str | None
    created_at: datetime
    decided_at: datetime | None


class SeguimientoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    mascota_id: uuid.UUID
    estado: Literal["pendiente", "aprobada", "rechazada"]
    created_at: datetime
    motivo_decision: str | None


class RechazoIn(BaseModel):
    motivo_decision: str = Field(
        min_length=1,
        examples=["El solicitante no cumple con los requisitos."],
    )
