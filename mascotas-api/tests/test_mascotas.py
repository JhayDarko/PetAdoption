from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    respuesta = client.get("/health")

    assert respuesta.status_code == 200
    assert respuesta.json() == {"status": "ok", "service": "mascotas"}


def test_crear_mascota_sin_clave_retorna_401() -> None:
    respuesta = client.post(
        "/mascotas",
        json={"nombre": "Luna", "especie": "perro"},
    )

    assert respuesta.status_code == 401
    assert respuesta.json()["detail"] == "Clave de administrador ausente o inválida."


def test_listar_mascotas_con_limite_mayor_a_100_retorna_422() -> None:
    respuesta = client.get("/mascotas?limit=101")

    assert respuesta.status_code == 422
