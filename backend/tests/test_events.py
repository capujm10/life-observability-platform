def login(client) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "demo@personalos.local", "password": "demo123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_create_and_list_custom_events(client):
    token = login(client)

    create_response = client.post(
        "/api/v1/events",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "event_type": "focus_session",
            "value": 45.0,
            "metadata": {"source": "test", "label": "deep-work"},
        },
    )

    assert create_response.status_code == 201
    payload = create_response.json()
    assert payload["event_type"] == "focus_session"
    assert payload["value"] == 45.0
    assert payload["metadata"]["source"] == "test"

    list_response = client.get(
        "/api/v1/events",
        headers={"Authorization": f"Bearer {token}"},
        params={"event_type": "focus_session", "limit": 10},
    )

    assert list_response.status_code == 200
    assert any(event["id"] == payload["id"] for event in list_response.json())


def test_productivity_actions_auto_log_events(client):
    token = login(client)
    headers = {"Authorization": f"Bearer {token}"}

    task_response = client.post(
        "/api/v1/tasks",
        headers=headers,
        json={
            "title": "Auto-log test task",
            "description": "Created for event assertions.",
            "status": "todo",
            "priority": "high",
            "estimated_minutes": 30,
            "focus_minutes": 10,
        },
    )
    assert task_response.status_code == 201
    task_id = task_response.json()["id"]

    complete_response = client.put(
        f"/api/v1/tasks/{task_id}",
        headers=headers,
        json={"status": "done"},
    )
    assert complete_response.status_code == 200

    habit_response = client.post(
        "/api/v1/habits",
        headers=headers,
        json={
            "name": "Auto-log habit",
            "description": "Created for event assertions.",
            "color": "#0f766e",
            "target_frequency": "daily",
            "target_days_per_week": 5,
            "is_active": True,
        },
    )
    assert habit_response.status_code == 201
    habit_id = habit_response.json()["id"]

    habit_log_response = client.post(
        f"/api/v1/habits/{habit_id}/logs",
        headers=headers,
        json={"completed": True},
    )
    assert habit_log_response.status_code == 200

    journal_response = client.post(
        "/api/v1/journal-entries",
        headers=headers,
        json={
            "title": "Auto-log journal",
            "content": "Created for event assertions.",
            "entry_date": "2026-03-15",
            "mood_score": 4,
            "focus_score": 4,
        },
    )
    assert journal_response.status_code == 201
    journal_id = journal_response.json()["id"]

    task_events = client.get(
        "/api/v1/events",
        headers=headers,
        params={"event_type": "task_completed", "limit": 200},
    ).json()
    habit_events = client.get(
        "/api/v1/events",
        headers=headers,
        params={"event_type": "habit_completed", "limit": 200},
    ).json()
    journal_events = client.get(
        "/api/v1/events",
        headers=headers,
        params={"event_type": "journal_entry_created", "limit": 200},
    ).json()

    assert any(event["metadata"]["task_id"] == task_id for event in task_events)
    assert any(event["metadata"]["habit_id"] == habit_id for event in habit_events)
    assert any(event["metadata"]["journal_entry_id"] == journal_id for event in journal_events)
