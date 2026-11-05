import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Especie = Literal["perro", "gato", "otro"]
Estado = Literal["disponible", "adoptada"]


class MascotaIn(BaseModel):
    nombre: str = Field(examples=["Luna"])
    especie: Especie = Field(examples=["perro"])
    raza: str | None = Field(default=None, examples=["Criollo"])
    sexo: Literal["macho", "hembra"] | None = Field(default=None, examples=["hembra"])
    edad_meses: int | None = Field(default=None, ge=0, examples=[18])
    tamano: Literal["pequeno", "mediano", "grande"] | None = Field(
        default=None,
        examples=["mediano"],
    )
    descripcion: str | None = Field(default=None, examples=["Cariñosa y juguetona."])
    foto_url: str | None = Field(default=None, examples=["https://ejemplo.com/luna.jpg"])


class MascotaOut(MascotaIn):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    estado: Estado
    created_at: datetime
    updated_at: datetime


class EstadoIn(BaseModel):
    estado: Estado = Field(examples=["adoptada"])


class DisponibilidadOut(BaseModel):
    id: uuid.UUID
    estado: Estado
    disponible: bool
