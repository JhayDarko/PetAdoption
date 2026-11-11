BEGIN;

-- Migración no destructiva para instalaciones existentes.
-- Adopciones conserva mascota_id como referencia lógica y valida Mascotas por REST.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS svc_mascotas;
CREATE SCHEMA IF NOT EXISTS svc_adopciones;

CREATE TABLE IF NOT EXISTS svc_adopciones.solicitudes (
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

CREATE OR REPLACE FUNCTION svc_mascotas.actualizar_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF to_regclass('svc_mascotas.mascotas') IS NOT NULL THEN
        DROP TRIGGER IF EXISTS mascotas_updated_at ON svc_mascotas.mascotas;
        CREATE TRIGGER mascotas_updated_at
        BEFORE UPDATE ON svc_mascotas.mascotas
        FOR EACH ROW
        EXECUTE FUNCTION svc_mascotas.actualizar_updated_at();
    END IF;
END $$;

DO $$
DECLARE
    fk record;
BEGIN
    IF to_regclass('svc_adopciones.solicitudes') IS NOT NULL THEN
        FOR fk IN
            SELECT con.conname
            FROM pg_constraint con
            WHERE con.conrelid = 'svc_adopciones.solicitudes'::regclass
              AND con.contype = 'f'
              AND con.confrelid = to_regclass('svc_mascotas.mascotas')
        LOOP
            EXECUTE format(
                'ALTER TABLE svc_adopciones.solicitudes DROP CONSTRAINT %I',
                fk.conname
            );
        END LOOP;
    END IF;
END $$;

-- Normaliza filas antiguas antes de aplicar la nueva invariante.
UPDATE svc_adopciones.solicitudes
SET motivo_decision = COALESCE(NULLIF(trim(motivo_decision), ''), 'Decisión registrada por administración.')
WHERE estado = 'rechazada';

UPDATE svc_adopciones.solicitudes
SET decided_at = COALESCE(decided_at, created_at)
WHERE estado IN ('aprobada', 'rechazada')
  AND decided_at IS NULL;

UPDATE svc_adopciones.solicitudes
SET decided_at = NULL,
    motivo_decision = NULL
WHERE estado = 'pendiente';

ALTER TABLE svc_adopciones.solicitudes
    DROP CONSTRAINT IF EXISTS ck_solicitudes_decision_coherente;

ALTER TABLE svc_adopciones.solicitudes
    ADD CONSTRAINT ck_solicitudes_decision_coherente CHECK (
        (estado = 'pendiente' AND decided_at IS NULL AND motivo_decision IS NULL)
        OR (estado = 'aprobada' AND decided_at IS NOT NULL AND motivo_decision IS NULL)
        OR (estado = 'rechazada' AND decided_at IS NOT NULL AND motivo_decision IS NOT NULL)
    );

CREATE UNIQUE INDEX IF NOT EXISTS uq_una_aprobada_por_mascota
    ON svc_adopciones.solicitudes (mascota_id)
    WHERE estado = 'aprobada';

CREATE UNIQUE INDEX IF NOT EXISTS uq_pendiente_por_persona
    ON svc_adopciones.solicitudes (mascota_id, documento)
    WHERE estado = 'pendiente';

CREATE INDEX IF NOT EXISTS ix_solicitudes_estado
    ON svc_adopciones.solicitudes (estado);

CREATE INDEX IF NOT EXISTS ix_solicitudes_mascota_estado
    ON svc_adopciones.solicitudes (mascota_id, estado);

COMMIT;
