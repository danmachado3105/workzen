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


def _iso(dt):
    return dt.isoformat()


def test_dashboard_summary_counts_active_clients_and_services(client, auth_headers):
    headers = auth_headers(email="dash1@teste.com", name="Dash1")
    _create_client_and_service(client, headers, "Cliente 1", "Serviço 1")
    _create_client_and_service(client, headers, "Cliente 2", "Serviço 2")

    response = client.get("/dashboard/summary", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["active_clients"] == 2
    assert data["active_services"] == 2


def test_dashboard_counts_appointments_by_status(client, auth_headers):
    headers = auth_headers(email="dash2@teste.com", name="Dash2")
    client_resp, service_resp = _create_client_and_service(client, headers)

    future = datetime.now(timezone.utc) + timedelta(days=1)

    # 1 agendamento que ficará "scheduled"
    a1 = client.post(
        "/appointments/",
        json={
            "client_id": client_resp["id"],
            "service_id": service_resp["id"],
            "scheduled_at": _iso(future),
        },
        headers=headers,
    ).json()

    # 1 agendamento que será marcado como "completed"
    a2 = client.post(
        "/appointments/",
        json={
            "client_id": client_resp["id"],
            "service_id": service_resp["id"],
            "scheduled_at": _iso(future + timedelta(hours=1)),
        },
        headers=headers,
    ).json()
    client.post(f"/appointments/{a2['id']}/complete", headers=headers)

    # 1 agendamento que será cancelado
    a3 = client.post(
        "/appointments/",
        json={
            "client_id": client_resp["id"],
            "service_id": service_resp["id"],
            "scheduled_at": _iso(future + timedelta(hours=2)),
        },
        headers=headers,
    ).json()
    client.post(f"/appointments/{a3['id']}/cancel", headers=headers)

    response = client.get("/dashboard/summary", headers=headers)
    data = response.json()

    assert data["appointments_by_status"]["scheduled"] == 1
    assert data["appointments_by_status"]["completed"] == 1
    assert data["appointments_by_status"]["canceled"] == 1
    assert data["appointments_completed"] == 1
    assert data["appointments_canceled"] == 1


def test_dashboard_revenue_only_counts_paid_regardless_of_status(client, auth_headers):
    headers = auth_headers(email="dash3@teste.com", name="Dash3")
    client_resp, service_resp = _create_client_and_service(client, headers, price="100.00")

    future = datetime.now(timezone.utc) + timedelta(days=1)

    # pago, ainda "scheduled" -> deve contar no faturamento (Opção A)
    a1 = client.post(
        "/appointments/",
        json={
            "client_id": client_resp["id"],
            "service_id": service_resp["id"],
            "scheduled_at": _iso(future),
        },
        headers=headers,
    ).json()
    client.put(f"/appointments/{a1['id']}", json={"payment_status": "paid"}, headers=headers)

    # não pago -> não deve contar
    client.post(
        "/appointments/",
        json={
            "client_id": client_resp["id"],
            "service_id": service_resp["id"],
            "scheduled_at": _iso(future + timedelta(hours=1)),
        },
        headers=headers,
    )

    # pago, mas cancelado -> ainda deve contar (regra: só payment_status importa)
    a3 = client.post(
        "/appointments/",
        json={
            "client_id": client_resp["id"],
            "service_id": service_resp["id"],
            "scheduled_at": _iso(future + timedelta(hours=2)),
        },
        headers=headers,
    ).json()
    client.put(f"/appointments/{a3['id']}", json={"payment_status": "paid"}, headers=headers)
    client.post(f"/appointments/{a3['id']}/cancel", headers=headers)

    response = client.get("/dashboard/summary", headers=headers)
    data = response.json()

    assert data["revenue_total"] == "200.00"


def test_dashboard_revenue_current_month_uses_scheduled_at(client, auth_headers):
    headers = auth_headers(email="dash4@teste.com", name="Dash4")
    client_resp, service_resp = _create_client_and_service(client, headers, price="80.00")

    now = datetime.now(timezone.utc)
    this_month = now + timedelta(days=1) if now.day < 27 else now
    next_month_date = (now.replace(day=1) + timedelta(days=40)).replace(day=1)

    a_this_month = client.post(
        "/appointments/",
        json={
            "client_id": client_resp["id"],
            "service_id": service_resp["id"],
            "scheduled_at": _iso(this_month),
        },
        headers=headers,
    ).json()
    client.put(f"/appointments/{a_this_month['id']}", json={"payment_status": "paid"}, headers=headers)

    a_next_month = client.post(
        "/appointments/",
        json={
            "client_id": client_resp["id"],
            "service_id": service_resp["id"],
            "scheduled_at": _iso(next_month_date),
        },
        headers=headers,
    ).json()
    client.put(f"/appointments/{a_next_month['id']}", json={"payment_status": "paid"}, headers=headers)

    response = client.get("/dashboard/summary", headers=headers)
    data = response.json()

    assert data["revenue_current_month"] == "80.00"
    assert data["revenue_total"] == "160.00"


def test_dashboard_is_isolated_between_users(client, auth_headers):
    headers_a = auth_headers(email="dasha@teste.com", name="DashA")
    headers_b = auth_headers(email="dashb@teste.com", name="DashB")

    client_a, service_a = _create_client_and_service(client, headers_a, "Cliente A", "Serviço A")
    future = datetime.now(timezone.utc) + timedelta(days=1)
    appt_a = client.post(
        "/appointments/",
        json={
            "client_id": client_a["id"],
            "service_id": service_a["id"],
            "scheduled_at": _iso(future),
        },
        headers=headers_a,
    ).json()
    client.put(f"/appointments/{appt_a['id']}", json={"payment_status": "paid"}, headers=headers_a)

    response_b = client.get("/dashboard/summary", headers=headers_b)
    data_b = response_b.json()

    assert data_b["active_clients"] == 0
    assert data_b["active_services"] == 0
    assert data_b["appointments_upcoming"] == 0
    assert data_b["revenue_total"] == "0.00" or float(data_b["revenue_total"]) == 0.0


def test_upcoming_appointments_returns_only_future_scheduled_own(client, auth_headers):
    headers_a = auth_headers(email="upcominga@teste.com", name="UpcomingA")
    headers_b = auth_headers(email="upcomingb@teste.com", name="UpcomingB")

    client_a, service_a = _create_client_and_service(client, headers_a, "Cliente UA", "Serviço UA")
    future = datetime.now(timezone.utc) + timedelta(days=2)

    created = client.post(
        "/appointments/",
        json={
            "client_id": client_a["id"],
            "service_id": service_a["id"],
            "scheduled_at": _iso(future),
        },
        headers=headers_a,
    ).json()

    # esse appointment é cancelado, não deve aparecer nos próximos
    client_a2, service_a2 = _create_client_and_service(client, headers_a, "Cliente UA2", "Serviço UA2")
    canceled = client.post(
        "/appointments/",
        json={
            "client_id": client_a2["id"],
            "service_id": service_a2["id"],
            "scheduled_at": _iso(future + timedelta(hours=1)),
        },
        headers=headers_a,
    ).json()
    client.post(f"/appointments/{canceled['id']}/cancel", headers=headers_a)

    response_a = client.get("/dashboard/upcoming-appointments", headers=headers_a)
    ids_a = [a["id"] for a in response_a.json()]
    assert created["id"] in ids_a
    assert canceled["id"] not in ids_a

    response_b = client.get("/dashboard/upcoming-appointments", headers=headers_b)
    assert response_b.json() == []
