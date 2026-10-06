from fastapi.testclient import TestClient

from app import app


def test_health_endpoint_reports_ready() -> None:
    response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_endpoint_allows_local_frontend_origin() -> None:
    response = TestClient(app).get(
        "/health",
        headers={"Origin": "http://localhost:3000"},
    )

    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"