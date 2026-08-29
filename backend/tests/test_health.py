from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db


def test_health_check_confirms_database_readiness(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_check_hides_database_errors(client):
    class UnavailableDatabase:
        def execute(self, _statement):
            raise SQLAlchemyError("connection details must not be exposed")

    def override_get_db():
        yield UnavailableDatabase()

    client.app.dependency_overrides[get_db] = override_get_db
    try:
        response = client.get("/health")
    finally:
        client.app.dependency_overrides.pop(get_db)

    assert response.status_code == 503
    assert response.json() == {"detail": "Banco de dados indisponível."}
