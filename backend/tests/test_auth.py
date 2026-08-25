def test_register_creates_user(client):
    response = client.post(
        "/auth/register",
        json={"name": "Danilo", "email": "danilo@teste.com", "password": "senha123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "danilo@teste.com"
    assert "password" not in data
    assert "hashed_password" not in data


def test_register_with_duplicate_email_fails(client, create_user):
    create_user(email="duplicado@teste.com")
    response = client.post(
        "/auth/register",
        json={"name": "Outro", "email": "duplicado@teste.com", "password": "outrasenha"},
    )
    assert response.status_code == 400


def test_login_with_correct_credentials_returns_token(client, create_user):
    create_user(email="login@teste.com", password="senha123")
    response = client.post(
        "/auth/login",
        data={"username": "login@teste.com", "password": "senha123"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_with_wrong_password_fails(client, create_user):
    create_user(email="errado@teste.com", password="senha123")
    response = client.post(
        "/auth/login",
        data={"username": "errado@teste.com", "password": "senhaerrada"},
    )
    assert response.status_code == 401


def test_protected_route_without_token_fails(client):
    response = client.get("/clients/")
    assert response.status_code == 401


def test_protected_route_with_valid_token_works(client, auth_headers):
    headers = auth_headers()
    response = client.get("/clients/", headers=headers)
    assert response.status_code == 200
    