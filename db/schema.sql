CREATE SCHEMA IF NOT EXISTS svc_mascotas;
CREATE SCHEMA IF NOT EXISTS svc_adopciones;

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
    decided_at timestamptz
);

CREATE UNIQUE INDEX uq_una_aprobada_por_mascota
    ON svc_adopciones.solicitudes (mascota_id)
    WHERE estado = 'aprobada';

CREATE UNIQUE INDEX uq_pendiente_por_persona
    ON svc_adopciones.solicitudes (mascota_id, documento)
    WHERE estado = 'pendiente';

CREATE INDEX ix_solicitudes_estado
    ON svc_adopciones.solicitudes (estado);
