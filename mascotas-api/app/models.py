import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, Index, Text, func, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import DateTime, Uuid


class Base(DeclarativeBase):
    pass


class Mascota(Base):
    __tablename__ = "mascotas"
    __table_args__ = (
        CheckConstraint(
            "especie IN ('perro', 'gato', 'otro')",
            name="ck_mascotas_especie",
        ),
        CheckConstraint(
            "sexo IN ('macho', 'hembra')",
            name="ck_mascotas_sexo",
        ),
        CheckConstraint("edad_meses >= 0", name="ck_mascotas_edad_meses"),
        CheckConstraint(
            "tamano IN ('pequeno', 'mediano', 'grande')",
            name="ck_mascotas_tamano",
        ),
        CheckConstraint(
            "estado IN ('disponible', 'adoptada')",
            name="ck_mascotas_estado",
        ),
        Index("ix_mascotas_estado_especie", "estado", "especie"),
        {"schema": "svc_mascotas"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    nombre: Mapped[str] = mapped_column(Text, nullable=False)
    especie: Mapped[str] = mapped_column(Text, nullable=False)
    raza: Mapped[str | None] = mapped_column(Text)
    sexo: Mapped[str | None] = mapped_column(Text)
    edad_meses: Mapped[int | None] = mapped_column()
    tamano: Mapped[str | None] = mapped_column(Text)
    descripcion: Mapped[str | None] = mapped_column(Text)
    foto_url: Mapped[str | None] = mapped_column(Text)
    estado: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        server_default=text("'disponible'"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
