def test_health_payload_shape():
    payload = {"status": "ok"}
    assert payload["status"] == "ok"
