def test_health_check(client):
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_login_and_dashboard(client):
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "demo@personalos.local", "password": "demo123"},
    )
    assert login_response.status_code == 200

    token = login_response.json()["access_token"]
    dashboard_response = client.get(
        "/api/v1/dashboard/overview",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert dashboard_response.status_code == 200
    payload = dashboard_response.json()
    assert payload["stats"]["open_tasks"] >= 1
    assert payload["active_projects"]
