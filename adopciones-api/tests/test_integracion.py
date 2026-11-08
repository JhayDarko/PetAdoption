import os
import uuid
from concurrent.futures import ThreadPoolExecutor

import httpx
import pytest


MASCOTAS_URL = os.getenv("MASCOTAS_URL", "").rstrip("/")
ADOPCIONES_URL = os.getenv("ADOPCIONES_URL", "").rstrip("/")
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")
TIMEOUT = 60.0

pytestmark = pytest.mark.skipif(
    not MASCOTAS_URL or not ADOPCIONES_URL or not ADMIN_API_KEY,
    reason="Define MASCOTAS_URL, ADOPCIONES_URL y ADMIN_API_KEY para ejecutar la integración.",
)


def clave_admin() -> dict[str, str]:
    return {"X-API-Key": ADMIN_API_KEY}


def mascota_payload() -> dict[str, object]:
    identificador = uuid.uuid4().hex[:8]
    return {
        "nombre": f"Prueba {identificador}",
        "especie": "perro",
        "raza": "Criollo",
        "sexo": "hembra",
        "edad_meses": 18,
        "tamano": "mediano",
        "descripcion": "Mascota creada por una prueba de integración.",
        "foto_url": None,
    }


def solicitud_payload(mascota_id: str) -> dict[str, object]:
    identificador = uuid.uuid4().hex
    return {
        "mascota_id": mascota_id,
        "nombre_solicitante": f"Solicitante {identificador[:8]}",
        "documento": identificador,
        "email": f"{identificador}@example.com",
        "telefono": "3001234567",
        "direccion": "Calle de pruebas 123",
        "tipo_vivienda": "casa",
        "motivo": "Quiero brindar un hogar responsable, seguro y lleno de cariño.",
    }


def crear_mascota(client: httpx.Client) -> dict:
    response = client.post(
        f"{MASCOTAS_URL}/mascotas",
        headers=clave_admin(),
        json=mascota_payload(),
    )
    assert response.status_code == 201, response.text
    mascota = response.json()
    assert mascota["estado"] == "disponible"
    return mascota


def crear_solicitud(client: httpx.Client, mascota_id: str) -> dict:
    response = client.post(
        f"{ADOPCIONES_URL}/solicitudes",
        timeout=TIMEOUT,
        json=solicitud_payload(mascota_id),
    )
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture
def client():
    with httpx.Client(timeout=TIMEOUT) as http_client:
        yield http_client


def test_it_01_crear_mascota(client):
    mascota = crear_mascota(client)
    assert mascota["estado"] == "disponible"


def test_it_02_crear_solicitud(client):
    mascota = crear_mascota(client)
    solicitud = crear_solicitud(client, mascota["id"])
    assert solicitud["estado"] == "pendiente"
    assert solicitud["mascota_id"] == mascota["id"]


def test_it_03_mascota_inexistente(client):
    response = client.post(
        f"{ADOPCIONES_URL}/solicitudes",
        timeout=TIMEOUT,
        json=solicitud_payload(str(uuid.uuid4())),
    )
    assert response.status_code == 404, response.text


def test_it_04_solicitud_duplicada(client):
    mascota = crear_mascota(client)
    payload = solicitud_payload(mascota["id"])

    primera = client.post(
        f"{ADOPCIONES_URL}/solicitudes",
        timeout=TIMEOUT,
        json=payload,
    )
    segunda = client.post(
        f"{ADOPCIONES_URL}/solicitudes",
        timeout=TIMEOUT,
        json=payload,
    )

    assert primera.status_code == 201, primera.text
    assert segunda.status_code == 409, segunda.text


def test_it_05_aprobar_solicitud_actualiza_mascota(client):
    mascota = crear_mascota(client)
    solicitud = crear_solicitud(client, mascota["id"])

    response = client.patch(
        f"{ADOPCIONES_URL}/solicitudes/{solicitud['id']}/aprobar",
        headers=clave_admin(),
        timeout=TIMEOUT,
    )
    mascota_actualizada = client.get(
        f"{MASCOTAS_URL}/mascotas/{mascota['id']}",
        timeout=TIMEOUT,
    )

    assert response.status_code == 200, response.text
    assert response.json()["estado"] == "aprobada"
    assert mascota_actualizada.status_code == 200, mascota_actualizada.text
    assert mascota_actualizada.json()["estado"] == "adoptada"


