def login(client) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "demo@personalos.local", "password": "demo123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_metrics_overview_includes_observability_datasets(client):
    token = login(client)

    response = client.get(
        "/api/v1/metrics/overview",
        headers={"Authorization": f"Bearer {token}"},
        params={"days": 14},
    )

    assert response.status_code == 200
    payload = response.json()

    assert "task_completion_trend" in payload
    assert "habit_consistency_heatmap" in payload
    assert "journal_activity_timeline" in payload
    assert "project_progress_velocity" in payload
    assert payload["summary"]["tasks_completed"] >= 0
    assert len(payload["task_completion_trend"]) == 14
    assert len(payload["journal_activity_timeline"]) == 14
