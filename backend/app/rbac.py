from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .deps import get_current_user
from .models import User, UserRole, Role, RolePermission, Permission


def get_user_roles(db: Session, user_id: str) -> list[str]:
    rows = (
        db.query(Role.code)
        .join(UserRole, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == user_id)
        .all()
    )
    return [r[0] for r in rows]


def get_user_permissions(db: Session, user_id: str) -> list[str]:
    rows = (
        db.query(Permission.code)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(Role, Role.id == RolePermission.role_id)
        .join(UserRole, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == user_id)
        .all()
    )
    return sorted(list({r[0] for r in rows}))


def require_perm(perm_code: str):
    def checker(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
        roles = get_user_roles(db, str(current.id))
        if "super_admin" in roles:
            return current
        perms = get_user_permissions(db, str(current.id))
        if perm_code not in perms:
            raise HTTPException(status_code=403, detail=f"缺少权限: {perm_code}")
        return current

    return checker
