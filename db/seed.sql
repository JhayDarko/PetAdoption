BEGIN;

-- Reconstrucción limpia para mantener consistencia entre los dos servicios.
-- Este script es destructivo: elimina los datos y las tablas de ambos esquemas.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DROP SCHEMA IF EXISTS svc_adopciones CASCADE;
DROP SCHEMA IF EXISTS svc_mascotas CASCADE;
CREATE SCHEMA svc_mascotas;
CREATE SCHEMA svc_adopciones;

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

CREATE TABLE IF NOT EXISTS svc_adopciones.solicitudes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mascota_id uuid NOT NULL
        REFERENCES svc_mascotas.mascotas (id)
        ON DELETE RESTRICT,
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

CREATE INDEX IF NOT EXISTS ix_mascotas_estado_especie
    ON svc_mascotas.mascotas (estado, especie);

CREATE UNIQUE INDEX IF NOT EXISTS uq_una_aprobada_por_mascota
    ON svc_adopciones.solicitudes (mascota_id)
    WHERE estado = 'aprobada';

CREATE UNIQUE INDEX IF NOT EXISTS uq_pendiente_por_persona
    ON svc_adopciones.solicitudes (mascota_id, documento)
    WHERE estado = 'pendiente';

CREATE INDEX IF NOT EXISTS ix_solicitudes_estado
    ON svc_adopciones.solicitudes (estado);

