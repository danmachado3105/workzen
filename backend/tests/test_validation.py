def test_client_with_blank_name_is_rejected(client, auth_headers):
    headers = auth_headers()
    response = client.post(
        "/clients/", json={"name": "   ", "phone": "21999999999"}, headers=headers
    )
    assert response.status_code == 422


def test_client_with_invalid_email_is_rejected(client, auth_headers):
    headers = auth_headers()
    response = client.post(
        "/clients/",
        json={"name": "Maria", "phone": "21999999999", "email": "nao-e-um-email"},
        headers=headers,
    )
    assert response.status_code == 422


def test_client_with_valid_data_still_works(client, auth_headers):
    headers = auth_headers()
    response = client.post(
        "/clients/",
        json={"name": "Maria", "phone": "21999999999", "email": "maria@teste.com"},
        headers=headers,
    )
    assert response.status_code == 201


def test_service_with_zero_price_is_rejected(client, auth_headers):
    headers = auth_headers()
    response = client.post(
        "/services/",
        json={"name": "Corte", "price": "0", "duration_minutes": 30},
        headers=headers,
    )
    assert response.status_code == 422


def test_service_with_negative_price_is_rejected(client, auth_headers):
    headers = auth_headers()
    response = client.post(
        "/services/",
        json={"name": "Corte", "price": "-10", "duration_minutes": 30},
        headers=headers,
    )
    assert response.status_code == 422


def test_service_with_zero_duration_is_rejected(client, auth_headers):
    headers = auth_headers()
    response = client.post(
        "/services/",
        json={"name": "Corte", "price": "40", "duration_minutes": 0},
        headers=headers,
    )
    assert response.status_code == 422


def test_service_with_blank_name_is_rejected(client, auth_headers):
    headers = auth_headers()
    response = client.post(
        "/services/",
        json={"name": "  ", "price": "40", "duration_minutes": 30},
        headers=headers,
    )
    assert response.status_code == 422


def test_service_with_valid_data_still_works(client, auth_headers):
    headers = auth_headers()
    response = client.post(
        "/services/",
        json={"name": "Corte", "price": "40.00", "duration_minutes": 30},
        headers=headers,
    )
    assert response.status_code == 201


def test_appointment_with_zero_amount_charged_is_rejected(client, auth_headers):
    headers = auth_headers()
    client_resp = client.post(
        "/clients/", json={"name": "Cliente", "phone": "111"}, headers=headers
    ).json()
    service_resp = client.post(
        "/services/",
        json={"name": "Serviço", "price": "40.00", "duration_minutes": 30},
        headers=headers,
    ).json()

    from datetime import datetime, timedelta, timezone

    response = client.post(
        "/appointments/",
        json={
            "client_id": client_resp["id"],
            "service_id": service_resp["id"],
            "scheduled_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "amount_charged": "0",
        },
        headers=headers,
    )
    assert response.status_code == 422


def test_register_with_short_password_is_rejected(client):
    response = client.post(
        "/auth/register",
        json={"name": "Teste", "email": "curtinha@teste.com", "password": "1234567"},
    )
    assert response.status_code == 422


def test_register_with_valid_password_still_works(client):
    response = client.post(
        "/auth/register",
        json={"name": "Teste", "email": "valida@teste.com", "password": "12345678"},
    )
    assert response.status_code == 201