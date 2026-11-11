BEGIN;

-- Seed seguro y repetible para el catálogo de Mascotas.
-- No crea solicitudes: esas deben nacer únicamente desde la API de Adopciones.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS svc_mascotas;
CREATE SCHEMA IF NOT EXISTS svc_adopciones;

CREATE TABLE IF NOT EXISTS svc_mascotas.mascotas (
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

DROP TRIGGER IF EXISTS mascotas_updated_at ON svc_mascotas.mascotas;
CREATE TRIGGER mascotas_updated_at
BEFORE UPDATE ON svc_mascotas.mascotas
FOR EACH ROW
EXECUTE FUNCTION svc_mascotas.actualizar_updated_at();

CREATE INDEX IF NOT EXISTS ix_mascotas_estado_especie
    ON svc_mascotas.mascotas (estado, especie);

INSERT INTO svc_mascotas.mascotas (
    nombre, especie, raza, sexo, edad_meses, tamano, descripcion, foto_url, estado
)
SELECT datos.nombre, datos.especie, datos.raza, datos.sexo, datos.edad_meses,
       datos.tamano, datos.descripcion, datos.foto_url, datos.estado
FROM (
    VALUES
        ('Luna', 'perro', 'Criollo', 'hembra', 18, 'mediano', 'Cariñosa, juguetona y sociable.', 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Max', 'perro', 'Labrador', 'macho', 36, 'grande', 'Amigable, activo y obediente.', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Rocky', 'perro', 'Criollo', 'macho', 24, 'mediano', 'Le encantan los paseos y jugar.', 'https://images.unsplash.com/photo-1586917383423-c25e88ac05ce?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Nala', 'perro', 'Pastor alemán', 'hembra', 12, 'grande', 'Atenta, inteligente y protectora.', 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Toby', 'perro', 'Beagle', 'macho', 30, 'mediano', 'Curioso, alegre y sociable.', 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Maya', 'perro', 'Criollo', 'hembra', 8, 'pequeno', 'Joven, energética y cariñosa.', 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Michi', 'gato', 'Criollo', 'macho', 14, 'pequeno', 'Tranquilo y afectuoso.', 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Lola', 'gato', 'Criollo', 'hembra', 20, 'pequeno', 'Curiosa, juguetona y dulce.', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Simón', 'gato', 'Criollo', 'macho', 10, 'pequeno', 'Le gusta descansar al sol.', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Kira', 'gato', 'Criollo', 'hembra', 16, 'pequeno', 'Sociable y muy cariñosa.', 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Bruno', 'perro', 'Bulldog', 'macho', 48, 'mediano', 'Noble, tranquilo y compañero.', 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Canela', 'perro', 'Cocker', 'hembra', 28, 'mediano', 'Dulce y acostumbrada a convivir.', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Dante', 'perro', 'Husky', 'macho', 20, 'grande', 'Activo y necesita espacio para correr.', 'https://images.unsplash.com/photo-1568572933382-74d440642117?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Mila', 'perro', 'Poodle', 'hembra', 42, 'pequeno', 'Tierna, inteligente y tranquila.', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Simba', 'gato', 'Criollo', 'macho', 22, 'pequeno', 'Independiente y juguetón.', 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Nube', 'gato', 'Angora', 'hembra', 18, 'pequeno', 'Suave, calmada y hogareña.', 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Coco', 'perro', 'Criollo', 'macho', 6, 'pequeno', 'Cachorro juguetón y curioso.', 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Frida', 'perro', 'Border collie', 'hembra', 32, 'mediano', 'Inteligente y muy activa.', 'https://images.unsplash.com/photo-1529778873920-4ea4929a7c7e?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Oliver', 'gato', 'Criollo', 'macho', 26, 'pequeno', 'Amigable y tranquilo.', 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Mora', 'gato', 'Criollo', 'hembra', 9, 'pequeno', 'Joven y llena de energía.', 'https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&w=800&h=600', 'disponible'),
        ('Zeus', 'perro', 'Rottweiler', 'macho', 44, 'grande', 'Leal y bien entrenado.', NULL, 'adoptada'),
        ('Alma', 'perro', 'Criollo', 'hembra', 21, 'mediano', 'Noble y muy afectuosa.', NULL, 'adoptada'),
        ('Milo', 'gato', 'Criollo', 'macho', 17, 'pequeno', 'Juguetón y sociable.', NULL, 'adoptada'),
        ('Roma', 'perro', 'Pastor belga', 'hembra', 38, 'grande', 'Inteligente y activa.', NULL, 'adoptada'),
        ('Leo', 'gato', 'Criollo', 'macho', 31, 'pequeno', 'Tranquilo y amoroso.', NULL, 'adoptada')
) AS datos(nombre, especie, raza, sexo, edad_meses, tamano, descripcion, foto_url, estado)
WHERE NOT EXISTS (
    SELECT 1
    FROM svc_mascotas.mascotas existente
    WHERE existente.nombre = datos.nombre
);

COMMIT;