INSERT INTO svc_mascotas.mascotas (
    nombre, especie, raza, sexo, edad_meses, tamano, descripcion, foto_url, estado
) VALUES
    ('Luna', 'perro', 'Criollo', 'hembra', 18, 'mediano', 'Cariñosa, juguetona y sociable.', NULL, 'disponible'),
    ('Max', 'perro', 'Labrador', 'macho', 36, 'grande', 'Amigable, activo y obediente.', NULL, 'disponible'),
    ('Rocky', 'perro', 'Criollo', 'macho', 24, 'mediano', 'Le encantan los paseos y jugar.', NULL, 'disponible'),
    ('Nala', 'perro', 'Pastor alemán', 'hembra', 12, 'grande', 'Atenta, inteligente y protectora.', NULL, 'disponible'),
    ('Toby', 'perro', 'Beagle', 'macho', 30, 'mediano', 'Curioso, alegre y sociable.', NULL, 'disponible'),
    ('Maya', 'perro', 'Criollo', 'hembra', 8, 'pequeno', 'Joven, energética y cariñosa.', NULL, 'disponible'),
    ('Michi', 'gato', 'Criollo', 'macho', 14, 'pequeno', 'Tranquilo y afectuoso.', NULL, 'disponible'),
    ('Lola', 'gato', 'Criollo', 'hembra', 20, 'pequeno', 'Curiosa, juguetona y dulce.', NULL, 'disponible'),
    ('Simón', 'gato', 'Criollo', 'macho', 10, 'pequeno', 'Le gusta descansar al sol.', NULL, 'disponible'),
    ('Kira', 'gato', 'Criollo', 'hembra', 16, 'pequeno', 'Sociable y muy cariñosa.', NULL, 'disponible'),
    ('Bruno', 'perro', 'Bulldog', 'macho', 48, 'mediano', 'Noble, tranquilo y compañero.', NULL, 'disponible'),
    ('Canela', 'perro', 'Cocker', 'hembra', 28, 'mediano', 'Dulce y acostumbrada a convivir.', NULL, 'disponible'),
    ('Dante', 'perro', 'Husky', 'macho', 20, 'grande', 'Activo y necesita espacio para correr.', NULL, 'disponible'),
    ('Mila', 'perro', 'Poodle', 'hembra', 42, 'pequeno', 'Tierna, inteligente y tranquila.', NULL, 'disponible'),
    ('Simba', 'gato', 'Criollo', 'macho', 22, 'pequeno', 'Independiente y juguetón.', NULL, 'disponible'),
    ('Nube', 'gato', 'Angora', 'hembra', 18, 'pequeno', 'Suave, calmada y hogareña.', NULL, 'disponible'),
    ('Coco', 'perro', 'Criollo', 'macho', 6, 'pequeno', 'Cachorro juguetón y curioso.', NULL, 'disponible'),
    ('Frida', 'perro', 'Border collie', 'hembra', 32, 'mediano', 'Inteligente y muy activa.', NULL, 'disponible'),
    ('Oliver', 'gato', 'Criollo', 'macho', 26, 'pequeno', 'Amigable y tranquilo.', NULL, 'disponible'),
    ('Mora', 'gato', 'Criollo', 'hembra', 9, 'pequeno', 'Joven y llena de energía.', NULL, 'disponible'),
    ('Bongo', 'perro', 'Boxer', 'macho', 40, 'grande', 'Juguetón y protector.', NULL, 'disponible'),
    ('Atenea', 'perro', 'Criollo', 'hembra', 15, 'mediano', 'Muy dócil y compañera.', NULL, 'disponible'),
    ('Tom', 'gato', 'Criollo', 'macho', 34, 'pequeno', 'Sereno y cariñoso.', NULL, 'disponible'),
    ('Daisy', 'perro', 'Golden retriever', 'hembra', 25, 'grande', 'Amable y familiar.', NULL, 'disponible'),
    ('Ringo', 'perro', 'Criollo', 'macho', 11, 'mediano', 'Sociable y juguetón.', NULL, 'disponible'),
    ('Sasha', 'gato', 'Siamés', 'hembra', 29, 'pequeno', 'Activa y comunicativa.', NULL, 'disponible'),
    ('Paco', 'perro', 'Chihuahua', 'macho', 54, 'pequeno', 'Cariñoso y acostumbrado a interiores.', NULL, 'disponible'),
    ('Eva', 'gato', 'Criollo', 'hembra', 13, 'pequeno', 'Dulce y tranquila.', NULL, 'disponible'),
    ('Teo', 'perro', 'Criollo', 'macho', 19, 'mediano', 'Alegre y obediente.', NULL, 'disponible'),
    ('Kiwi', 'gato', 'Criollo', 'macho', 7, 'pequeno', 'Joven y juguetón.', NULL, 'disponible'),
    ('Zeus', 'perro', 'Rottweiler', 'macho', 44, 'grande', 'Leal y bien entrenado.', NULL, 'adoptada'),
    ('Alma', 'perro', 'Criollo', 'hembra', 21, 'mediano', 'Noble y muy afectuosa.', NULL, 'adoptada'),
    ('Milo', 'gato', 'Criollo', 'macho', 17, 'pequeno', 'Juguetón y sociable.', NULL, 'adoptada'),
    ('Roma', 'perro', 'Pastor belga', 'hembra', 38, 'grande', 'Inteligente y activa.', NULL, 'adoptada'),
    ('Leo', 'gato', 'Criollo', 'macho', 31, 'pequeno', 'Tranquilo y amoroso.', NULL, 'adoptada'),
    ('Salem', 'gato', 'Negro', 'macho', 27, 'pequeno', 'Independiente y elegante.', NULL, 'adoptada'),
    ('Pepa', 'perro', 'Pug', 'hembra', 33, 'pequeno', 'Cariñosa y divertida.', NULL, 'adoptada'),
    ('Chispa', 'perro', 'Criollo', 'hembra', 14, 'pequeno', 'Energética y juguetona.', NULL, 'adoptada'),
    ('Thor', 'perro', 'Mestizo', 'macho', 52, 'grande', 'Noble y protector.', NULL, 'adoptada'),
    ('Lía', 'gato', 'Criollo', 'hembra', 23, 'pequeno', 'Dulce y hogareña.', NULL, 'adoptada'),
    ('Bimba', 'perro', 'Schnauzer', 'hembra', 46, 'mediano', 'Leal y obediente.', NULL, 'adoptada'),
    ('Nacho', 'perro', 'Criollo', 'macho', 10, 'pequeno', 'Joven y juguetón.', NULL, 'adoptada'),
    ('Gala', 'gato', 'Criollo', 'hembra', 36, 'pequeno', 'Serena y afectuosa.', NULL, 'adoptada'),
    ('Rex', 'perro', 'Labrador', 'macho', 41, 'grande', 'Amigable y familiar.', NULL, 'adoptada'),
    ('Mía', 'gato', 'Criollo', 'hembra', 12, 'pequeno', 'Curiosa y cariñosa.', NULL, 'adoptada'),
    ('Tina', 'perro', 'Criollo', 'hembra', 26, 'mediano', 'Sociable y obediente.', NULL, 'disponible'),
    ('Yuki', 'gato', 'Criollo', 'macho', 15, 'pequeno', 'Tranquilo y afectuoso.', NULL, 'disponible'),
    ('Bobby', 'perro', 'Criollo', 'macho', 22, 'mediano', 'Activo y cariñoso.', NULL, 'disponible'),
    ('Estrella', 'perro', 'Criollo', 'hembra', 18, 'mediano', 'Dócil y juguetona.', NULL, 'disponible'),
    ('Pongo', 'perro', 'Dálmata', 'macho', 35, 'grande', 'Energético y amistoso.', NULL, 'disponible');

