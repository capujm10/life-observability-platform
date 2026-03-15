def login(client) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "demo@personalos.local", "password": "demo123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_weekly_insights_returns_structured_analytics(client):
    token = login(client)

    response = client.get(
        "/api/v1/weekly-insights",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()

    assert "aggregates" in payload
    assert "productivity_change" in payload
    assert "most_consistent_habit" in payload
    assert "journaling_frequency" in payload
    assert "project_activity" in payload

    assert payload["aggregates"]["tasks_completed"]["current_week"] >= 0
    assert payload["aggregates"]["habits_completed"]["current_week"] >= 0
    assert payload["aggregates"]["journal_entries"]["current_week"] >= 0
    assert payload["aggregates"]["project_updates"]["current_week"] >= 0

    assert payload["productivity_change"]["direction"] in {"up", "down", "flat"}
    assert payload["journaling_frequency"]["direction"] in {"up", "down", "flat"}
    assert "projects" in payload["project_activity"]
