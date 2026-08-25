from datetime import datetime, timedelta, timezone


def _create_client_and_service(client, headers, client_name="Cliente", service_name="Serviço", price="50.00"):
    client_resp = client.post(
        "/clients/", json={"name": client_name, "phone": "999999999"}, headers=headers
    ).json()
    service_resp = client.post(
        "/services/",
        json={"name": service_name, "price": price, "duration_minutes": 30},
        headers=headers,
    ).json()
    return client_resp, service_resp


def _future_datetime():
    return (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()


def test_create_appointment_with_own_client_and_service(client, auth_headers):
    headers = auth_headers()
    client_resp, service_resp = _create_client_and_service(client, headers)

    response = client.post(
        "/appointments/",
        json={
            "client_id": client_resp["id"],
            "service_id": service_resp["id"],
            "scheduled_at": _future_datetime(),
        },
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "scheduled"
    assert data["payment_status"] == "pending"
    assert data["amount_charged"] == "50.00"


def test_list_appointments_only_shows_own(client, auth_headers):
    headers_a = auth_headers(email="apa@teste.com", name="APA")
    headers_b = auth_headers(email="apb@teste.com", name="APB")

    client_a, service_a = _create_client_and_service(client, headers_a, "Cliente A", "Serviço A")
    client.post(
        "/appointments/",
        json={
            "client_id": client_a["id"],
            "service_id": service_a["id"],
            "scheduled_at": _future_datetime(),
        },
        headers=headers_a,
    )

    response_a = client.get("/appointments/", headers=headers_a)
    response_b = client.get("/appointments/", headers=headers_b)

    assert len(response_a.json()) == 1
    assert len(response_b.json()) == 0


def test_cannot_create_appointment_with_other_users_client(client, auth_headers):
    headers_a = auth_headers(email="capa@teste.com", name="CAPA")
    headers_b = auth_headers(email="capb@teste.com", name="CAPB")

    client_a, _ = _create_client_and_service(client, headers_a, "Cliente A2", "Serviço A2")
    _, service_b = _create_client_and_service(client, headers_b, "Cliente B2", "Serviço B2")

    response = client.post(
        "/appointments/",
        json={
            "client_id": client_a["id"],
            "service_id": service_b["id"],
            "scheduled_at": _future_datetime(),
        },
        headers=headers_b,
    )
    assert response.status_code == 404


def test_cannot_create_appointment_with_other_users_service(client, auth_headers):
    headers_a = auth_headers(email="sapa@teste.com", name="SAPA")
    headers_b = auth_headers(email="sapb@teste.com", name="SAPB")

    _, service_a = _create_client_and_service(client, headers_a, "Cliente A3", "Serviço A3")
    client_b, _ = _create_client_and_service(client, headers_b, "Cliente B3", "Serviço B3")

    response = client.post(
        "/appointments/",
        json={
            "client_id": client_b["id"],
            "service_id": service_a["id"],
            "scheduled_at": _future_datetime(),
        },
        headers=headers_b,
    )
    assert response.status_code == 404


def test_cannot_access_other_users_appointment(client, auth_headers):
    headers_a = auth_headers(email="aapa@teste.com", name="AAPA")
    headers_b = auth_headers(email="aapb@teste.com", name="AAPB")

    client_a, service_a = _create_client_and_service(client, headers_a, "Cliente A4", "Serviço A4")
    created = client.post(
        "/appointments/",
        json={
            "client_id": client_a["id"],
            "service_id": service_a["id"],
            "scheduled_at": _future_datetime(),
        },
        headers=headers_a,
    ).json()

    response = client.get(f"/appointments/{created['id']}", headers=headers_b)
    assert response.status_code == 404


def test_update_own_appointment(client, auth_headers):
    headers = auth_headers(email="upd@teste.com", name="UPD")
    client_resp, service_resp = _create_client_and_service(client, headers, "Cliente Upd", "Serviço Upd")
    created = client.post(
        "/appointments/",
        json={
            "client_id": client_resp["id"],
            "service_id": service_resp["id"],
            "scheduled_at": _future_datetime(),
        },
        headers=headers,
    ).json()

    response = client.put(
        f"/appointments/{created['id']}",
        json={"payment_status": "paid"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["payment_status"] == "paid"


def test_cancel_appointment_does_not_delete_it(client, auth_headers):
    headers = auth_headers(email="cancel@teste.com", name="CANCEL")
    client_resp, service_resp = _create_client_and_service(client, headers, "Cliente Cancel", "Serviço Cancel")
    created = client.post(
        "/appointments/",
        json={
            "client_id": client_resp["id"],
            "service_id": service_resp["id"],
            "scheduled_at": _future_datetime(),
        },
        headers=headers,
    ).json()

    cancel_response = client.post(f"/appointments/{created['id']}/cancel", headers=headers)
    assert cancel_response.status_code == 200
    assert cancel_response.json()["status"] == "canceled"

    # o registro continua existindo e acessível, só o status muda
    get_response = client.get(f"/appointments/{created['id']}", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["status"] == "canceled"


def test_amount_charged_is_independent_from_current_service_price(client, auth_headers):
    headers = auth_headers(email="amount@teste.com", name="AMOUNT")
    client_resp, service_resp = _create_client_and_service(
        client, headers, "Cliente Amount", "Serviço Amount", price="100.00"
    )

    created = client.post(
        "/appointments/",
        json={
            "client_id": client_resp["id"],
            "service_id": service_resp["id"],
            "scheduled_at": _future_datetime(),
        },
        headers=headers,
    ).json()
    assert created["amount_charged"] == "100.00"

    # reajusta o preço do serviço DEPOIS do agendamento já criado
    client.put(
        f"/services/{service_resp['id']}",
        json={"price": "150.00"},
        headers=headers,
    )

    # o agendamento antigo deve manter o valor histórico
    response = client.get(f"/appointments/{created['id']}", headers=headers)
    assert response.json()["amount_charged"] == "100.00"