-- Imágenes directas y estables desde el CDN de Unsplash, según la especie.
WITH mascotas_numeradas AS (
    SELECT
        id,
        especie,
        ((row_number() OVER (PARTITION BY especie ORDER BY nombre) - 1) % 10) + 1 AS imagen_numero
    FROM svc_mascotas.mascotas
),
imagenes(numero, especie, url) AS (
    VALUES
        (1, 'perro', 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&h=600'),
        (2, 'perro', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&h=600'),
        (3, 'perro', 'https://images.unsplash.com/photo-1586917383423-c25e88ac05ce?auto=format&fit=crop&w=800&h=600'),
        (4, 'perro', 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&h=600'),
        (5, 'perro', 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=800&h=600'),
        (6, 'perro', 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&h=600'),
        (7, 'perro', 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=800&h=600'),
        (8, 'perro', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&h=600'),
        (9, 'perro', 'https://images.unsplash.com/photo-1568572933382-74d440642117?auto=format&fit=crop&w=800&h=600'),
        (10, 'perro', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&h=600'),
        (1, 'gato', 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&h=600'),
        (2, 'gato', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&h=600'),
        (3, 'gato', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&h=600'),
        (4, 'gato', 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=800&h=600'),
        (5, 'gato', 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=800&h=600'),
        (6, 'gato', 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=800&h=600'),
        (7, 'gato', 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=800&h=600'),
        (8, 'gato', 'https://images.unsplash.com/photo-1529778873920-4ea4929a7c7e?auto=format&fit=crop&w=800&h=600'),
        (9, 'gato', 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=800&h=600'),
        (10, 'gato', 'https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&w=800&h=600')
)
UPDATE svc_mascotas.mascotas AS mascota
SET foto_url = imagen.url
FROM mascotas_numeradas AS numerada
JOIN imagenes AS imagen
  ON imagen.numero = numerada.imagen_numero
 AND imagen.especie = numerada.especie
WHERE mascota.id = numerada.id;

INSERT INTO svc_adopciones.solicitudes (
    mascota_id, nombre_solicitante, documento, email, telefono, direccion,
    tipo_vivienda, motivo, estado, motivo_decision, decided_at
)
SELECT
    m.id, datos.nombre_solicitante, datos.documento, datos.email, datos.telefono,
    datos.direccion, datos.tipo_vivienda, datos.motivo, datos.estado,
    datos.motivo_decision,
    CASE WHEN datos.estado = 'pendiente' THEN NULL ELSE now() END
FROM svc_mascotas.mascotas m
JOIN (VALUES
    ('Luna', 'Ana Torres', '10000001', 'ana.torres@example.com', '3000000001', 'Calle 10 #12-20', 'apartamento', 'Quiero brindar un hogar responsable, seguro y lleno de cariño.', 'pendiente', NULL),
    ('Max', 'Carlos Ríos', '10000002', 'carlos.rios@example.com', '3000000002', 'Carrera 8 #20-15', 'casa', 'Busco un compañero para mi familia y cuento con tiempo para cuidarlo.', 'pendiente', NULL),
    ('Rocky', 'Laura Gómez', '10000003', 'laura.gomez@example.com', '3000000003', 'Calle 5 #18-30', 'casa', 'Deseo adoptar y ofrecer ejercicio, atención veterinaria y compañía.', 'pendiente', NULL),
    ('Nala', 'Diego Pérez', '10000004', 'diego.perez@example.com', '3000000004', 'Finca El Prado', 'finca', 'Tenemos espacio amplio y experiencia en el cuidado responsable de perros.', 'pendiente', NULL),
    ('Toby', 'Mariana Ruiz', '10000005', 'mariana.ruiz@example.com', '3000000005', 'Calle 22 #4-10', 'apartamento', 'Quiero integrar una mascota a mi hogar y garantizarle bienestar.', 'pendiente', NULL),
    ('Maya', 'Jorge Díaz', '10000006', 'jorge.diaz@example.com', '3000000006', 'Carrera 15 #6-40', 'casa', 'Mi familia está preparada para cuidar y acompañar una nueva mascota.', 'pendiente', NULL),
    ('Michi', 'Valentina León', '10000007', 'valentina.leon@example.com', '3000000007', 'Calle 14 #9-11', 'apartamento', 'Me encantan los gatos y puedo ofrecerle un ambiente seguro y tranquilo.', 'pendiente', NULL),
    ('Lola', 'Andrés Silva', '10000008', 'andres.silva@example.com', '3000000008', 'Calle 30 #2-18', 'casa', 'Deseo adoptar con responsabilidad y darle atención permanente.', 'pendiente', NULL),
    ('Simón', 'Paula Castro', '10000009', 'paula.castro@example.com', '3000000009', 'Carrera 3 #11-09', 'apartamento', 'Quiero ofrecer compañía, alimentación y controles veterinarios.', 'pendiente', NULL),
    ('Kira', 'Santiago Mora', '10000010', 'santiago.mora@example.com', '3000000010', 'Calle 7 #25-50', 'casa', 'Tengo experiencia con animales y deseo darle un hogar definitivo.', 'pendiente', NULL),
    ('Bruno', 'Natalia Vega', '10000011', 'natalia.vega@example.com', '3000000011', 'Calle 12 #7-16', 'apartamento', 'Deseo adoptar una mascota para acompañar responsablemente a mi familia.', 'rechazada', 'La vivienda no cumplía las condiciones requeridas.'),
    ('Canela', 'Felipe Ortiz', '10000012', 'felipe.ortiz@example.com', '3000000012', 'Carrera 9 #14-21', 'casa', 'Quiero brindarle una vida estable, saludable y llena de afecto.', 'rechazada', 'La solicitud no cumplió los requisitos de adopción.'),
    ('Dante', 'Sofía Molina', '10000013', 'sofia.molina@example.com', '3000000013', 'Calle 19 #3-33', 'apartamento', 'Cuento con tiempo y recursos para cuidar responsablemente una mascota.', 'rechazada', 'El tipo de vivienda no era adecuado para esta mascota.'),
    ('Mila', 'Ricardo Peña', '10000014', 'ricardo.pena@example.com', '3000000014', 'Calle 2 #16-44', 'casa', 'Busco una compañera y me comprometo con su salud y bienestar.', 'rechazada', 'La solicitud fue rechazada durante la revisión.'),
    ('Simba', 'Camila Arias', '10000015', 'camila.arias@example.com', '3000000015', 'Carrera 18 #5-12', 'apartamento', 'Quiero ofrecerle un hogar tranquilo y atención durante toda su vida.', 'rechazada', 'No se pudo completar la verificación del solicitante.'),
    ('Zeus', 'Gabriel Vargas', '10000016', 'gabriel.vargas@example.com', '3000000016', 'Finca La Esperanza', 'finca', 'Tenemos experiencia, espacio y compromiso para cuidar a Zeus.', 'aprobada', NULL),
    ('Alma', 'Isabel Navarro', '10000017', 'isabel.navarro@example.com', '3000000017', 'Calle 21 #8-25', 'casa', 'Deseo darle a Alma un hogar permanente, seguro y afectuoso.', 'aprobada', NULL),
    ('Milo', 'David Ramírez', '10000018', 'david.ramirez@example.com', '3000000018', 'Carrera 6 #10-18', 'apartamento', 'Quiero adoptar responsablemente y cuidar todas sus necesidades.', 'aprobada', NULL),
    ('Roma', 'Juliana Restrepo', '10000019', 'juliana.restrepo@example.com', '3000000019', 'Finca Los Pinos', 'finca', 'Roma tendrá espacio, compañía y controles veterinarios permanentes.', 'aprobada', NULL),
    ('Leo', 'Mateo Cárdenas', '10000020', 'mateo.cardenas@example.com', '3000000020', 'Calle 17 #13-41', 'apartamento', 'Puedo ofrecerle una rutina estable y mucho cariño.', 'aprobada', NULL),
    ('Salem', 'Sara Mendoza', '10000021', 'sara.mendoza@example.com', '3000000021', 'Calle 4 #22-10', 'casa', 'Deseo brindarle un hogar seguro y atención responsable.', 'aprobada', NULL),
    ('Pepa', 'Nicolás Pardo', '10000022', 'nicolas.pardo@example.com', '3000000022', 'Carrera 11 #19-07', 'apartamento', 'Me comprometo a cuidar su salud, alimentación y bienestar.', 'aprobada', NULL),
    ('Chispa', 'Daniela Suárez', '10000023', 'daniela.suarez@example.com', '3000000023', 'Calle 8 #6-28', 'casa', 'Quiero compartir mi hogar con una mascota y cuidarla con responsabilidad.', 'aprobada', NULL),
    ('Thor', 'Óscar Beltrán', '10000024', 'oscar.beltran@example.com', '3000000024', 'Finca El Roble', 'finca', 'Contamos con espacio y experiencia para ofrecerle una buena vida.', 'aprobada', NULL),
    ('Lía', 'Manuela Rojas', '10000025', 'manuela.rojas@example.com', '3000000025', 'Calle 26 #1-19', 'apartamento', 'Quiero darle compañía, cuidado y un hogar definitivo.', 'aprobada', NULL),
    ('Bimba', 'Juan Esteban Gil', '10000026', 'juan.gil@example.com', '3000000026', 'Carrera 20 #4-30', 'casa', 'Deseo adoptar con compromiso y mantener sus controles al día.', 'aprobada', NULL),
    ('Nacho', 'Lorena Acosta', '10000027', 'lorena.acosta@example.com', '3000000027', 'Calle 13 #15-22', 'casa', 'Mi familia desea ofrecerle cariño y cuidado permanente.', 'aprobada', NULL),
    ('Gala', 'Esteban Lozano', '10000028', 'esteban.lozano@example.com', '3000000028', 'Carrera 5 #24-08', 'apartamento', 'Puedo ofrecerle un entorno tranquilo, seguro y responsable.', 'aprobada', NULL),
    ('Rex', 'Adriana Parra', '10000029', 'adriana.parra@example.com', '3000000029', 'Finca El Nogal', 'finca', 'Tenemos espacio y compromiso para cuidar a Rex toda su vida.', 'aprobada', NULL),
    ('Mía', 'Tomás Herrera', '10000030', 'tomas.herrera@example.com', '3000000030', 'Calle 9 #17-36', 'casa', 'Quiero brindarle protección, compañía y atención veterinaria.', 'aprobada', NULL)
) AS datos(nombre, nombre_solicitante, documento, email, telefono, direccion, tipo_vivienda, motivo, estado, motivo_decision)
ON m.nombre = datos.nombre;

COMMIT;
