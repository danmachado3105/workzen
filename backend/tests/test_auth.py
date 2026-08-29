def test_register_creates_user(client):
    response = client.post(
        "/auth/register",
        json={"name": "Danilo", "email": "danilo@teste.com", "password": "senha123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Danilo"
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
    create_user(name="Nome do Login", email="login@teste.com", password="senha123")
    response = client.post(
        "/auth/login",
        data={"username": "login@teste.com", "password": "senha123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["name"] == "Nome do Login"
    assert data["user"]["email"] == "login@teste.com"


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


def test_get_me_returns_only_authenticated_user(client, auth_headers):
    headers_a = auth_headers(name="Danilo Machado", email="danilo@teste.com")
    auth_headers(name="Outra Pessoa", email="outra@teste.com")

    response = client.get("/auth/me", headers=headers_a)

    assert response.status_code == 200
    assert response.json()["name"] == "Danilo Machado"
    assert response.json()["email"] == "danilo@teste.com"


def test_get_me_requires_authentication(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_update_me_normalizes_name_and_keeps_other_users_isolated(client, auth_headers):
    headers_a = auth_headers(name="Danilo", email="danilo@teste.com")
    headers_b = auth_headers(name="Outra Pessoa", email="outra@teste.com")

    update_response = client.patch(
        "/auth/me", json={"name": "  Danilo   Machado  "}, headers=headers_a
    )
    other_user_response = client.get("/auth/me", headers=headers_b)

    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Danilo Machado"
    assert other_user_response.json()["name"] == "Outra Pessoa"


def test_update_me_rejects_blank_or_excessively_long_name(client, auth_headers):
    headers = auth_headers()

    blank_response = client.patch("/auth/me", json={"name": "   "}, headers=headers)
    long_response = client.patch("/auth/me", json={"name": "a" * 121}, headers=headers)

    assert blank_response.status_code == 422
    assert long_response.status_code == 422
