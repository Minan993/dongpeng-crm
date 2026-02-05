from app.models import RoleCode


def test_role_count():
    assert len(RoleCode) >= 7
