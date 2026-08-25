def test_create_client_associates_authenticated_user(client, auth_headers):
    headers = auth_headers()
    response = client.post(
        "/clients/",
        json={"name": "Maria", "phone": "21999999999"},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Maria"
    assert "user_id" not in data


def test_list_clients_only_shows_own(client, auth_headers):
    headers_a = auth_headers(email="a@teste.com", name="A")
    headers_b = auth_headers(email="b@teste.com", name="B")

    client.post("/clients/", json={"name": "Cliente A", "phone": "111"}, headers=headers_a)
    client.post("/clients/", json={"name": "Cliente B", "phone": "222"}, headers=headers_b)

    response_a = client.get("/clients/", headers=headers_a)
    assert [c["name"] for c in response_a.json()] == ["Cliente A"]

    response_b = client.get("/clients/", headers=headers_b)
    assert [c["name"] for c in response_b.json()] == ["Cliente B"]


def test_user_cannot_view_other_users_client(client, auth_headers):
    headers_a = auth_headers(email="a2@teste.com", name="A2")
    headers_b = auth_headers(email="b2@teste.com", name="B2")

    created = client.post(
        "/clients/", json={"name": "Cliente A2", "phone": "333"}, headers=headers_a
    ).json()

    response = client.get(f"/clients/{created['id']}", headers=headers_b)
    assert response.status_code == 404


def test_user_cannot_update_other_users_client(client, auth_headers):
    headers_a = auth_headers(email="a3@teste.com", name="A3")
    headers_b = auth_headers(email="b3@teste.com", name="B3")

    created = client.post(
        "/clients/", json={"name": "Cliente A3", "phone": "444"}, headers=headers_a
    ).json()

    response = client.put(
        f"/clients/{created['id']}", json={"phone": "000"}, headers=headers_b
    )
    assert response.status_code == 404


def test_user_cannot_delete_other_users_client(client, auth_headers):
    headers_a = auth_headers(email="a4@teste.com", name="A4")
    headers_b = auth_headers(email="b4@teste.com", name="B4")

    created = client.post(
        "/clients/", json={"name": "Cliente A4", "phone": "555"}, headers=headers_a
    ).json()

    response = client.delete(f"/clients/{created['id']}", headers=headers_b)
    assert response.status_code == 404