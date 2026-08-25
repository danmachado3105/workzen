import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db

SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def create_user(client):
    def _create_user(name="Test User", email="test@example.com", password="senha123"):
        return client.post(
            "/auth/register",
            json={"name": name, "email": email, "password": password},
        )
    return _create_user


@pytest.fixture
def auth_headers(client, create_user):
    def _auth_headers(name="Test User", email="test@example.com", password="senha123"):
        create_user(name=name, email=email, password=password)
        login_response = client.post(
            "/auth/login",
            data={"username": email, "password": password},
        )
        token = login_response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return _auth_headers