def test_it_06_otras_pendientes_quedan_rechazadas(client):
    mascota = crear_mascota(client)
    primera = crear_solicitud(client, mascota["id"])
    segunda = crear_solicitud(client, mascota["id"])

    response = client.patch(
        f"{ADOPCIONES_URL}/solicitudes/{primera['id']}/aprobar",
        headers=clave_admin(),
        timeout=TIMEOUT,
    )
    detalle_segunda = client.get(
        f"{ADOPCIONES_URL}/solicitudes/{segunda['id']}",
        headers=clave_admin(),
        timeout=TIMEOUT,
    )

    assert response.status_code == 200, response.text
    assert detalle_segunda.status_code == 200, detalle_segunda.text
    assert detalle_segunda.json()["estado"] == "rechazada"


def test_it_07_segunda_aprobacion_misma_mascota(client):
    mascota = crear_mascota(client)
    solicitud = crear_solicitud(client, mascota["id"])
    aprobar_url = f"{ADOPCIONES_URL}/solicitudes/{solicitud['id']}/aprobar"

    primera = client.patch(aprobar_url, headers=clave_admin(), timeout=TIMEOUT)
    segunda = client.patch(aprobar_url, headers=clave_admin(), timeout=TIMEOUT)

    assert primera.status_code == 200, primera.text
    assert segunda.status_code == 409, segunda.text


def test_it_08_solicitud_sobre_mascota_adoptada(client):
    mascota = crear_mascota(client)
    solicitud = crear_solicitud(client, mascota["id"])
    aprobar = client.patch(
        f"{ADOPCIONES_URL}/solicitudes/{solicitud['id']}/aprobar",
        headers=clave_admin(),
        timeout=TIMEOUT,
    )
    segunda = client.post(
        f"{ADOPCIONES_URL}/solicitudes",
        timeout=TIMEOUT,
        json=solicitud_payload(mascota["id"]),
    )

    assert aprobar.status_code == 200, aprobar.text
    assert segunda.status_code == 409, segunda.text


def test_it_09_rechazar_mantiene_mascota_disponible(client):
    mascota = crear_mascota(client)
    solicitud = crear_solicitud(client, mascota["id"])

    rechazar = client.patch(
        f"{ADOPCIONES_URL}/solicitudes/{solicitud['id']}/rechazar",
        headers=clave_admin(),
        timeout=TIMEOUT,
        json={"motivo_decision": "No cumple los requisitos definidos para esta solicitud."},
    )
    mascota_actualizada = client.get(
        f"{MASCOTAS_URL}/mascotas/{mascota['id']}",
        timeout=TIMEOUT,
    )

    assert rechazar.status_code == 200, rechazar.text
    assert rechazar.json()["estado"] == "rechazada"
    assert mascota_actualizada.status_code == 200, mascota_actualizada.text
    assert mascota_actualizada.json()["estado"] == "disponible"


def test_it_10_dos_aprobaciones_simultaneas(client):
    mascota = crear_mascota(client)
    primera = crear_solicitud(client, mascota["id"])
    segunda = crear_solicitud(client, mascota["id"])

    def aprobar(solicitud_id: str) -> int:
        response = httpx.patch(
            f"{ADOPCIONES_URL}/solicitudes/{solicitud_id}/aprobar",
            headers=clave_admin(),
            timeout=TIMEOUT,
        )
        return response.status_code

    with ThreadPoolExecutor(max_workers=2) as executor:
        resultados = list(
            executor.map(aprobar, (primera["id"], segunda["id"]))
        )

    assert sorted(resultados) == [200, 409], resultados


def test_it_11_operaciones_admin_sin_clave(client):
    mascota = mascota_payload()
    crear = client.post(
        f"{MASCOTAS_URL}/mascotas",
        json=mascota,
        timeout=TIMEOUT,
    )
    listar = client.get(
        f"{ADOPCIONES_URL}/solicitudes",
        timeout=TIMEOUT,
    )

    assert crear.status_code == 401, crear.text
    assert listar.status_code == 401, listar.text
