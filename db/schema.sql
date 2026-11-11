CREATE SCHEMA IF NOT EXISTS svc_mascotas;
CREATE SCHEMA IF NOT EXISTS svc_adopciones;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE svc_mascotas.mascotas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    especie text NOT NULL CHECK (especie IN ('perro', 'gato', 'otro')),
    raza text,
    sexo text CHECK (sexo IN ('macho', 'hembra')),
    edad_meses int CHECK (edad_meses >= 0),
    tamano text CHECK (tamano IN ('pequeno', 'mediano', 'grande')),
    descripcion text,
    foto_url text,
    estado text NOT NULL DEFAULT 'disponible'
        CHECK (estado IN ('disponible', 'adoptada')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION svc_mascotas.actualizar_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER mascotas_updated_at
BEFORE UPDATE ON svc_mascotas.mascotas
FOR EACH ROW
EXECUTE FUNCTION svc_mascotas.actualizar_updated_at();

CREATE INDEX ix_mascotas_estado_especie
    ON svc_mascotas.mascotas (estado, especie);

CREATE TABLE svc_adopciones.solicitudes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mascota_id uuid NOT NULL,
    nombre_solicitante text NOT NULL,
    documento text NOT NULL,
    email text NOT NULL,
    telefono text,
    direccion text,
    tipo_vivienda text CHECK (tipo_vivienda IN ('casa', 'apartamento', 'finca')),
    motivo text NOT NULL,
    estado text NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    motivo_decision text,
    created_at timestamptz NOT NULL DEFAULT now(),
    decided_at timestamptz,
    CONSTRAINT ck_solicitudes_decision_coherente CHECK (
        (estado = 'pendiente' AND decided_at IS NULL AND motivo_decision IS NULL)
        OR (estado = 'aprobada' AND decided_at IS NOT NULL AND motivo_decision IS NULL)
        OR (estado = 'rechazada' AND decided_at IS NOT NULL AND motivo_decision IS NOT NULL)
    )
);

CREATE UNIQUE INDEX uq_una_aprobada_por_mascota
    ON svc_adopciones.solicitudes (mascota_id)
    WHERE estado = 'aprobada';

CREATE UNIQUE INDEX uq_pendiente_por_persona
    ON svc_adopciones.solicitudes (mascota_id, documento)
    WHERE estado = 'pendiente';

CREATE INDEX ix_solicitudes_estado
    ON svc_adopciones.solicitudes (estado);
