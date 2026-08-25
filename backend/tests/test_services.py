def test_create_service_associates_authenticated_user(client, auth_headers):
    headers = auth_headers()
    response = client.post(
        "/services/",
        json={"name": "Corte", "price": "40.00", "duration_minutes": 40},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Corte"
    assert "user_id" not in data


def test_list_services_only_shows_own(client, auth_headers):
    headers_a = auth_headers(email="sa@teste.com", name="SA")
    headers_b = auth_headers(email="sb@teste.com", name="SB")

    client.post(
        "/services/",
        json={"name": "Serviço A", "price": "10.00", "duration_minutes": 30},
        headers=headers_a,
    )
    client.post(
        "/services/",
        json={"name": "Serviço B", "price": "20.00", "duration_minutes": 20},
        headers=headers_b,
    )

    response_a = client.get("/services/", headers=headers_a)
    assert [s["name"] for s in response_a.json()] == ["Serviço A"]


def test_user_cannot_access_other_users_service(client, auth_headers):
    headers_a = auth_headers(email="sa2@teste.com", name="SA2")
    headers_b = auth_headers(email="sb2@teste.com", name="SB2")

    created = client.post(
        "/services/",
        json={"name": "Serviço A2", "price": "15.00", "duration_minutes": 25},
        headers=headers_a,
    ).json()

    response = client.get(f"/services/{created['id']}", headers=headers_b)
    assert response.status_code == 404