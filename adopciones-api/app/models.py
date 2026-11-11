import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, Index, Text, func, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import DateTime, Uuid


class Base(DeclarativeBase):
    pass


class Solicitud(Base):
    __tablename__ = "solicitudes"
    __table_args__ = (
        CheckConstraint(
            "tipo_vivienda IN ('casa', 'apartamento', 'finca')",
            name="ck_solicitudes_tipo_vivienda",
        ),
        CheckConstraint(
            "estado IN ('pendiente', 'aprobada', 'rechazada')",
            name="ck_solicitudes_estado",
        ),
        CheckConstraint(
            "(estado = 'pendiente' AND decided_at IS NULL AND motivo_decision IS NULL) "
            "OR (estado = 'aprobada' AND decided_at IS NOT NULL AND motivo_decision IS NULL) "
            "OR (estado = 'rechazada' AND decided_at IS NOT NULL AND motivo_decision IS NOT NULL)",
            name="ck_solicitudes_decision_coherente",
        ),
        Index("ix_solicitudes_estado", "estado"),
        Index(
            "uq_una_aprobada_por_mascota",
            "mascota_id",
            unique=True,
            postgresql_where=text("estado = 'aprobada'"),
        ),
        Index(
            "uq_pendiente_por_persona",
            "mascota_id",
            "documento",
            unique=True,
            postgresql_where=text("estado = 'pendiente'"),
        ),
        {"schema": "svc_adopciones"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    mascota_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    nombre_solicitante: Mapped[str] = mapped_column(Text, nullable=False)
    documento: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, nullable=False)
    telefono: Mapped[str | None] = mapped_column(Text)
    direccion: Mapped[str | None] = mapped_column(Text)
    tipo_vivienda: Mapped[str | None] = mapped_column(Text)
    motivo: Mapped[str] = mapped_column(Text, nullable=False)
    estado: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        server_default=text("'pendiente'"),
    )
    motivo_decision: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    decided_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )
