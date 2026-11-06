import uuid
from datetime import datetime, timezone

import httpx
import pytest
import respx
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.database import get_db
from app.main import app
from app.models import Base, Solicitud


# Base de datos de prueba
engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

# IDs fijos para las pruebas
MASCOTA_INEXISTENTE = uuid.uuid4()
MASCOTA_DISPONIBLE = uuid.uuid4()
MASCOTA_ADOPTADA = uuid.uuid4()


@pytest.fixture(scope="function", autouse=True)
def setup_teardown_db():
    """Crea y limpia la base de datos antes/después de cada prueba."""
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA IF EXISTS svc_adopciones CASCADE"))
    
    with engine.begin() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS svc_adopciones"))
    
    Base.metadata.create_all(engine)
    yield
    
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA IF EXISTS svc_adopciones CASCADE"))


def test_crear_solicitud_valida():
    """Crear una solicitud válida retorna 201."""
    with respx.mock:
        respx.get(
            f"{settings.MASCOTAS_API_URL}/mascotas/{MASCOTA_DISPONIBLE}/disponibilidad"
        ).mock(
            return_value=httpx.Response(
                200,
                json={"id": str(MASCOTA_DISPONIBLE), "estado": "disponible", "disponible": True},
            )
        )
        
        response = client.post(
            "/solicitudes",
            json={
                "mascota_id": str(MASCOTA_DISPONIBLE),
                "nombre_solicitante": "Juan García",
                "documento": "1234567890",
                "email": "juan@example.com",
                "telefono": "3001234567",
                "direccion": "Calle 123 #45",
                "tipo_vivienda": "casa",
                "motivo": "Deseo adoptar una mascota que acompañe a mi familia en el hogar.",
            },
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["mascota_id"] == str(MASCOTA_DISPONIBLE)
        assert data["estado"] == "pendiente"
        assert data["nombre_solicitante"] == "Juan García"


def test_crear_solicitud_mascota_inexistente():
    """Crear solicitud para mascota inexistente retorna 404."""
    with respx.mock:
        respx.get(
            f"{settings.MASCOTAS_API_URL}/mascotas/{MASCOTA_INEXISTENTE}/disponibilidad"
        ).mock(return_value=httpx.Response(404, json={"detail": "No encontrada"}))
        
        response = client.post(
            "/solicitudes",
            json={
                "mascota_id": str(MASCOTA_INEXISTENTE),
                "nombre_solicitante": "Juan García",
                "documento": "1234567890",
                "email": "juan@example.com",
                "motivo": "Deseo adoptar una mascota que acompañe a mi familia en el hogar.",
            },
        )
        
        assert response.status_code == 404


def test_crear_solicitud_mascota_no_disponible():
    """Crear solicitud para mascota no disponible retorna 409."""
    with respx.mock:
        respx.get(
            f"{settings.MASCOTAS_API_URL}/mascotas/{MASCOTA_ADOPTADA}/disponibilidad"
        ).mock(
            return_value=httpx.Response(
                200,
                json={"id": str(MASCOTA_ADOPTADA), "estado": "adoptada", "disponible": False},
            )
        )
        
        response = client.post(
            "/solicitudes",
            json={
                "mascota_id": str(MASCOTA_ADOPTADA),
                "nombre_solicitante": "Juan García",
                "documento": "1234567890",
                "email": "juan@example.com",
                "motivo": "Deseo adoptar una mascota que acompañe a mi familia en el hogar.",
            },
        )
        
        assert response.status_code == 409


def test_crear_solicitud_sin_autenticacion_es_permitido():
    """La creación de solicitud es pública, no requiere autenticación."""
    with respx.mock:
        respx.get(
            f"{settings.MASCOTAS_API_URL}/mascotas/{MASCOTA_DISPONIBLE}/disponibilidad"
        ).mock(
            return_value=httpx.Response(
                200,
                json={"id": str(MASCOTA_DISPONIBLE), "estado": "disponible", "disponible": True},
            )
        )
        
        response = client.post(
            "/solicitudes",
            json={
                "mascota_id": str(MASCOTA_DISPONIBLE),
                "nombre_solicitante": "Juan García",
                "documento": "1234567890",
                "email": "juan@example.com",
                "motivo": "Deseo adoptar una mascota que acompañe a mi familia en el hogar.",
            },
        )
        
        assert response.status_code == 201


def test_crear_solicitud_duplicada_pendiente_devuelve_409():
    """Crear dos solicitudes pendientes de la misma persona para la misma mascota retorna 409."""
    with respx.mock:
        respx.get(
            f"{settings.MASCOTAS_API_URL}/mascotas/{MASCOTA_DISPONIBLE}/disponibilidad"
        ).mock(
            return_value=httpx.Response(
                200,
                json={"id": str(MASCOTA_DISPONIBLE), "estado": "disponible", "disponible": True},
            )
        )
        
        # Primera solicitud
        response1 = client.post(
            "/solicitudes",
            json={
                "mascota_id": str(MASCOTA_DISPONIBLE),
                "nombre_solicitante": "Juan García",
                "documento": "1234567890",
                "email": "juan@example.com",
                "motivo": "Deseo adoptar una mascota que acompañe a mi familia en el hogar.",
            },
        )
        assert response1.status_code == 201
        
        # Segunda solicitud con el mismo documento y mascota
        response2 = client.post(
            "/solicitudes",
            json={
                "mascota_id": str(MASCOTA_DISPONIBLE),
                "nombre_solicitante": "Juan García",
                "documento": "1234567890",
                "email": "juan@example.com",
                "motivo": "Deseo adoptar una mascota que acompañe a mi familia en el hogar.",
            },
        )
        assert response2.status_code == 409


def test_obtener_seguimiento_por_documento():
    """Obtener seguimiento por documento devuelve las solicitudes de esa persona."""
    with respx.mock:
        respx.get(
            f"{settings.MASCOTAS_API_URL}/mascotas/{MASCOTA_DISPONIBLE}/disponibilidad"
        ).mock(
            return_value=httpx.Response(
                200,
                json={"id": str(MASCOTA_DISPONIBLE), "estado": "disponible", "disponible": True},
            )
        )
        
        # Crear solicitud
        response = client.post(
            "/solicitudes",
            json={
                "mascota_id": str(MASCOTA_DISPONIBLE),
                "nombre_solicitante": "Juan García",
                "documento": "1234567890",
                "email": "juan@example.com",
                "motivo": "Deseo adoptar una mascota que acompañe a mi familia en el hogar.",
            },
        )
        assert response.status_code == 201
        
        # Obtener seguimiento
        response = client.get("/solicitudes/seguimiento?documento=1234567890")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["estado"] == "pendiente"


def test_listar_solicitudes_sin_admin_retorna_401():
    """Listar solicitudes sin API key de admin retorna 401."""
    response = client.get("/solicitudes")
    assert response.status_code == 401


def test_listar_solicitudes_con_admin():
    """Listar solicitudes con API key de admin retorna 200."""
    with respx.mock:
        respx.get(
            f"{settings.MASCOTAS_API_URL}/mascotas/{MASCOTA_DISPONIBLE}/disponibilidad"
        ).mock(
            return_value=httpx.Response(
                200,
                json={"id": str(MASCOTA_DISPONIBLE), "estado": "disponible", "disponible": True},
            )
        )
        
        # Crear solicitud
        client.post(
            "/solicitudes",
            json={
                "mascota_id": str(MASCOTA_DISPONIBLE),
                "nombre_solicitante": "Juan García",
                "documento": "1234567890",
                "email": "juan@example.com",
                "motivo": "Deseo adoptar una mascota que acompañe a mi familia en el hogar.",
            },
        )
        
        # Listar con admin key
        response = client.get(
            "/solicitudes",
            headers={"X-API-Key": settings.ADMIN_API_KEY},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1


def test_aprobar_solicitud():
    """Aprobar solicitud la pasa a aprobada y marca la mascota como adoptada."""
    with respx.mock:
        # Mock disponibilidad
        respx.get(
            f"{settings.MASCOTAS_API_URL}/mascotas/{MASCOTA_DISPONIBLE}/disponibilidad"
        ).mock(
            return_value=httpx.Response(
                200,
                json={"id": str(MASCOTA_DISPONIBLE), "estado": "disponible", "disponible": True},
            )
        )
        
        # Mock marcar adoptada
        respx.patch(
            f"{settings.MASCOTAS_API_URL}/mascotas/{MASCOTA_DISPONIBLE}/estado"
        ).mock(
            return_value=httpx.Response(
                200,
                json={"id": str(MASCOTA_DISPONIBLE), "estado": "adoptada"},
            )
        )
        
        # Crear solicitud
        create_response = client.post(
            "/solicitudes",
            json={
                "mascota_id": str(MASCOTA_DISPONIBLE),
                "nombre_solicitante": "Juan García",
                "documento": "1234567890",
                "email": "juan@example.com",
                "motivo": "Deseo adoptar una mascota que acompañe a mi familia en el hogar.",
            },
        )
        solicitud_id = create_response.json()["id"]
        
        # Aprobar solicitud
        response = client.patch(
            f"/solicitudes/{solicitud_id}/aprobar",
            headers={"X-API-Key": settings.ADMIN_API_KEY},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["estado"] == "aprobada"
        assert data["decided_at"] is not None


def test_aprobar_solicitud_sin_admin_retorna_401():
    """Aprobar solicitud sin admin key retorna 401."""
    solicitud_id = uuid.uuid4()
    response = client.patch(f"/solicitudes/{solicitud_id}/aprobar")
    assert response.status_code == 401


def test_aprobar_solicitud_inexistente_retorna_404():
    """Aprobar solicitud inexistente retorna 404."""
    solicitud_id = uuid.uuid4()
    response = client.patch(
        f"/solicitudes/{solicitud_id}/aprobar",
        headers={"X-API-Key": settings.ADMIN_API_KEY},
    )
    assert response.status_code == 404


def test_aprobar_solicitud_no_pendiente_retorna_409():
    """Aprobar solicitud que no está pendiente retorna 409."""
    with respx.mock:
        respx.get(
            f"{settings.MASCOTAS_API_URL}/mascotas/{MASCOTA_DISPONIBLE}/disponibilidad"
        ).mock(
            return_value=httpx.Response(
                200,
                json={"id": str(MASCOTA_DISPONIBLE), "estado": "disponible", "disponible": True},
            )
        )
        
        respx.patch(
            f"{settings.MASCOTAS_API_URL}/mascotas/{MASCOTA_DISPONIBLE}/estado"
        ).mock(
            return_value=httpx.Response(
                200,
                json={"id": str(MASCOTA_DISPONIBLE), "estado": "adoptada"},
            )
        )
        
        # Crear y aprobar solicitud
        create_response = client.post(
            "/solicitudes",
            json={
                "mascota_id": str(MASCOTA_DISPONIBLE),
                "nombre_solicitante": "Juan García",
                "documento": "1234567890",
                "email": "juan@example.com",
                "motivo": "Deseo adoptar una mascota que acompañe a mi familia en el hogar.",
            },
        )
        solicitud_id = create_response.json()["id"]
        
        # Aprobar una vez
        client.patch(
            f"/solicitudes/{solicitud_id}/aprobar",
            headers={"X-API-Key": settings.ADMIN_API_KEY},
        )
        
        # Intentar aprobar nuevamente
        response = client.patch(
            f"/solicitudes/{solicitud_id}/aprobar",
            headers={"X-API-Key": settings.ADMIN_API_KEY},
        )
        assert response.status_code == 409


def test_aprobar_solicitud_mascota_caida_retorna_503():
    """Aprobar solicitud con Mascotas caída retorna 503 y solicitud sigue pendiente."""
    with respx.mock:
        respx.get(
            f"{settings.MASCOTAS_API_URL}/mascotas/{MASCOTA_DISPONIBLE}/disponibilidad"
        ).mock(
            return_value=httpx.Response(
                200,
                json={"id": str(MASCOTA_DISPONIBLE), "estado": "disponible", "disponible": True},
            )
        )
        
        # Mock error en marcar adoptada
        respx.patch(
            f"{settings.MASCOTAS_API_URL}/mascotas/{MASCOTA_DISPONIBLE}/estado"
        ).mock(side_effect=httpx.ConnectError("Connection error"))
        
        # Crear solicitud
        create_response = client.post(
            "/solicitudes",
            json={
                "mascota_id": str(MASCOTA_DISPONIBLE),
                "nombre_solicitante": "Juan García",
                "documento": "1234567890",
                "email": "juan@example.com",
                "motivo": "Deseo adoptar una mascota que acompañe a mi familia en el hogar.",
            },
        )
        solicitud_id = create_response.json()["id"]
        
        # Intentar aprobar
        response = client.patch(
            f"/solicitudes/{solicitud_id}/aprobar",
            headers={"X-API-Key": settings.ADMIN_API_KEY},
        )
        assert response.status_code == 503
        
        # Verificar que la solicitud sigue pendiente
        db = TestingSessionLocal()
        solicitud = db.query(Solicitud).filter(Solicitud.id == uuid.UUID(solicitud_id)).first()
        assert solicitud.estado == "pendiente"
        db.close()


def test_aprobar_rechaza_otras_pendientes():
    """Aprobar una solicitud rechaza automáticamente las otras pendientes."""
    with respx.mock:
        respx.get(
            f"{settings.MASCOTAS_API_URL}/mascotas/{MASCOTA_DISPONIBLE}/disponibilidad"
        ).mock(
            return_value=httpx.Response(
                200,
                json={"id": str(MASCOTA_DISPONIBLE), "estado": "disponible", "disponible": True},
            )
        )
        
        respx.patch(
            f"{settings.MASCOTAS_API_URL}/mascotas/{MASCOTA_DISPONIBLE}/estado"
        ).mock(
            return_value=httpx.Response(
                200,
                json={"id": str(MASCOTA_DISPONIBLE), "estado": "adoptada"},
            )
        )
        
        # Crear dos solicitudes
        mascota_id_str = str(MASCOTA_DISPONIBLE)
        response1 = client.post(
            "/solicitudes",
            json={
                "mascota_id": mascota_id_str,
                "nombre_solicitante": "Juan García",
                "documento": "1234567890",
                "email": "juan@example.com",
                "motivo": "Deseo adoptar una mascota que acompañe a mi familia en el hogar.",
            },
        )
        solicitud_id_1 = response1.json()["id"]
        
        response2 = client.post(
            "/solicitudes",
            json={
                "mascota_id": mascota_id_str,
                "nombre_solicitante": "María López",
                "documento": "0987654321",
                "email": "maria@example.com",
                "motivo": "Quiero adoptar un perro para mi casa en el campo donde hay mucho espacio.",
            },
        )
        solicitud_id_2 = response2.json()["id"]
        
        # Aprobar la primera
        client.patch(
            f"/solicitudes/{solicitud_id_1}/aprobar",
            headers={"X-API-Key": settings.ADMIN_API_KEY},
        )
        
        # Verificar que la segunda está rechazada
        db = TestingSessionLocal()
        solicitud_2 = db.query(Solicitud).filter(Solicitud.id == uuid.UUID(solicitud_id_2)).first()
        assert solicitud_2.estado == "rechazada"
        assert "adoptada por otra solicitud" in solicitud_2.motivo_decision
        db.close()


def test_rechazar_solicitud():
    """Rechazar solicitud la pasa a rechazada."""
    with respx.mock:
        respx.get(
            f"{settings.MASCOTAS_API_URL}/mascotas/{MASCOTA_DISPONIBLE}/disponibilidad"
        ).mock(
            return_value=httpx.Response(
                200,
                json={"id": str(MASCOTA_DISPONIBLE), "estado": "disponible", "disponible": True},
            )
        )
        
        # Crear solicitud
        create_response = client.post(
            "/solicitudes",
            json={
                "mascota_id": str(MASCOTA_DISPONIBLE),
                "nombre_solicitante": "Juan García",
                "documento": "1234567890",
                "email": "juan@example.com",
                "motivo": "Deseo adoptar una mascota que acompañe a mi familia en el hogar.",
            },
        )
        solicitud_id = create_response.json()["id"]
        
        # Rechazar solicitud
        response = client.patch(
            f"/solicitudes/{solicitud_id}/rechazar",
            json={"motivo_decision": "El solicitante no cumple con los requisitos."},
            headers={"X-API-Key": settings.ADMIN_API_KEY},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["estado"] == "rechazada"
        assert data["motivo_decision"] == "El solicitante no cumple con los requisitos."


def test_rechazar_solicitud_sin_admin_retorna_401():
    """Rechazar solicitud sin admin key retorna 401."""
    solicitud_id = uuid.uuid4()
    response = client.patch(
        f"/solicitudes/{solicitud_id}/rechazar",
        json={"motivo_decision": "Motivo"},
    )
    assert response.status_code == 401


def test_segunda_aprobacion_misma_mascota_retorna_409():
    """Intentar aprobar dos solicitudes de la misma mascota retorna 409."""
    with respx.mock:
        respx.get(
            f"{settings.MASCOTAS_API_URL}/mascotas/{MASCOTA_DISPONIBLE}/disponibilidad"
        ).mock(
            return_value=httpx.Response(
                200,
                json={"id": str(MASCOTA_DISPONIBLE), "estado": "disponible", "disponible": True},
            )
        )
        
        respx.patch(
            f"{settings.MASCOTAS_API_URL}/mascotas/{MASCOTA_DISPONIBLE}/estado"
        ).mock(
            return_value=httpx.Response(
                200,
                json={"id": str(MASCOTA_DISPONIBLE), "estado": "adoptada"},
            )
        )
        
        mascota_id_str = str(MASCOTA_DISPONIBLE)
        
        # Crear dos solicitudes
        response1 = client.post(
            "/solicitudes",
            json={
                "mascota_id": mascota_id_str,
                "nombre_solicitante": "Juan García",
                "documento": "1234567890",
                "email": "juan@example.com",
                "motivo": "Deseo adoptar una mascota que acompañe a mi familia en el hogar.",
            },
        )
        solicitud_id_1 = response1.json()["id"]
        
        response2 = client.post(
            "/solicitudes",
            json={
                "mascota_id": mascota_id_str,
                "nombre_solicitante": "María López",
                "documento": "0987654321",
                "email": "maria@example.com",
                "motivo": "Quiero adoptar un perro para mi casa en el campo donde hay mucho espacio.",
            },
        )
        solicitud_id_2 = response2.json()["id"]
        
        # Aprobar la primera
        client.patch(
            f"/solicitudes/{solicitud_id_1}/aprobar",
            headers={"X-API-Key": settings.ADMIN_API_KEY},
        )
        
        # Intentar aprobar la segunda también
        response = client.patch(
            f"/solicitudes/{solicitud_id_2}/aprobar",
            headers={"X-API-Key": settings.ADMIN_API_KEY},
        )
        assert response.status_code == 409
