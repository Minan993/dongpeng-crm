from app.security import hash_password, verify_password, create_access_token, decode_token


def test_password_hash_and_verify():
    h = hash_password("Admin@12345")
    assert verify_password("Admin@12345", h)


def test_create_and_decode_token():
    token = create_access_token("user-1")
    assert decode_token(token) == "user-1"
